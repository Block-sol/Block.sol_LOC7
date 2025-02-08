import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { BillData, GrievanceData } from '@/types';

interface ReceiptData {
    amount: string;
    category: string;
    employee_id: string;
    expense_date: Date;
    payment_type: string;
    vendor: string;
    description?: string;
    gst_no?: string;
    bill_items?: Record<string, number>;
    tax_percent?: number;
  }


export const submitBill = async (
  billNumber: string,
  vendor: string,
  data: ReceiptData
) => {
  const documentId = `${vendor.toLowerCase().replace(/\s+/g, '-')}-${billNumber}`;
  
  const billData = {
    bill_id: documentId,
    amount: data.amount,
    category: data.category,
    employee_id: data.employee_id,
    expense_date: Timestamp.fromDate(data.expense_date),
    is_flagged: false,
    is_manager_approved: "pending",
    payment_type: data.payment_type,
    submission_date: serverTimestamp(),
    vendor: data.vendor,
    description: data.description || '',
    gst_no: data.gst_no || '',
    bill_items: data.bill_items || {},
    tax_percent: data.tax_percent || 0
  };

  try {
    // Check if bill already exists
    const billRef = doc(db, 'Bills', documentId);
    await setDoc(billRef, billData);
    return documentId;
  } catch (error) {
    console.error('Error submitting bill:', error);
    throw error;
  }
};

export const submitGrievance = async (
  employee_id: string,
  bill_id: string,
  description: string,
  attachments?: string[]
) => {
  try {
    // Generate grievance ID
    const querySnapshot = await getDocs(collection(db, 'Grievances'));
    const grievanceCount = querySnapshot.size;
    const grievance_id = `grv_${grievanceCount + 1}`;

    const grievanceData: GrievanceData = {
      grievance_id,
      employee_id,
      bill_id,
      description,
      status: 'pending',
      submission_date: Timestamp.fromDate(new Date()),
      attachments
    };

    await setDoc(doc(db, 'Grievances', grievance_id), grievanceData);
    return grievance_id;
  } catch (error) {
    console.error('Error submitting grievance:', error);
    throw error;
  }
};

export const getBillsByEmployeeId = async (employee_id: string) => {
  try {
    const billsRef = collection(db, 'Bills');
    const q = query(billsRef, where('employee_id', '==', employee_id));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
};

export const getGrievancesByEmployeeId = async (employee_id: string) => {
  try {
    const grievancesRef = collection(db, 'Grievances');
    const q = query(grievancesRef, where('employee_id', '==', employee_id));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching grievances:', error);
    throw error;
  }
};