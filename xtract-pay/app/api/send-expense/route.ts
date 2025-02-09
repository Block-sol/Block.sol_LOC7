import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    setDoc,
    Timestamp,
    doc
} from 'firebase/firestore';

// TypeScript interfaces
interface BillItems {
    [key: string]: string;
}

interface BillData {
    vendor_name: string;
    amount: string;
    category: string;
    expense_date: string;
    submission_date: string;
    description: string;
    bill_id: string;
    phone_number: string;
    gstno: string;
    bill_items: BillItems;
    tax_percent: string;
    expense_id: string;
    employee_id: string;
    violations: string[];
    validation_result: string;
    image_url: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

// Helper function to send email notification
async function sendEmailNotification(billData: any) {
    try {
        const emailApiUrl = 'https://9126-14-139-125-227.ngrok-free.app/send-summary-email';
        
        // Log the request body before sending
        console.log('Sending email notification with data:', billData);
        
        const response = await fetch(emailApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            throw new Error(`Email API responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Email notification result:', result);
        return result;
    } catch (error) {
        console.error('Error sending email notification:', error);
        throw error;
    }
}

// POST handler
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const billData: BillData = await request.json();

        // Validate required fields
        if (!billData.phone_number) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Phone number is required' 
                },
                { status: 400 }
            );
        }

        // Find employee by phone number
        const employeesRef = collection(db, 'Employee');
        const q = query(employeesRef, where('phone_number', '==', billData.phone_number));
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot:', querySnapshot);

        if (querySnapshot.empty) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Employee not found with the provided phone number'
                },
                { status: 404 }
            );
        }

        // Get employee ID from the first matching document
        const employeeDoc = querySnapshot.docs[0];
        const employeeId = employeeDoc.data().employeeId;

        // Prepare bill data for Firestore
        const billToStore = {
            ...billData,
            employee_id: employeeId,
            created_at: Timestamp.now(),
            expense_date: Timestamp.fromDate(new Date(billData.expense_date)),
            submission_date: Timestamp.fromDate(new Date(billData.submission_date)),
            validation_result: billData.validation_result,
            amount: parseFloat(billData.amount.replace(/[$,]/g, '')),
            status: 'pending',
            last_updated: Timestamp.now()
        };

        // Add to Bills collection
        const documentId = `${billData.vendor_name.toLowerCase().replace(/\s+/g, '-')}-${billData.bill_id}`;
        const billsRef = doc(db, 'Bills', documentId);
        
        await setDoc(billsRef, billToStore);

        // Send email notification with the stored data
        try {
            await sendEmailNotification({
                ...billToStore,
                doc_id: documentId,
                manager_email: "nitinbilla10@gmail.com",
                created_at: billToStore.created_at.toDate().toISOString(),
                expense_date: billToStore.expense_date.toDate().toISOString(),
                submission_date: billToStore.submission_date.toDate().toISOString(),
                last_updated: billToStore.last_updated.toDate().toISOString()
            });
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue with the response even if email fails
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Bill processed successfully',
                data: {
                    doc_id: documentId,
                    employee_id: employeeId
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error processing bill:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Optional: Handle unsupported methods
export async function GET(request: NextRequest) {
    return NextResponse.json(
        { 
            success: false, 
            message: 'Method not allowed' 
        },
        { status: 405 }
    );
}