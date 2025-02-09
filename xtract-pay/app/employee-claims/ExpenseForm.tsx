// components/expense-form/ExpenseForm.tsx
import { useState } from 'react';
import { processReceipt } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { submitBill, getBillsByEmployeeId } from '@/services/firestore';
import { Expense, BillData } from '@/types';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExpenseFormState {
  amount: string;
  date: string;
  category: string;
  vendor: string;
  description: string;
  billNumber: string;
  paymentType: string;
  gstNo: string;
}

export const ExpenseForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormState>({
    amount: '',
    date: '',
    category: '',
    vendor: '',
    description: '',
    billNumber: '',
    paymentType: '',
    gstNo: ''
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [newExpense, setNewExpense] = useState({
      id: '',
      amount: '',
      date: '',
      category: '',
      vendor: '',
      description: '',
      billNumber: '', // Added this field
      paymentType: '', // Added this field
      attachments: [] as File[]
    });

    const { user } = useAuth();
   
        const phone_number = user?.phone_number;

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      if (!phone_number) {
        throw new Error('Phone number is required');
      }
      const result = await processReceipt(file, phone_number);

      console.log('Receipt processed:', result);
      
      // Map the API response to form fields
      setFormData({
        amount: result.data.amount || '',
        date: result.data.expense_date || '',
        category: result.data.category || '',
        vendor: result.data.vendor_name || '',
        description: result.data.description || '',
        billNumber: result.data.bill_id || '',
        paymentType: 'CASH', // Default value
        gstNo: result.data.gstno || ''
      });

      toast.success('Receipt processed successfully');
    } catch (error) {
      toast.error('Failed to process receipt');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchExpenses = async () => {
        try {
          if (!user?.employeeId) return;
          
          const bills = await getBillsByEmployeeId(user.employeeId) as unknown as BillData[];
          setExpenses(bills.map((bill) => ({
                          id: bill.bill_id,
                          date: bill.expense_date.toDate().toISOString(),
                          amount: bill.amount,
                          category: bill.category,
                          vendor: bill.vendor_name,
                          createdAt: bill.submission_date.toDate().toISOString(),
                          description: bill.description,
                          employee_id: bill.employee_id,
                          is_flagged: bill.is_flagged,
                          is_manager_approved: bill.is_manager_approved,
                          payment_type: bill.payment_type,
                          submission_date: bill.submission_date,
                          status: "pending" // Ensure this field is included
                        })));
        } catch (error) {
          console.error('Error fetching expenses:', error);
          toast.error('Failed to fetch expenses');
        }
      };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        if (!user?.employeeId) {
          throw new Error('User not authenticated');
        }
    
        if (!formData.billNumber || !formData.vendor) {
          toast.error('Bill number and vendor are required');
          return;
        }
    
        const billData = {
          amount: formData.amount,
          category: formData.category,
          employee_id: user.employeeId,
          expense_date: new Date(formData.date),
          payment_type: formData.paymentType,
          vendor: formData.vendor,
          description: formData.description
        };
    
        await submitBill(
          formData.billNumber,
          formData.vendor,
          billData
        );
    
        // Reset form
        setFormData({
                  amount: '',
                  date: '',
                  category: '',
                  vendor: '',
                  description: '',
                  billNumber: '',
                  paymentType: '',
                  gstNo: ''
                });
        setUploadedFiles([]);
    
        toast.success('Expense claim submitted successfully');
        fetchExpenses(); // Refresh the list
      } catch (error) {
        console.error('Error submitting expense:', error);
        toast.error('Failed to submit expense claim');
      }
    };

  return (
    <form onSubmit={handleSubmitExpense} className="space-y-6">
      {/* File Upload Section */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isProcessing ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          <p className="text-sm text-gray-600">
            {isProcessing 
              ? 'Processing receipt...' 
              : 'Drag and drop your receipt here, or click to browse'
            }
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            disabled={isProcessing}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billNumber">Bill Number</Label>
          <Input
            id="billNumber"
            value={formData.billNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstNo">GST Number</Label>
          <Input
            id="gstNo"
            value={formData.gstNo}
            onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value }))}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input 
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            disabled={true}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="vendor">Payment Type</Label>
          <Input
            id="paymentType"
            value={formData.paymentType}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="w-full min-h-[100px] p-3 rounded-md border bg-gray-50"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isProcessing || !formData.amount}
      >
        Submit Claim
      </Button>
    </form>
  );
};