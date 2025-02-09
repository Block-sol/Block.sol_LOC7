// types/admin.ts
import { BillData } from "./Expensetypes";

export interface ValidationResult {
    bill_valid: boolean;
    reason?: string;
  }
  
  export interface SpendingControl {
    id: string;
    type: 'department' | 'category';
    target: string; // department name or category name
    limit: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    currentSpend: number;
    active: boolean;
  }
  
  export interface BudgetItem {
    id: string;
    category: string;
    department: string;
    allocated: number;
    spent: number;
    remaining: number;
    fiscalYear: string;
    quarter: number;
  }
  
  export interface TaxInsight {
    category: string;
    potentialSaving: number;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    implementation: string;
  }
  
  export interface CostOptimization {
    category: string;
    currentSpend: number;
    benchmark: number;
    potentialSaving: number;
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }
  
  export interface DepartmentAnalytics {
    department: string;
    totalExpense: number;
    employeeCount: number;
    averagePerEmployee: number;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    trendData: Array<{
      month: string;
      amount: number;
    }>;
    complianceScore: number;
    flaggedExpenses: number;
  }
  
  export interface AdminBillData extends BillData {
    validation_result: ValidationResult;
    department: string;
    employee_name: string;
    tax_category?: string;
    tax_amount?: number;
    justification?: string;
    audit_history?: Array<{
      date: string;
      action: string;
      user: string;
      notes?: string;
    }>;
  }