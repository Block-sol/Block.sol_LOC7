// components/admin/DetailedReports.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  Download,
  Filter,
  Search,
  FileText,
  CheckCircle,
  Share2,
  Eye,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { AdminBillData } from '@/types/admin';

interface DetailedReportsProps {
  bills: AdminBillData[];
  onExport: (data: any) => void;
  onShare: (reportId: string) => void;
}

export const DetailedReports: React.FC<DetailedReportsProps> = ({
  bills,
  onExport,
  onShare
}) => {
  const [selectedBill, setSelectedBill] = useState<AdminBillData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    department: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill?.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill?.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill?.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterOptions.department === 'all' || 
      bill.department === filterOptions.department;

    const matchesStatus = filterOptions.status === 'all' || 
      (filterOptions.status === 'valid' && Object(bill.validation_result.bill_valid)) ||
      (filterOptions.status === 'invalid' && !bill.validation_result.bill_valid);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const generateReport = (bill: AdminBillData) => {
    return {
      ...bill,
      report_date: new Date().toISOString(),
      department_analysis: {
        average_spend: 1000, // Calculate from actual data
        trend: 'increasing',
        anomaly_score: 0.2
      }
    };
  };

  return (
    <div className="space-y-6">
      {/* Reports Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Invalid Bills</p>
                <p className="text-2xl font-bold">
                  {bills.filter(b => !b?.validation_result?.bill_valid).length}
                </p>
                </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold">
                  {bills.filter(b => !b?.is_manager_approved).length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select
              value={filterOptions.department}
              onValueChange={(value) => setFilterOptions(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Array.from(new Set(bills.map(b => b.department))).map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterOptions.status}
              onValueChange={(value) => setFilterOptions(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterOptions.dateRange}
              onValueChange={(value) => setFilterOptions(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => onExport(filteredBills)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
          <CardDescription>
            Comprehensive view of all expense reports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow key={bill.bill_id}>
                  <TableCell>
                    {format(bill.expense_date.toDate(), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{bill.employee_name}</TableCell>
                  <TableCell>{bill.department}</TableCell>
                  <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bill.is_manager_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bill.is_manager_approved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bill.validation_result.bill_valid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bill.validation_result.bill_valid ? 'Valid' : 'Invalid'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onShare(bill.bill_id)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detailed Report</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Basic Information</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Employee</span>
                      <span>{selectedBill.employee_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department</span>
                      <span>{selectedBill.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span>{format(selectedBill.expense_date.toDate(), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Expense Details</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span>₹{selectedBill.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span>{selectedBill.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vendor</span>
                      <span>{selectedBill.vendor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Results */}
              <div>
                <h3 className="font-medium">Validation Results</h3>
                <div className="mt-2 p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {selectedBill.validation_result.bill_valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={selectedBill.validation_result.bill_valid 
                      ? 'text-green-600' 
                      : 'text-red-600'
                    }>
                      {selectedBill.validation_result.bill_valid 
                        ? 'Bill is valid' 
                        : 'Bill has validation issues'
                      }
                    </span>
                  </div>
                  {!selectedBill.validation_result.bill_valid && (
                    <div className="mt-2 text-sm text-gray-600">
                      {selectedBill.validation_result.reason?.split('.').map((reason, index) => (
                        reason.trim() && (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            <span>{reason.trim()}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Audit History */}
              {selectedBill.audit_history && (
                <div>
                  <h3 className="font-medium">Audit History</h3>
                  <div className="mt-2 space-y-2">
                    {selectedBill.audit_history.map((audit, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{audit.action}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(audit.date), 'MMM dd, yyyy HH:mm')} by {audit.user}
                          </p>
                          {audit.notes && (
                            <p className="text-sm text-gray-600 mt-1">{audit.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => onExport(generateReport(selectedBill))}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};