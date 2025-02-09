// types/index.ts
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type GrievanceStatus = 'pending' | 'resolved' | 'rejected';

export interface BillData {
  bill_id: string;
  amount: string;
  category: string;
  employee_id: string;
  expense_date: any; // Firestore Timestamp
  is_flagged: boolean;
  is_manager_approved: string;
  payment_type: string;
  submission_date: any; // Firestore Timestamp
  vendor_name: string;
  description?: string;
  rejection_reason?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: string;
  category: string;
  vendor: string;
  status: ExpenseStatus;
  description?: string;
  createdAt: string;
  rejectionReason?: string;
  is_manager_approved: string;
  is_flagged: boolean;
}

export interface GrievanceData {
  grievance_id: string;
  employee_id: string;
  bill_id: string;
  description: string;
  status: GrievanceStatus;
  submission_date: any; // Firestore Timestamp
  attachments?: string[];
}

export interface Grievance {
  id: string;
  expenseId: string;
  status: GrievanceStatus;
  submittedDate: string;
  lastUpdate: string;
  description: string;
}