import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, TrendingDown, DollarSign,
  AlertCircle, CheckCircle, Flag, ArrowUpRight, ArrowDownRight, CreditCard,
  Building2
} from 'lucide-react';
import { format, subMonths, isWithinInterval } from 'date-fns';

const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  purple: '#7c3aed',
  pink: '#db2777',
  gray: '#6b7280',
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, prefix = '₹' }: { active?: boolean; payload?: any[]; label?: string; prefix?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-bold">{label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color }}>
              {item.name}: {prefix}{item.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Metric Card Component
  interface MetricCardProps {
    title: string;
    value: number | string;
    trend?: number;
    icon: React.ComponentType<{ className: string }>;
    color: string;
    prefix?: string;
  }

  const MetricCard = ({ title, value, trend, icon: Icon, color, prefix = '₹' }: MetricCardProps) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                {trend > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                )}
                <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 text-${color}`} />
        </div>
      </CardContent>
    </Card>
  );

interface ExpenseMetricsCardProps {
  title: string;
  amount: number;
  trend: number;
  icon: React.ComponentType<{ className: string }>;
  color: string;
}

const ExpenseMetricsCard = ({ title, amount, trend, icon: Icon, color }: ExpenseMetricsCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">₹{amount.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500" />
              )}
              <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                {Math.abs(trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}`} />
      </div>
    </CardContent>
  </Card>
);

interface Bill {
  expense_date: { toDate: () => Date };
  amount: number;
  validation_result: { bill_valid: boolean };
  department: string;
  category: string;
  payment_type: string;
  vendor: string;
}

