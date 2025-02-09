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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, ChevronDown, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<string[]>([]);
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const notifications = [
    { id: 1, title: 'Expense approved', message: 'Your travel expense has been approved' },
    { id: 2, title: 'New policy update', message: 'Please review the updated travel policy' }
  ];


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
      bill.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="flex h-screen gap-6 w-screen px-2 space-y-6">
        <Sidebar />

        <div className="flex-1 flex flex-col w-screen overflow-hidden">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">XtractPay {user?.role} Dashboard</h1>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="p-4">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <Avatar>
                      <User size={20} />
                    </Avatar>
                    <span className="font-medium">{user?.displayName}</span>
                    <ChevronDown size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

    <div className="flex flex-col gap-6 w-full">

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
    </div>
  );
}