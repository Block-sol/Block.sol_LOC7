// components/admin/Analytics.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { adminService } from '@/services/adminService';
import { 
  AlertTriangle, TrendingUp, TrendingDown, DollarSign,
  AlertCircle, CheckCircle, Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminBillData, ValidationResult } from '@/types/admin';

interface AnalyticsDashboardProps {
  bills: AdminBillData[];
  onFlaggedClick: (bill: AdminBillData) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  bills,
  onFlaggedClick
}) => {
  const [analytics, setAnalytics] = useState({
    totalExpense: 0,
    flaggedAmount: 0,
    validAmount: 0,
    departmentSpending: {} as Record<string, number>,
    categorySpending: {} as Record<string, number>,
    monthlyTrend: [] as any[],
    validationIssues: [] as { issue: string; count: number }[],
    flaggedByDepartment: {} as Record<string, number>,
    complianceRate: 0
  });

  useEffect(() => {
    const processAnalytics = () => {
      const departmentData: Record<string, number> = {};
      const categoryData: Record<string, number> = {};
      const monthlyData: Record<string, any> = {};
      const validationIssues: Record<string, number> = {};
      const flaggedDepts: Record<string, number> = {};
      let totalExp = 0;
      let flaggedAmt = 0;
      let validAmt = 0;

      bills.forEach(bill => {
        // Department spending
        departmentData[bill.department] = (departmentData[bill.department] || 0) + Number(bill.amount);
        
        // Category spending
        categoryData[bill.category] = (categoryData[bill.category] || 0) + Number(bill.amount);
        
        // Monthly trends
        const month = format(bill.expense_date.toDate(), 'MMM yyyy');
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            total: 0,
            valid: 0,
            flagged: 0
          };
        }
        monthlyData[month].total += Number(bill.amount);
        
        // Validation issues
        if (!bill.validation_result.bill_valid) {
          flaggedAmt += Number(bill.amount);
          flaggedDepts[bill.department] = (flaggedDepts[bill.department] || 0) + 1;
          
          // Parse validation reasons
          const reasons = bill.validation_result.reason?.split('.') || [];
          reasons.forEach(reason => {
            if (reason.trim()) {
              validationIssues[reason.trim()] = (validationIssues[reason.trim()] || 0) + 1;
            }
          });
        } else {
          validAmt += Number(bill.amount);
        }
        
        totalExp += Number(bill.amount);
      });

      setAnalytics({
        totalExpense: totalExp,
        flaggedAmount: flaggedAmt,
        validAmount: validAmt,
        departmentSpending: departmentData,
        categorySpending: categoryData,
        monthlyTrend: Object.values(monthlyData),
        validationIssues: Object.entries(validationIssues).map(([issue, count]) => ({
          issue,
          count
        })),
        flaggedByDepartment: flaggedDepts,
        complianceRate: (validAmt / totalExp) * 100
      });
    };

    processAnalytics();
  }, [bills]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold">₹{analytics.totalExpense.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Flagged Amount</p>
                <p className="text-2xl font-bold">₹{analytics.flaggedAmount.toLocaleString()}</p>
                <p className="text-sm text-red-500">
                  {((analytics.flaggedAmount / analytics.totalExpense) * 100).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Compliance Rate</p>
                <p className="text-2xl font-bold">{analytics.complianceRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Valid Amount</p>
                <p className="text-2xl font-bold">₹{analytics.validAmount.toLocaleString()}</p>
                // Continuing from previous Analytics.tsx
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
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
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                  <Line type="monotone" dataKey="valid" stroke="#82ca9d" name="Valid" />
                  <Line type="monotone" dataKey="flagged" stroke="#ff7300" name="Flagged" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analytics.departmentSpending).map(([dept, amount]) => ({
                    department: dept,
                    amount,
                    flagged: analytics.flaggedByDepartment[dept] || 0
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" name="Total Spend" />
                  <Bar dataKey="flagged" fill="#ff7300" name="Flagged Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Validation Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Common Validation Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.validationIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm">{issue.issue}</span>
                  </div>
                  <span className="font-medium">{issue.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.categorySpending).map(([category, amount]) => ({
                      name: category,
                      value: amount
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analytics.categorySpending).map((entry, index) => (
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

      {/* Compliance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Valid Bills</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {((analytics.validAmount / analytics.totalExpense) * 100).toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Flagged Bills</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {((analytics.flaggedAmount / analytics.totalExpense) * 100).toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Under Review</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {bills.filter(b => !b.validation_result.bill_valid && !b.is_manager_approved).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};