export const AnalyticsDashboard = ({ bills, onFlaggedClick = () => {} }: { bills: Bill[], onFlaggedClick?: () => void }) => {
    const [timeframe, setTimeframe] = useState('3m'); // '1m', '3m', '6m', '1y'
    interface MonthlyTrend {
      month: string;
      total: number;
      valid: number;
      flagged: number;
      avgTicket: number;
      uniqueVendors: number;
      categoryDiversity: number;
      velocity: number;
      complianceRate: number;
    }
    
    interface Vendor {
      vendor: string;
      amount: number;
      percentage: number;
      avgTicket: number;
      transactionCount: number;
      categoryCount: number;
    }
    
    interface SpendingByDay {
      day: string;
      amount: number;
      percentage: number;
    }
    
    interface ValidationIssue {
      issue: string;
      count: number;
    }
    
    interface Analytics {
      totalExpense: number;
      flaggedAmount: number;
      validAmount: number;
      departmentSpending: { [key: string]: number };
      categorySpending: { [key: string]: number };
      monthlyTrend: MonthlyTrend[];
      paymentMethods: { [key: string]: number };
      validationIssues: ValidationIssue[];
      flaggedByDepartment: { [key: string]: number };
      complianceRate: number;
      avgTicketSize: number;
      monthOverMonth: number;
      topVendors: Vendor[];
      spendingByDay: SpendingByDay[];
      recentTrends: MonthlyTrend[];
      forecastedSpend: number;
    }
    
    const [analytics, setAnalytics] = useState<Analytics>({
      totalExpense: 0,
      flaggedAmount: 0,
      validAmount: 0,
      departmentSpending: {},
      categorySpending: {},
      monthlyTrend: [],
      paymentMethods: {},
      validationIssues: [],
      flaggedByDepartment: {},
      complianceRate: 0,
      avgTicketSize: 0,
      monthOverMonth: 0,
      topVendors: [],
      spendingByDay: [],
      recentTrends: [],
      forecastedSpend: 0
    });
  
    useEffect(() => {
      const processAnalytics = () => {
        const now = new Date();
        const threeMonthsAgo = subMonths(now, 3);
        
        const departmentData: { [key: string]: number } = {};
        const categoryData: { [key: string]: number } = {};
        const monthlyData: { [key: string]: { month: string; total: number; valid: number; flagged: number; count: number; uniqueVendors: Set<string>; categories: Set<string> } } = {};
        const paymentMethodData: { [key: string]: number } = {};
        const validationIssues = {};
        const flaggedDepts: { [key: string]: number } = {};
        const vendorSpending: { [key: string]: { total: number; count: number; categories: Set<string>; avgTicket: number } } = {};
        const dayWiseSpending: { [key: string]: number } = {};
        
        let totalExp = 0;
        let flaggedAmt = 0;
        let validAmt = 0;
        let lastMonthExp = 0;
        let currentMonthExp = 0;
  
        bills.forEach(bill => {
          const expenseDate = bill.expense_date.toDate();
          const month = format(expenseDate, 'MMM yyyy');
          const day = format(expenseDate, 'eee');
          const amount = Number(bill.amount);
  
          // Basic metrics
          totalExp += amount;
          if (!bill.validation_result?.bill_valid) {
            flaggedAmt += amount;
            flaggedDepts[bill.department] = (flaggedDepts[bill.department] || 0) + 1;
          } else {
            validAmt += amount;
          }
  
          // Payment method analysis
          paymentMethodData[bill.payment_type] = (paymentMethodData[bill.payment_type] || 0) + amount;
  
          // Department and category metrics
          departmentData[bill.department] = (departmentData[bill.department] || 0) + amount;
          categoryData[bill.category] = (categoryData[bill.category] || 0) + amount;
  
          // Monthly trends with enhanced metrics
          if (!monthlyData[month]) {
            monthlyData[month] = {
              month,
              total: 0,
              valid: 0,
              flagged: 0,
              count: 0,
              uniqueVendors: new Set(),
              categories: new Set()
            };
          }
          monthlyData[month].total += amount;
          monthlyData[month].count++;
          monthlyData[month].uniqueVendors.add(bill.vendor);
          monthlyData[month].categories.add(bill.category);
          
          if (bill.validation_result?.bill_valid) {
            monthlyData[month].valid += amount;
          } else {
            monthlyData[month].flagged += amount;
          }
  
          // Vendor analysis
          vendorSpending[bill.vendor] = vendorSpending[bill.vendor] || {
            total: 0,
            count: 0,
            categories: new Set(),
            avgTicket: 0
          };
          vendorSpending[bill.vendor].total += amount;
          vendorSpending[bill.vendor].count++;
          vendorSpending[bill.vendor].categories.add(bill.category);
          vendorSpending[bill.vendor].avgTicket = 
            vendorSpending[bill.vendor].total / vendorSpending[bill.vendor].count;
  
          // Day-wise spending patterns
          dayWiseSpending[day] = (dayWiseSpending[day] || 0) + amount;
  
          // Month-over-month calculation
          if (isWithinInterval(expenseDate, { start: subMonths(now, 1), end: now })) {
            currentMonthExp += amount;
          } else if (isWithinInterval(expenseDate, { start: subMonths(now, 2), end: subMonths(now, 1) })) {
            lastMonthExp += amount;
          }
        });
  
        // Process monthly trends
        const monthlyTrendArray = Object.entries(monthlyData)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([month, data]) => ({
            month,
            total: data.total,
            valid: data.valid,
            flagged: data.flagged,
            avgTicket: data.total / data.count,
            uniqueVendors: data.uniqueVendors.size,
            categoryDiversity: data.categories.size,
            velocity: data.count, // Number of transactions
            complianceRate: (data.valid / data.total) * 100
          }));
  
        // Process top vendors with enhanced metrics
        const topVendors = Object.entries(vendorSpending)
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, 5)
          .map(([vendor, data]) => ({
            vendor,
            amount: data.total,
            percentage: (data.total / totalExp) * 100,
            avgTicket: data.avgTicket,
            transactionCount: data.count,
            categoryCount: data.categories.size
          }));
  
        // Calculate forecasted spend using simple moving average
        const recentMonths = monthlyTrendArray.slice(-3);
        const avgMonthlySpend = recentMonths.reduce((acc, curr) => acc + curr.total, 0) / recentMonths.length;
        const forecastedSpend = avgMonthlySpend * 1.1; // 10% buffer
  
        setAnalytics({
          totalExpense: totalExp,
          flaggedAmount: flaggedAmt,
          validAmount: validAmt,
          departmentSpending: departmentData,
          categorySpending: categoryData,
          monthlyTrend: monthlyTrendArray,
          paymentMethods: paymentMethodData,
          validationIssues: Object.entries(validationIssues).map(([issue, count]) => ({
            issue,
            count: count as number
          })),
          flaggedByDepartment: flaggedDepts,
          complianceRate: (validAmt / totalExp) * 100,
          avgTicketSize: totalExp / bills.length,
          monthOverMonth: lastMonthExp ? ((currentMonthExp - lastMonthExp) / lastMonthExp) * 100 : 0,
          topVendors,
          spendingByDay: Object.entries(dayWiseSpending).map(([day, amount]) => ({
            day,
            amount,
            percentage: (amount / totalExp) * 100
          })),
          recentTrends: monthlyTrendArray.slice(-3),
          forecastedSpend
        });
      };
  
      processAnalytics();
    }, [bills, timeframe]);
  
    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Expenses"
            value={analytics.totalExpense}
            trend={analytics.monthOverMonth}
            icon={DollarSign}
            color="blue-500"
          />
          <MetricCard
            title="Average Ticket"
            value={analytics.avgTicketSize}
            icon={CreditCard}
            color="purple-500"
          />
          <MetricCard
            title="Compliance Rate"
            value={`${analytics.complianceRate.toFixed(1)}%`}
            trend={analytics.complianceRate - (analytics.recentTrends[0]?.complianceRate || 0)}
            icon={CheckCircle}
            color="green-500"
            prefix=""
          />
          <MetricCard
            title="Forecasted Spend"
            value={analytics.forecastedSpend}
            icon={TrendingUp}
            color="pink-500"
          />
        </div>
  
        {/* Main Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Trend Analysis */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Expense Trends & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="total" 
                    fill={CHART_COLORS.primary} 
                    name="Total Spend" 
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgTicket"
                    stroke={CHART_COLORS.purple}
                    name="Avg Ticket"
                  />
                  <Area
                    yAxisId="left"
                    dataKey="valid"
                    stackId="1"
                    fill={CHART_COLORS.secondary}
                    stroke={CHART_COLORS.secondary}
                    fillOpacity={0.6}
                    name="Valid Amount"
                  />
                  <Area
                    yAxisId="left"
                    dataKey="flagged"
                    stackId="1"
                    fill={CHART_COLORS.warning}
                    stroke={CHART_COLORS.warning}
                    fillOpacity={0.6}
                    name="Flagged Amount"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          {/* Department Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analytics.departmentSpending)
                    .map(([dept, amount]) => ({
                      department: dept,
                      amount,
                      flagged: analytics.flaggedByDepartment[dept] || 0,
                      compliance: 100 - ((analytics.flaggedByDepartment[dept] || 0) / amount) * 100
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="amount" fill={CHART_COLORS.primary} name="Total Spend" />
                  <Bar dataKey="flagged" fill={CHART_COLORS.danger} name="Flagged Amount" />
                  <Line 
                    type="monotone" 
                    dataKey="compliance" 
                    stroke={CHART_COLORS.secondary} 
                    name="Compliance %" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.categorySpending)
                      .map(([category, amount]) => ({
                        name: category,
                        value: amount,
                        percentage: (amount / analytics.totalExpense) * 100
                      }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill={CHART_COLORS.primary}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  >
                    {Object.entries(analytics.categorySpending).map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.paymentMethods)
                    .map(([method, amount]) => ({
                      name: method,
                      value: amount,
                      percentage: (amount / analytics.totalExpense) * 100
                    }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill={CHART_COLORS.purple}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                >
                  {Object.entries(analytics.paymentMethods).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Spending Pattern */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Weekly Spending Pattern</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.spendingByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_COLORS.purple}
                  fill={CHART_COLORS.purple}
                  fillOpacity={0.3}
                  name="Daily Spend"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Vendors Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topVendors.map((vendor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{vendor.vendor}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{vendor.percentage.toFixed(1)}% of spend</span>
                      <span>•</span>
                      <span>{vendor.transactionCount} transactions</span>
                      <span>•</span>
                      <span>{vendor.categoryCount} categories</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{vendor.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      Avg: ₹{vendor.avgTicket.toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Compliant Bills</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {((analytics.validAmount / analytics.totalExpense) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  ₹{analytics.validAmount.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Flagged Amount</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {((analytics.flaggedAmount / analytics.totalExpense) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  ₹{analytics.flaggedAmount.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Department Coverage</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Object.keys(analytics.departmentSpending).length}
                </p>
                <p className="text-sm text-gray-500">Active departments</p>
              </div>
            </div>

            {/* Validation Issues List */}
            <div className="mt-6">
              <h3 className="font-medium mb-4">Common Validation Issues</h3>
              <div className="space-y-3">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;