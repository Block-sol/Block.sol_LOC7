// components/analytics/DashboardAnalytics.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BillData } from '@/types';

interface AnalyticsProps {
  bills: BillData[];
}

export const DashboardAnalytics: React.FC<AnalyticsProps> = ({ bills }) => {
  const [analytics, setAnalytics] = useState({
    totalExpense: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    categoryBreakdown: {} as Record<string, number>,
    monthlyTrend: [] as any[],
    employeeSpending: {} as Record<string, number>
  });

  useEffect(() => {
    const calculateAnalytics = () => {
      const monthlyData: Record<string, number> = {};
      const categoryData: Record<string, number> = {};
      const employeeData: Record<string, number> = {};
      let totalExp = 0;
      let pendingAmt = 0;
      let approvedAmt = 0;
      let rejectedAmt = 0;

      bills.forEach(bill => {
        // Monthly trends
        const month = bill.expense_date.toDate().getMonth().toString();
        monthlyData[month] = (monthlyData[month] || 0) + Number(bill.amount);

        // Category breakdown
        categoryData[bill.category] = (categoryData[bill.category] || 0) + Number(bill.amount);

        // Employee spending
        employeeData[bill.employee_id] = (employeeData[bill.employee_id] || 0) + Number(bill.amount);

        // Totals
        totalExp += Number(bill.amount);
        if (bill.is_manager_approved === "approved") {
          approvedAmt += Number(bill.amount);
        }
        else if (bill.is_manager_approved === "rejected") {
            console.log("REJECTED AMOUNT: ",bill.amount);
          rejectedAmt += Number(bill.amount);
        }
         else {
          pendingAmt += Number(bill.amount);
        }
      });

      setAnalytics({
        totalExpense: totalExp,
        pendingAmount: pendingAmt,
        approvedAmount: approvedAmt,
        rejectedAmount: rejectedAmt,
        categoryBreakdown: categoryData,
        monthlyTrend: Object.entries(monthlyData).map(([month, amount]) => ({
          month,
          amount
        })),
        employeeSpending: employeeData
      });
    };

    calculateAnalytics();
  }, [bills]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.pendingAmount / analytics.totalExpense) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.rejectedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.rejectedAmount / analytics.totalExpense) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.approvedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.approvedAmount / analytics.totalExpense) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
                      name,
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analytics.categoryBreakdown).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};