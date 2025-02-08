export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type GrievanceStatus = 'pending' | 'resolved' | 'rejected';

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