// app/dashboard/manager/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { DashboardAnalytics } from './DashboardAnalytics';
import { ClaimsTable } from './ClaimsTable';
import { EmployeeManagement } from './EmployeeManagement';
import { getManagerEmployees, getEmployeeBills } from '@/services/managerFirestore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { BillData } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<string[]>([]);
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');

  const fetchData = async () => {
    if (!user?.employeeId) return;
    console.log("USER: ",user?.employeeId);
    
    try {
      setLoading(true);
      const employeeList = await getManagerEmployees(user.employeeId);
      setEmployees(employeeList);
      console.log("EMPLOYEE LIST: ",employeeList);

      const billsData = await getEmployeeBills(employeeList);
      setBills(billsData);
      console.log("BILLS DATA: ",billsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.employeeId]);

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'approved' && bill.is_manager_approved) ||
      (statusFilter === 'flagged' && bill.is_flagged) ||
      (statusFilter === 'pending' && !bill.is_manager_approved && !bill.is_flagged);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container flex h-screen gap-6 w-screen space-y-6">
        <Sidebar />
        <div className="flex flex-col gap-6 w-full">
      <h1 className="text-3xl font-bold">Manager Dashboard</h1>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="claims">Claims Review</TabsTrigger>
          <TabsTrigger value="employees">Employee Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <DashboardAnalytics bills={bills} />
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by employee or vendor..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: 'all' | 'pending' | 'approved' | 'flagged') => 
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ClaimsTable bills={filteredBills} onUpdate={fetchData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeManagement
                managerId={user?.employeeId || ''}
                employees={employees}
                onUpdate={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}