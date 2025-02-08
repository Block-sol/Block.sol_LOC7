// components/claims/ClaimsTable.tsx
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BillData } from '@/types';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { updateBillApproval } from '@/services/managerFirestore';

interface ClaimsTableProps {
  bills: BillData[];
  onUpdate: () => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({ bills, onUpdate }) => {
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async (bill: BillData) => {
    try {
      await updateBillApproval(bill.bill_id, "approved");
      onUpdate();
    } catch (error) {
      console.error('Error approving bill:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedBill) return;

    try {
      await updateBillApproval(selectedBill.bill_id, "rejected", rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedBill(null);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting bill:', error);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'Travel': 'bg-blue-100 text-blue-800',
      'Meals': 'bg-green-100 text-green-800',
      'Office Supplies': 'bg-purple-100 text-purple-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.bill_id}>
              <TableCell>
                {format(bill.expense_date.toDate(), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{bill.employee_id}</TableCell>
              <TableCell>
                <Badge className={getCategoryBadgeColor(bill.category)}>
                  {bill.category}
                </Badge>
              </TableCell>
              <TableCell>{bill.vendor}</TableCell>
              <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
              <TableCell>
                {bill.is_manager_approved === "approved" ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approved
                  </Badge>
                ) : bill.is_manager_approved === "rejected" ? (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Rejected
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {!bill.is_manager_approved && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-600 hover:bg-green-100"
                      onClick={() => handleApprove(bill)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense Claim</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedBill(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};