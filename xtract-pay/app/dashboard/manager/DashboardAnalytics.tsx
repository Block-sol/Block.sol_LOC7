// components/analytics/DashboardAnalytics.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Area
} from 'recharts';
import { BillData } from '@/types';
import { 
  TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar,
  Users, Clock, FileText, Activity, Filter
} from 'lucide-react';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardAnalyticsProps {
  bills: BillData[];
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ bills }) => {
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalExpense: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    flaggedAmount: 0,
    categoryBreakdown: {} as Record<string, number>,
    monthlyTrend: [] as any[],
    employeeSpending: {} as Record<string, number>,
    averageProcessingTime: 0,
    spendingVelocity: 0,
    topVendors: [] as { name: string; total: number }[],
    categoryTrends: [] as any[],
    submissionDayAnalysis: [] as any[],
    employeeComparison: [] as any[],
  });

  // Filter bills based on time range
  const getFilteredBills = () => {
    const now = new Date();
    const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const startDate = subMonths(now, months);

    return bills.filter(bill => {
      const billDate = bill.expense_date.toDate();
      return billDate >= startDate && 
             (selectedEmployee === 'all' || bill.employee_id === selectedEmployee);
    });
  };

  useEffect(() => {
    const filteredBills = getFilteredBills();
    const monthlyData: Record<string, any> = {};
    const categoryData: Record<string, number> = {};
    const employeeData: Record<string, number> = {};
    const vendorData: Record<string, number> = {};
    const dayData: Record<string, number> = {};
    let totalExp = 0;
    let pendingAmt = 0;
    let approvedAmt = 0;
    let flaggedAmt = 0;
    let totalProcessingTime = 0;
    let processedBills = 0;

    filteredBills.forEach(bill => {
      const date = bill.expense_date.toDate();
      const month = format(date, 'MMM yyyy');
      const day = format(date, 'EEEE'); // Day of week

      // Monthly trends
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          total: 0,
          approved: 0,
          pending: 0,
          flagged: 0
        };
      }
      monthlyData[month].total += Number(bill.amount);
      if (bill.is_manager_approved === 'approved') {
        monthlyData[month].approved += Number(bill.amount);
      } else if (bill.is_flagged) {
        monthlyData[month].flagged += Number(bill.amount);
      } else {
        monthlyData[month].pending += Number(bill.amount);
      }

      // Category breakdown
      categoryData[bill.category] = (categoryData[bill.category] || 0) + Number(bill.amount);

      // Employee spending
      employeeData[bill.employee_id] = (employeeData[bill.employee_id] || 0) + Number(bill.amount);

      // Vendor analysis
      vendorData[bill.vendor] = (vendorData[bill.vendor] || 0) + Number(bill.amount);

      // Submission day analysis
      dayData[day] = (dayData[day] || 0) + 1;

      // Processing time (if approved)
      if (bill.is_manager_approved === 'approved') {
        const submissionDate = bill.submission_date.toDate();
        const processingTime = (date.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24);
        totalProcessingTime += processingTime;
        processedBills++;
      }

      // Totals
      totalExp += Number(bill.amount);
      if (bill.is_manager_approved === 'approved') {
        approvedAmt += Number(bill.amount);
      } else if (bill.is_manager_approved === 'rejected') {
        flaggedAmt += Number(bill.amount);
      } else {
        pendingAmt += Number(bill.amount);
      }
    });

    // Calculate spending velocity (daily average)
    const daysInRange = filteredBills.length > 0 ? 
      Math.ceil((new Date().getTime() - Math.min(...filteredBills.map(b => b.expense_date.toDate().getTime()))) / (1000 * 60 * 60 * 24)) : 1;
    const spendingVelocity = totalExp / daysInRange;

    setAnalytics({
      totalExpense: totalExp,
      pendingAmount: pendingAmt,
      approvedAmount: approvedAmt,
      flaggedAmount: flaggedAmt,
      categoryBreakdown: categoryData,
      monthlyTrend: Object.values(monthlyData),
      employeeSpending: employeeData,
      averageProcessingTime: processedBills ? totalProcessingTime / processedBills : 0,
      spendingVelocity,
      topVendors: Object.entries(vendorData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, total]) => ({ name, total })),
      categoryTrends: Object.entries(categoryData).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExp) * 100
      })),
      submissionDayAnalysis: Object.entries(dayData).map(([day, count]) => ({
        day,
        count,
        percentage: (count / filteredBills.length) * 100
      })),
      employeeComparison: Object.entries(employeeData).map(([employee, amount]) => ({
        employee,
        amount,
        percentage: (amount / totalExp) * 100,
        avgPerBill: amount / filteredBills.filter(b => b.employee_id === employee).length
      }))
    });
  }, [bills, timeRange, selectedEmployee]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expense Analytics</h2>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {Object.keys(analytics.employeeSpending).map(employee => (
                <SelectItem key={employee} value={employee}>{employee}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold">₹{analytics.totalExpense.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">
                ₹{Math.round(analytics.spendingVelocity).toLocaleString()}/day
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold">₹{analytics.pendingAmount.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {((analytics.pendingAmount / analytics.totalExpense) * 100).toFixed(1)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Amount</p>
                <p className="text-2xl font-bold">₹{analytics.approvedAmount.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {((analytics.approvedAmount / analytics.totalExpense) * 100).toFixed(1)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Processing Time</p>
                <p className="text-2xl font-bold">{analytics.averageProcessingTime.toFixed(1)} days</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                For approved claims
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
                <CardDescription>Expense distribution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="total" fill="#8884d8" stroke="#8884d8" />
                      <Bar dataKey="approved" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="pending" stackId="a" fill="#ffc658" />
                      <Bar dataKey="flagged" stackId="a" fill="#ff8042" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Vendors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>Highest expense vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.topVendors}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      {/* Continuing from previous code */}
                      <Bar dataKey="total" fill="#8884d8">
                        {analytics.topVendors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Expense breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryTrends}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.categoryTrends.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Trends Table */}
            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
                <CardDescription>Detailed category-wise metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryTrends.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-gray-500">
                            {category.percentage.toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">₹{category.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Spending Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Spending Comparison</CardTitle>
                <CardDescription>Per employee expense analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.employeeComparison}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="employee" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Total Spent" fill="#8884d8" />
                      <Bar dataKey="avgPerBill" name="Avg per Bill" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Submission Day Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Pattern</CardTitle>
                <CardDescription>Day-wise submission analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.submissionDayAnalysis}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {analytics.submissionDayAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spending Velocity */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Velocity</CardTitle>
                <CardDescription>Daily spend rate trends</CardDescription>
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
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Timeline</CardTitle>
                <CardDescription>Processing time analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Processing Time</p>
                      <p className="text-2xl font-bold">
                        {analytics.averageProcessingTime.toFixed(1)} days
                      </p>
                    </div>
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  {/* Processing Time Distribution */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Same Day</span>
                      <span>1-3 Days</span>
                      <span>4-7 Days</span>
                      <span>&gt;7 Days</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: '40%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};