// app/admin/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { BudgetManagement } from './BudgetManagement';
import { DetailedReports } from './DetailedReports';
import TaxCompliancePanel from './TaxCompliance';
import { CostOptimizationDashboard } from './CostOptimization';
import { RealTimeIndicator, AlertStream, ActivityFeed } from '@/components/realtime';
import { Loader2 } from 'lucide-react';
import { AdminBillData } from '@/types';
import { ValidationSummary } from '@/components/admin/validation/ValidationSummary';
import { SpendingTrendChart } from '@/components/admin/charts/SpendingTrendChart';
import { DepartmentSpendingChart } from '@/components/admin/charts/DepartmentSpendingChart';
import { Sidebar } from '@/components/layout/Sidebar';
import AnalyticsDashboard from './AdminAnalytics';

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
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
              <div className="md:col-span-3 space-y-6"> {/* Changed to full width */}
                {/* Remove the old analytics cards as they're now part of AnalyticsDashboard */}
                
                {/* Add the new AnalyticsDashboard */}
                <AnalyticsDashboard 
                    bills={bills.map(bill => ({ ...bill, vendor: bill.vendor_name || 'Unknown Vendor', amount: Number(bill.amount) }))}
                    onFlaggedClick={() => {
                        console.log("Flagged bills:");
                    }}
                />
                    
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
    if (bill.validation_result) {
        if (typeof bill.validation_result === "string") {
            try {
                bill.validation_result = JSON.parse(bill.validation_result);
            } catch (error) {
                console.error("Failed to parse validation result:", error);
            }
        } else {     

        const validationResult = bill.validation_result as { bill_valid: boolean; reason: string };
        if (!validationResult.bill_valid && validationResult.reason) {
            const reasons = validationResult.reason.split(".");
            reasons.forEach((reason: string) => {
              const trimmedReason = reason.trim();
              if (trimmedReason) {
                errors[trimmedReason] = (errors[trimmedReason] || 0) + 1;
              }
            });
          }
        }
    } else {
        console.warn("validation_result is undefined or empty");
    }

  });

  return {
    errors,
    // totalInvalid: bills.filter((b) => !b?.validation_result?.bill_valid).length,
    // totalValid: bills.filter((b) => b?.validation_result?.bill_valid).length,
  };
};