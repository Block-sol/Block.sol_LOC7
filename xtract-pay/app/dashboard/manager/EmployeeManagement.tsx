// components/employee/EmployeeManagement.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, UserMinus, Users } from 'lucide-react';
import { addEmployeeToManager, removeEmployeeFromManager } from '@/services/managerFirestore';
import { toast } from 'react-hot-toast';

interface EmployeeManagementProps {
  managerId: string;
  employees: string[];
  onUpdate: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  managerId,
  employees,
  onUpdate,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');

  const handleAddEmployee = async () => {
    try {
      await addEmployeeToManager(managerId, newEmployeeId);
      toast.success('Employee added successfully');
      setNewEmployeeId('');
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add employee');
      console.error('Error adding employee:', error);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    try {
      await removeEmployeeFromManager(managerId, employeeId);
      toast.success('Employee removed successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to remove employee');
      console.error('Error removing employee:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Managed Employees</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleAddEmployee}
                disabled={!newEmployeeId.trim()}
                className="w-full"
              >
                Add Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employeeId) => (
          <div
            key={employeeId}
            className="flex items-center justify-between p-4 rounded-lg border bg-white"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-500" />
              <span>{employeeId}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => handleRemoveEmployee(employeeId)}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};