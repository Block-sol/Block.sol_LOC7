// services/managerFirestore.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { BillData } from '@/types';

// Get manager's employee list
export const getManagerEmployees = async (managerId: string) => {
  try {
    const managerDoc = await getDoc(doc(db, 'Manager', managerId));
    if (!managerDoc.exists()) return [];
    return managerDoc.data().employees || [];
  } catch (error) {
    console.error('Error fetching manager employees:', error);
    throw error;
  }
};

// Add employee to manager
export const addEmployeeToManager = async (managerId: string, employeeId: string) => {
  try {
    const managerRef = doc(db, 'Manager', managerId);
    await updateDoc(managerRef, {
      employees: arrayUnion(employeeId)
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

// Remove employee from manager
export const removeEmployeeFromManager = async (managerId: string, employeeId: string) => {
  try {
    const managerRef = doc(db, 'Managers', managerId);
    await updateDoc(managerRef, {
      employees: arrayRemove(employeeId)
    });
  } catch (error) {
    console.error('Error removing employee:', error);
    throw error;
  }
};

// Get all bills for manager's employees
export const getEmployeeBills = async (employeeIds: string[]) => {
  try {
    if (!employeeIds.length) return [];
    
    const billsRef = collection(db, 'Bills');
    const q = query(billsRef, where('employee_id', 'in', employeeIds));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        bill_id: data.bill_id,
        amount: data.amount,
        category: data.category,
        employee_id: data.employee_id,
        description: data.description,
        is_manager_approved: data.is_manager_approved,
        rejection_reason: data.rejection_reason,
        expense_date: data.expense_date,
        is_flagged: data.is_flagged,
        payment_type: data.payment_type,
        submission_date: data.submission_date,
        vendor: data.vendor
      } as BillData;
    });
  } catch (error) {
    console.error('Error fetching employee bills:', error);
    throw error;
  }
};

// Update bill approval status
export const updateBillApproval = async (billId: string, isApproved: string, rejectionReason?: string) => {
  try {
    const billRef = doc(db, 'Bills', billId);
    await updateDoc(billRef, {
      is_manager_approved: isApproved,
      ...(rejectionReason && { rejection_reason: rejectionReason })
    });
  } catch (error) {
    console.error('Error updating bill approval:', error);
    throw error;
  }
};