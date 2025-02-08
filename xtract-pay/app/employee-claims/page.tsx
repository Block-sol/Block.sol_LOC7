"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import debounce from 'lodash/debounce';
import { format } from 'date-fns';
import { 
  Upload, Search, MessageCircle, AlertCircle, CheckCircle2, XCircle, 
  Bell, ChevronDown, User, Filter, Download, Trash2 
} from 'lucide-react';
import { Expense, ExpenseStatus, Grievance, GrievanceStatus } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';


const ExpensePage: React.FC = () => {
  const { user } = useAuth();
  const { checkAccess } = useRBAC();

  const userPermissions = {
    canSubmit: checkAccess('expenses', 'create'),
    canView: checkAccess('expenses', 'view'),
    canApprove: checkAccess('expenses', 'approve'),
    canDelete: checkAccess('expenses', 'delete'),
  };


  const [activeTab, setActiveTab] = useState('submit');
  const [showChatbot, setShowChatbot] = useState(false);

  // Mock data - replace with actual API calls
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      date: '2024-02-08',
      amount: 150.00,
      category: 'Travel',
      vendor: 'Uber',
      status: 'pending',
      createdAt: '2024-02-08T10:00:00Z'
    },
    {
      id: '2',
      date: '2024-02-07',
      amount: 75.50,
      category: 'Meals',
      vendor: 'Restaurant XYZ',
      status: 'approved',
      createdAt: '2024-02-07T15:30:00Z'
    },
    {
      id: '3',
      date: '2024-02-06',
      amount: 200.00,
      category: 'Office Supplies',
      vendor: 'Staples',
      status: 'rejected',
      rejectionReason: 'Missing receipt',
      createdAt: '2024-02-06T09:15:00Z'
    }
  ]);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  // State for new expense submission
  const [newExpense, setNewExpense] = useState({
    amount: '',
    date: '',
    category: '',
    vendor: '',
    description: '',
    attachments: [] as File[]
  });

  // State for file upload
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', content: 'Hi! How can I help you with your expenses today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    const matchesDate = !dateRange.start || !dateRange.end || 
      (expense.date >= dateRange.start && expense.date <= dateRange.end);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // New expense submission handler
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newExpenseEntry: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      date: newExpense.date,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      vendor: newExpense.vendor,
      status: 'pending',
      description: newExpense.description,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpenseEntry, ...prev]);
    setNewExpense({
      amount: '',
      date: '',
      category: '',
      vendor: '',
      description: '',
      attachments: []
    });
    setUploadedFiles([]);
  };

  // Chatbot handlers
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', content: chatInput }]);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'I understand you have a question about your expenses. Let me help you with that.'
      }]);
    }, 1000);
  };

  // Bulk actions handlers
  const handleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  const handleSelectExpense = (id: string) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
            <TabsList className="grid w-full grid-cols-4 gap-4">
              <TabsTrigger value="submit">Submit New Claim</TabsTrigger>
              <TabsTrigger value="status">Check Status</TabsTrigger>
              <TabsTrigger value="grievance">Submit Grievance</TabsTrigger>
              <TabsTrigger value="grievance-status">Grievance Status</TabsTrigger>
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
                  <form onSubmit={handleSubmitExpense} className="space-y-6">
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {dragActive 
                            ? 'Drop your files here' 
                            : 'Drag and drop your receipt here, or click to browse'
                          }
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                        >
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
                        <Input
                          id="vendor"
                          placeholder="Enter vendor name"
                          value={newExpense.vendor}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        className="w-full min-h-[100px] p-3 rounded-md border"
                        placeholder="Provide additional details about the expense..."
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <Button type="submit" className="w-full">Submit Claim</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Expense Claims Status</CardTitle>
                      <CardDescription>
                        Track and monitor your submitted expense claims
                      </CardDescription>
                    </div>
                    {selectedExpenses.size > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Selected
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Search claims..." 
                          className="pl-10"
                          onChange={(e) => debouncedSearch(e.target.value)}
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={(value: ExpenseStatus | 'all') => setStatusFilter(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="flagged">Flagged</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        More Filters
                      </Button>
                    </div>

                    {/* Date Range Filter Popover */}
                    <div className="flex gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedExpenses.size === filteredExpenses.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Vendor</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredExpenses.map((expense) => (
                            <tr 
                              key={expense.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedExpenses.has(expense.id)}
                                  onChange={() => handleSelectExpense(expense.id)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {format(new Date(expense.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{expense.vendor}</p>
                                  {expense.description && (
                                    <p className="text-sm text-gray-500 truncate max-w-xs">
                                      {expense.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{expense.category}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                ${expense.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={expense.status} />
                              </td>
                              <td className="px-4 py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Actions
                                      <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                                    {expense.status === 'rejected' && (
                                      <DropdownMenuItem className="text-red-600">
                                        Submit Appeal
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Grievance Tab */}
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
                                {expense.vendor} - ${expense.amount} ({format(new Date(expense.date), 'MMM dd, yyyy')})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {/* Show rejection reason if available */}
                      {expenses.find(e => e.status === 'rejected')?.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                          <p className="font-medium">Rejection Reason:</p>
                          <p>{expenses.find(e => e.status === 'rejected')?.rejectionReason}</p>
                        </div>
                      )}
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
                      <div 
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
                          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Button variant="outline" size="sm">
                          Upload Supporting Documents
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          or drag and drop your files here
                        </p>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button className="w-full">Submit Grievance</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Grievance Status Tab */}
            <TabsContent value="grievance-status">
              <Card>
                <CardHeader>
                  <CardTitle>Grievance Status</CardTitle>
                  <CardDescription>
                    Track the status of your submitted grievances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        id: '1',
                        expenseId: '3',
                        status: 'pending',
                        submittedDate: '2024-02-07',
                        lastUpdate: '2024-02-08',
                        description: 'Missing receipt appeal - receipt was attached in the original submission'
                      }
                    ].map((grievance) => (
                      <Card key={grievance.id}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">Grievance #{grievance.id}</h4>
                                <p className="text-sm text-gray-500">
                                  Submitted on {format(new Date(grievance.submittedDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <StatusBadge status={grievance.status as ExpenseStatus} />
                            </div>
                            <p className="text-sm">{grievance.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>Last updated: {format(new Date(grievance.lastUpdate), 'MMM dd, yyyy')}</span>
                              <Button variant="link" size="sm">View Details</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </CardContent>
          </Card>
        </main>

        {/* Enhanced Chatbot Dialog */}
        <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Expense Help Assistant</DialogTitle>
            </DialogHeader>
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.type === 'bot' 
                      ? 'bg-gray-100' 
                      : 'bg-blue-500 text-white ml-auto'
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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