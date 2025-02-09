// services/adminService.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { AdminBillData, SpendingControl, BudgetItem, CostOptimization } from '@/types';
import { openaiService } from './openaiService';

export const adminService = {
  // Real-time Bills Listener
  subscribeToBills: (callback: (bills: AdminBillData[]) => void) => {
    const billsRef = collection(db, 'Bills');
    return onSnapshot(billsRef, (snapshot) => {
      const bills = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<AdminBillData, 'id'>;
        return {
          ...data,
          id: doc.id
        };
      }) as AdminBillData[];
      callback(bills);
    });
  },

  // Update Bill Data
  updateBillData: async (billId: string, data: Partial<AdminBillData>) => {
    const billRef = doc(db, 'Bills', billId);
    await updateDoc(billRef, {
      ...data,
      last_modified: Timestamp.now(),
      modified_by: 'admin' // Replace with actual user ID
    });
  },

  // Spending Controls
  getSpendingControls: async () => {
    const controlsRef = collection(db, 'SpendingControls');
    const snapshot = await getDocs(controlsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SpendingControl[];
  },

  updateSpendingControl: async (controlId: string, data: Partial<SpendingControl>) => {
    const controlRef = doc(db, 'SpendingControls', controlId);
    await updateDoc(controlRef, data);
  },

  createSpendingControl: async (data: Omit<SpendingControl, 'id'>) => {
    const controlsRef = collection(db, 'SpendingControls');
    const newControlRef = doc(controlsRef);
    await setDoc(newControlRef, {
      ...data,
      id: newControlRef.id,
      created_at: Timestamp.now()
    });
  },

  getTaxInsights: async () => {
    try {
      // Fetch all bills
      const billsRef = collection(db, 'Bills');
      const billsSnapshot = await getDocs(billsRef);
      const bills = billsSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<AdminBillData, 'id'>;
        return {
          ...data,
          id: doc.id
        };
      }) as AdminBillData[];

      // Get AI-powered tax recommendations
      const recommendations = await openaiService.analyzeTaxOpportunities(bills);
      return recommendations;
    } catch (error) {
      console.error('Error getting tax insights:', error);
      throw error;
    }
  },


  // Budget Management
  getBudgetItems: async (fiscalYear: string) => {
    const budgetRef = collection(db, 'Budgets');
    const q = query(budgetRef, where('fiscalYear', '==', fiscalYear));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudgetItem[];
  },

  updateBudgetItem: async (itemId: string, data: Partial<BudgetItem>) => {
    const itemRef = doc(db, 'Budgets', itemId);
    await updateDoc(itemRef, data);
  },

  // Analytics Functions
  getDepartmentAnalytics: async (department: string, startDate: Date, endDate: Date) => {
    const billsRef = collection(db, 'Bills');
    const q = query(
      billsRef,
      where('department', '==', department),
      where('expense_date', '>=', startDate),
      where('expense_date', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<AdminBillData, 'id'>;
      return {
        ...data,
        id: doc.id
      };
    }) as AdminBillData[];

    // Process bills for department analytics
    const analytics = processDepartmentAnalytics(bills);
    return analytics;
  },

  getFlaggedExpenses: async () => {
    const billsRef = collection(db, 'Bills');
    const q = query(
      billsRef,
      where('validation_result.bill_valid', '==', false),
      orderBy('submission_date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as AdminBillData;
      return {
        ...data,
        id: doc.id
      };
    }) as AdminBillData[];
  },

  getTaxCompliance: async () => {
    // Implement tax compliance analysis
    const billsRef = collection(db, 'Bills');
    const snapshot = await getDocs(billsRef);
    const bills = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<AdminBillData, 'id'>;
      return {
        ...data,
        id: doc.id
      };
    }) as AdminBillData[];

    return analyzeTaxCompliance(bills);
  },

  getCostOptimizations: async () => {
    try {
      // Fetch all bills first
      const billsRef = collection(db, 'Bills');
      const billsSnapshot = await getDocs(billsRef);
      const bills = billsSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<AdminBillData, 'id'>;
        return {
          ...data,
          id: doc.id
        };
      }) as AdminBillData[];

      // Get AI-powered recommendations
      const recommendations = await openaiService.analyzeCostOptimization(bills);
      return recommendations;
    } catch (error) {
      console.error('Error getting cost optimizations:', error);
      throw error;
    }
  }
};

// Helper Functions
function processDepartmentAnalytics(bills: AdminBillData[]) {
  // Implement department analytics processing
  // Return DepartmentAnalytics object
}

function analyzeTaxCompliance(bills: AdminBillData[]) {
  // Implement tax compliance analysis
  // Return array of TaxInsight objects
}

function analyzeCostOptimizations(bills: AdminBillData[]): CostOptimization[] {
  // Implement cost optimization analysis
  // Return array of CostOptimization objects
  return []; // Replace with actual implementation
}