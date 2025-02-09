// hooks/useRealTimeAnalytics.ts
import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AdminBillData } from '@/types/admin';

interface AnalyticsState {
  totalExpenses: number;
  validBills: number;
  invalidBills: number;
  pendingApproval: number;
  departmentSpending: Record<string, number>;
  categorySpending: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    timestamp: Date;
    type: string;
    details: any;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

interface DepartmentRanking {
    department: string;
    amount: number;
    percentage: number;
  }
  

export const useRealTimeAnalytics = () => {
  const [bills, setBills] = useState<AdminBillData[]>([]);    
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalExpenses: 0,
    validBills: 0,
    invalidBills: 0,
    pendingApproval: 0,
    departmentSpending: {},
    categorySpending: {},
    monthlyTrends: [],
    recentActivity: [],
    alerts: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Subscribe to bills collection
      const billsQuery = query(
        collection(db, 'Bills'),
        orderBy('submission_date', 'desc')
      );

      const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
        const billsData = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<AdminBillData, 'id'>;
          return {
            ...data,
            id: doc.id
          };
        }) as AdminBillData[];
        
        setBills(billsData);
        // Process bills for analytics
        const processedAnalytics = processAnalytics(billsData);
        setAnalytics(prev => ({
          ...prev,
          ...processedAnalytics
        }));
      });

      // Subscribe to real-time alerts
      const alertsQuery = query(
        collection(db, 'Alerts'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
        const alerts = snapshot.docs.map(doc => {
          const data = doc.data() as { type: 'warning' | 'error' | 'info'; message: string; timestamp: Date };
          return {
            id: doc.id,
            ...data
          };
        });

        setAnalytics(prev => ({
          ...prev,
          alerts
        }));
      });

      // Subscribe to activity log
      const activityQuery = query(
        collection(db, 'ActivityLog'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
        const activity = snapshot.docs.map(doc => {
          const data = doc.data() as { timestamp: Date; type: string; details: any };
          return {
            id: doc.id,
            ...data
          };
        });

        setAnalytics(prev => ({
            ...prev,
            recentActivity: activity
          }));
        });
  
        setLoading(false);
  
        // Cleanup subscriptions
        return () => {
          unsubscribeBills();
          unsubscribeAlerts();
          unsubscribeActivity();
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize analytics'));
        setLoading(false);
      }
    }, []);
  
    const processAnalytics = (bills: AdminBillData[]) => {
      const departmentSpending: Record<string, number> = {};
      const categorySpending: Record<string, number> = {};
      const monthlyData: Record<string, { amount: number; count: number }> = {};
  
      let totalExpenses = 0;
      let validBills = 0;
      let invalidBills = 0;
      let pendingApproval = 0;

      const uniqueEmployeeIds = [...new Set(bills.map(bill => bill.employee_id))];

      const employeesQuery = query(
        collection(db, 'Employees'),
        where('employeeId', 'in', uniqueEmployeeIds)
      );
      const employeeSnapshot = await getDocs(employeesQuery);
  
      bills.forEach(bill => {
        // Update totals
        totalExpenses += Number(bill.amount);
        if (bill?.validation_result?.bill_valid) {
          validBills++;
        } else {
          invalidBills++;
        }
        if (!bill.is_manager_approved) {
          pendingApproval++;
        }
  
        // Update department spending
        departmentSpending[bill.department] = (departmentSpending[bill.department] || 0) + Number(bill.amount);
  
        // Update category spending
        categorySpending[bill.category] = (categorySpending[bill.category] || 0) + Number(bill.amount);
  
        // Update monthly trends
        const month = bill.expense_date.toDate().toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { amount: 0, count: 0 };
        }
        monthlyData[month].amount += Number(bill.amount);
        monthlyData[month].count++;
      });
  
      return {
        totalExpenses,
        validBills,
        invalidBills,
        pendingApproval,
        departmentSpending,
        categorySpending,
        monthlyTrends: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          ...data
        }))
      };
    };
  
    // Additional utility functions for real-time analytics
    const getSpendingTrend = () => {
      const sortedTrends = [...analytics.monthlyTrends].sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  
      if (sortedTrends.length < 2) return 0;
  
      const lastMonth = sortedTrends[sortedTrends.length - 1].amount;
      const previousMonth = sortedTrends[sortedTrends.length - 2].amount;
      
      return ((lastMonth - previousMonth) / previousMonth) * 100;
    };
  
    const getDepartmentRanking = (): DepartmentRanking[] => {
        // Return empty array if required data is missing
        if (!analytics?.departmentSpending || !analytics?.totalExpenses) {
          console.warn('Department spending or total expenses data is missing');
          return [];
        }

        console.log("department spending!! :",analytics.departmentSpending);
        console.log("department spending!! :",analytics.totalExpenses);
      
        try {
          // Ensure totalExpenses is not zero to avoid division by zero
          const total = analytics.totalExpenses || 1;
      
          return Object.entries(analytics.departmentSpending)
            // Filter out any invalid entries
            .filter(([dept, amount]) => dept && typeof amount === 'number' && !isNaN(amount))
            // Sort by amount in descending order
            .sort(([, a], [, b]) => b - a)
            // Map to required format
            .map(([dept, amount]) => ({
              department: dept,
              amount: amount,
              percentage: ((amount / total) * 100)
            }));
        } catch (error) {
          console.error('Error calculating department ranking:', error);
          return [];
        }
      };
  
    const getCategoryInsights = () => {
      const insights = Object.entries(analytics.categorySpending).map(([category, amount]) => {
        const monthlyAverage = analytics.monthlyTrends.reduce((acc, curr) => 
          acc + (curr.amount / analytics.monthlyTrends.length), 0
        );
  
        return {
          category,
          amount,
          percentage: (amount / analytics.totalExpenses) * 100,
          vsAverage: ((amount - monthlyAverage) / monthlyAverage) * 100
        };
      });
  
      return insights.sort((a, b) => b.amount - a.amount);
    };
  
    const getValidationStats = () => {
      const total = analytics.validBills + analytics.invalidBills;
      return {
        validPercentage: (analytics.validBills / total) * 100,
        invalidPercentage: (analytics.invalidBills / total) * 100,
        trend: analytics.monthlyTrends.map(m => ({
          month: m.month,
          validRate: (analytics.validBills / m.count) * 100
        }))
      };
    };
  
    return {
        bills,  // Add bills to the return value
        analytics,
        loading,
        error,
        getSpendingTrend,
        getDepartmentRanking,
        getCategoryInsights,
        getValidationStats
      };
  };
  
  // components/realtime/RealTimeIndicator.tsx
  
  
  // components/realtime/AlertStream.tsx
  
  
  // components/realtime/ActivityFeed.tsx
  