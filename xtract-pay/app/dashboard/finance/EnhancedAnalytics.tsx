import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Activity } from 'lucide-react';

// Animated Budget vs Actual Chart
interface BudgetVsActualData {
  department: string;
  budget: number;
  actual: number;
}

import { AdminBillData } from '@/types';

export const processEnhancedAnalytics = (
    bills: AdminBillData[],
    analytics: any,
    getValidationStats: () => any,
    getDepartmentRanking: () => any,
    getCategoryInsights: () => any
  ) => {
    // Process department comparison data
    const departmentComparison = getDepartmentRanking().map((dept: any) => ({
      department: dept.department,
      budget: analytics.departmentSpending[dept.department] || 0,
      actual: dept.amount,
      percentage: dept.percentage
    }));
  
    // Process category distribution data with enhanced metrics
    const categoryDistribution = getCategoryInsights().map((cat: any) => ({
      name: cat.category,
      value: cat.amount,
      percentage: cat.percentage,
      vsAverage: cat.vsAverage
    }));
  
    // Process transaction data with anomaly detection
    const transactionData = analytics.monthlyTrends.map((trend: any) => {
      // Calculate moving average for anomaly detection
      const avgAmount = analytics.monthlyTrends.reduce((acc: number, curr: any) => 
        acc + curr.amount, 0) / analytics.monthlyTrends.length;
      const stdDev = Math.sqrt(
        analytics.monthlyTrends.reduce((acc: number, curr: any) => 
          acc + Math.pow(curr.amount - avgAmount, 2), 0) / analytics.monthlyTrends.length
      );
      
      // Mark as anomaly if amount deviates more than 2 standard deviations
      const isAnomaly = Math.abs(trend.amount - avgAmount) > (2 * stdDev);
  
      return {
        date: trend.month,
        amount: trend.amount,
        isAnomaly,
        expectedAmount: avgAmount,
        validation: {
          valid: trend.amount * (getValidationStats().validPercentage / 100),
          invalid: trend.amount * ((100 - getValidationStats().validPercentage) / 100)
        }
      };
    });
  
    return {
      departmentComparison: departmentComparison.sort((a: any, b: any) => b.actual - a.actual),
      categoryDistribution: categoryDistribution.sort((a: any, b: any) => b.value - a.value),
      transactions: transactionData
    };
  };

const BudgetVsActualChart = ({ data }: { data: BudgetVsActualData[] }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Budget vs Actual Spending
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-lg border">
                      <p className="font-bold">{payload[0].payload.department}</p>
                      <p className="text-blue-500">Budget: ₹{payload[0].value?.toLocaleString()}</p>
                      <p className="text-green-500">Actual: ₹{payload[1].value?.toLocaleString()}</p>
                      <p className="text-gray-500">
                        Variance: {typeof payload[0].value === 'number' && typeof payload[1].value === 'number' ? ((payload[1].value / payload[0].value - 1) * 100).toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              dataKey="budget" 
              fill="#93c5fd" 
              name="Budget"
              animationDuration={2000}
              onAnimationEnd={() => setAnimationComplete(true)}
            />
            <Bar 
              dataKey="actual" 
              fill="#4ade80" 
              name="Actual"
              animationDuration={2000}
              animationBegin={animationComplete ? 0 : 1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Expense Category Distribution
interface ExpenseCategoryData {
  name: string;
  value: number;
}

const ExpenseCategoryPie = ({ data }: { data: ExpenseCategoryData[] }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Expense Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                name
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                  >
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Anomaly Detection Chart
interface AnomalyData {
  date: string;
  amount: number;
  isAnomaly: boolean;
}

const AnomalyDetectionChart = ({ data }: { data: AnomalyData[] }) => {
  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Expense Anomalies
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const isAnomaly = payload[0].payload.isAnomaly;
                  return (
                    <div className={`p-4 rounded-lg shadow-lg border ${
                      isAnomaly ? 'bg-red-50' : 'bg-white'
                    }`}>
                      <p className="font-bold">{payload[0].payload.date}</p>
                      <p className="text-gray-600">
                        Amount: ₹{payload[0].value?.toLocaleString()}
                      </p>
                      {isAnomaly && (
                        <p className="text-red-500 text-sm mt-1">
                          Potential anomaly detected
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={2}
              dot={({ payload }) => (
                <circle
                  cx={0}
                  cy={0}
                  r={payload.isAnomaly ? 6 : 4}
                  fill={payload.isAnomaly ? '#ef4444' : '#2563eb'}
                  stroke={payload.isAnomaly ? '#ef4444' : '#2563eb'}
                  strokeWidth={2}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Main Analytics Dashboard Component
interface AnalyticsData {
  departmentComparison: BudgetVsActualData[];
  categoryDistribution: ExpenseCategoryData[];
  transactions: AnomalyData[];
}

const EnhancedAnalytics = ({ analyticsData }: { analyticsData: AnalyticsData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <BudgetVsActualChart data={analyticsData.departmentComparison} />
      <ExpenseCategoryPie data={analyticsData.categoryDistribution} />
      <AnomalyDetectionChart data={analyticsData.transactions} />
    </div>
  );
};

export default EnhancedAnalytics;