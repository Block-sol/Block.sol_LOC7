// app/admin/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { BudgetManagement } from './BudgetManagement';
import { DetailedReports } from './DetailedReports';
import { TaxCompliancePanel } from './TaxCompliance';
import { CostOptimizationDashboard } from './CostOptimization';
import { RealTimeIndicator, AlertStream, ActivityFeed } from '@/components/realtime';
import { Loader2 } from 'lucide-react';
import { AdminBillData } from '@/types';
import { ValidationSummary } from '@/components/admin/validation/ValidationSummary';
import { SpendingTrendChart } from '@/components/admin/charts/SpendingTrendChart';
import { DepartmentSpendingChart } from '@/components/admin/charts/DepartmentSpendingChart';

export default function AdminDashboard() {
    const {
        bills,  // Get bills from the hook
        analytics,
        loading,
        error,
        getSpendingTrend,
        getDepartmentRanking,
        getCategoryInsights,
        getValidationStats,
      } = useRealTimeAnalytics();

  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const validationData = processValidationData(bills);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Financial Admin Dashboard</h1>
            <RealTimeIndicator />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="tax">Tax & Compliance</TabsTrigger>
              <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Analytics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Expenses */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">
                            Total Expenses
                          </p>
                          <p className="text-2xl font-bold">
                            ₹{analytics.totalExpenses.toLocaleString()}
                          </p>
                          <div className="flex items-center text-sm">
                            <span
                              className={`${
                                getSpendingTrend() > 0
                                  ? "text-red-500"
                                  : "text-green-500"
                              }`}
                            >
                              {getSpendingTrend().toFixed(1)}%
                            </span>
                            <span className="text-gray-500 ml-1">
                              vs last month
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Validation Stats */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Valid Bills</p>
                          <p className="text-2xl font-bold">
                            {getValidationStats().validPercentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {analytics.validBills} out of{" "}
                            {analytics.validBills + analytics.invalidBills}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Department Stats */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">
                            Top Department
                          </p>
                          <p className="text-2xl font-bold">
                            {getDepartmentRanking()[0]?.department}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹
                            {getDepartmentRanking()[0]?.amount.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Category Stats */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Top Category</p>
                          <p className="text-2xl font-bold">
                            {getCategoryInsights()[0]?.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{getCategoryInsights()[0]?.amount.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                   {/* Main Analytics Content */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SpendingTrendChart 
                      data={analytics.monthlyTrends.map(trend => ({
                        month: trend.month,
                        amount: trend.amount,
                        validAmount: trend.amount * (getValidationStats().validPercentage / 100)
                      }))} 
                    />
                    <DepartmentSpendingChart 
                      data={getDepartmentRanking().map(dept => ({
                        department: dept.department,
                        amount: dept.amount,
                        budget: analytics.departmentSpending[dept.department] || 0
                      }))}
                    />
                    <ValidationSummary data={validationData} />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AlertStream alerts={analytics.alerts} />
                    </CardContent>
                  </Card>

                  {/* Activity Feed */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ActivityFeed activities={analytics.recentActivity} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <DetailedReports
                bills={bills}  // Pass bills to the reports component
                onExport={(data) => {
                  // Implement export functionality
                  console.log("Exporting data:", data);
                }}
                onShare={(reportId) => {
                  // Implement share functionality
                  console.log("Sharing report:", reportId);
                }}
              />
            </TabsContent>

            <TabsContent value="budget">
              <BudgetManagement
                fiscalYear="2024"
                departments={Object.keys(analytics.departmentSpending)}
                categories={Object.keys(analytics.categorySpending)}
                onUpdateBudget={async (budget: any) => {
                  // Implement budget update functionality
                  console.log("Updating budget:", budget);
                }}
              />
            </TabsContent>

            <TabsContent value="tax">
              <TaxCompliancePanel
                data={{
                  taxInsights: [], // Add your tax insights data
                  spendingControls: [], // Add your spending controls data
                }}
                onUpdateControl={(control: any) => {
                  // Implement control update functionality
                  console.log("Updating control:", control);
                }}
                onAddControl={(control: any) => {
                  // Implement add control functionality
                  console.log("Adding control:", control);
                }}
              />
            </TabsContent>

            <TabsContent value="optimization">
              <CostOptimizationDashboard
                departments={Object.keys(analytics.departmentSpending)}
                onImplement={(optimization: any) => {
                  // Implement optimization functionality
                  console.log("Implementing optimization:", optimization);
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Real-time Updates Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex justify-between items-center">
          <RealTimeIndicator />
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>{analytics.recentActivity.length} activities today</span>
            <span>•</span>
            <span>{analytics.alerts.length} active alerts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


// Utility functions for data processing
const processValidationData = (bills: AdminBillData[]) => {
  const errors: Record<string, number> = {};

  bills.forEach((bill) => {
    if (!bill?.validation_result?.bill_valid && bill?.validation_result?.reason) {
      const reasons = bill.validation_result.reason.split(".");
      reasons.forEach((reason: string) => {
        const trimmedReason = reason.trim();
        if (trimmedReason) {
          errors[trimmedReason] = (errors[trimmedReason] || 0) + 1;
        }
      });
    }
  });

  return {
    errors,
    totalInvalid: bills.filter((b) => !b?.validation_result?.bill_valid).length,
    totalValid: bills.filter((b) => b?.validation_result?.bill_valid).length,
  };
};