"use client";
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Upload, Search, MessageCircle, AlertCircle, CheckCircle2, XCircle, Bell, ChevronDown, User } from 'lucide-react';
import { Expense, ExpenseStatus, Grievance, GrievanceStatus } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ExpensePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [showChatbot, setShowChatbot] = useState(false);

  // Mock data - replace with actual API calls
  const expenses: Expense[] = [
    {
      id: '1',
      date: '2024-02-08',
      amount: 150.00,
      category: 'Travel',
      vendor: 'Uber',
      status: 'pending'
    },
    // Add more mock expenses
  ];

  const user = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: '/avatar.jpg'
  };

  const notifications = [
    { id: 1, title: 'Expense approved', message: 'Your travel expense has been approved' },
    { id: 2, title: 'New policy update', message: 'Please review the updated travel policy' }
  ];


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">XtractPay Employee Dashboard</h1>
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
                    <span className="font-medium">{user.name}</span>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[
              { title: 'Pending Claims', value: '12', trend: '+2.5%', color: 'blue' },
              { title: 'Total Claimed', value: '$4,250', trend: '+15%', color: 'green' },
              { title: 'Rejected Claims', value: '3', trend: '-1', color: 'red' },
              { title: 'Avg. Processing Time', value: '2.5 days', trend: '-12%', color: 'green' },
            ].map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <span className={`text-sm ${
                      stat.color === 'green' ? 'text-green-600' : 
                      stat.color === 'red' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {stat.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Tabs Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <Tabs defaultValue="submit" className="space-y-6">
                <TabsList className="inline-flex p-1 bg-gray-100 rounded-lg">
                  <TabsTrigger value="submit" className="px-4 py-2">Submit New Claim</TabsTrigger>
                  <TabsTrigger value="status" className="px-4 py-2">Check Status</TabsTrigger>
                  <TabsTrigger value="grievance" className="px-4 py-2">Submit Grievance</TabsTrigger>
                  <TabsTrigger value="grievance-status" className="px-4 py-2">Grievance Status</TabsTrigger>
                </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Expense Claim</CardTitle>
              <CardDescription>
                Upload your receipt and fill in the details for reimbursement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Drag and drop your receipt here, or click to browse
                    </p>
                    <Button variant="outline" size="sm">
                      Browse Files
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" placeholder="Enter amount" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input id="vendor" placeholder="Enter vendor name" />
                  </div>
                </div>

                <Button className="w-full">Submit Claim</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Expense Claims Status</CardTitle>
              <CardDescription>
                Track and monitor your submitted expense claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search claims..." 
                      className="pl-10"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{expense.vendor}</p>
                            <p className="text-sm text-gray-500">
                              {expense.date} • {expense.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">
                              ${expense.amount.toFixed(2)}
                            </p>
                            <StatusBadge status={expense.status} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grievance Tab */}
        <TabsContent value="grievance">
          <Card>
            <CardHeader>
              <CardTitle>Submit Grievance</CardTitle>
              <CardDescription>
                Submit a grievance for flagged or rejected expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Expense</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose expense claim" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenses
                        .filter(e => e.status === 'rejected' || e.status === 'flagged')
                        .map(expense => (
                          <SelectItem key={expense.id} value={expense.id}>
                            {expense.vendor} - ${expense.amount} ({expense.date})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grievance Description</Label>
                  <textarea 
                    className="w-full min-h-[150px] p-3 rounded-md border"
                    placeholder="Explain your grievance in detail..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Documentation</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <Button variant="outline" size="sm">
                      Upload Supporting Documents
                    </Button>
                  </div>
                </div>

                <Button className="w-full">Submit Grievance</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grievance Status Tab */}
        <TabsContent value="grievance-status">
          <Card>
            <CardHeader>
              <CardTitle>Grievance Status</CardTitle>
              <CardDescription>
                Track the status of your submitted grievances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add grievance status content here */}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
            </CardContent>
          </Card>

           {/* Recent Activity Section */}
           <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates on your expense claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Expense Approved', description: 'Your travel expense of $150 has been approved', time: '2 hours ago' },
                  { action: 'New Comment', description: 'Finance team requested additional documentation', time: '5 hours ago' },
                  { action: 'Claim Submitted', description: 'You submitted a new expense claim of $75', time: '1 day ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Chatbot Dialog */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Help Assistant</DialogTitle>
          </DialogHeader>
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {/* Add chatbot messages here */}
            <div className="bg-gray-100 p-3 rounded-lg">
              Hi! How can I help you with your expenses today?
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Input placeholder="Type your question..." />
            <Button>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Components
const StatusBadge: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    flagged: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${config.color}`}>
      <Icon size={14} />
      <span className="capitalize">{status}</span>
    </div>
  );
};

export default ExpensePage;