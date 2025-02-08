export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type GrievanceStatus = 'pending' | 'resolved' | 'rejected';
import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  vendor: string;
  status: ExpenseStatus;
  rejectionReason?: string;
  attachments?: string[];
  description?: string;
  createdAt: string;
}

export interface Grievance {
  id: string;
  expenseId: string;
  description: string;
  status: GrievanceStatus;
  response?: string;
}

export interface BillData {
  bill_id: string;
  amount: number;
  category: string;
  employee_id: string;
  expense_date: Timestamp;
  is_flagged: boolean;
  is_manager_approved: boolean;
  payment_type: string;
  submission_date: Timestamp;
  vendor: string;
}

export interface GrievanceData {
  grievance_id: string;
  employee_id: string;
  bill_id: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  submission_date: Timestamp;
  attachments?: string[];
}