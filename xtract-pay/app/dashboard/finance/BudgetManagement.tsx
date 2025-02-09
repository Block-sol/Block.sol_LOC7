// components/admin/BudgetManagement.tsx
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
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  Edit2,
  Save,
  PlusCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BudgetItem } from '@/types/admin';

interface BudgetManagementProps {
  fiscalYear: string;
  departments: string[];
  categories: string[];
  onUpdateBudget: (budget: BudgetItem) => Promise<void>;
}

export const BudgetManagement: React.FC<BudgetManagementProps> = ({
  fiscalYear,
  departments,
  categories,
  onUpdateBudget
}) => {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editedValues, setEditedValues] = useState<Partial<BudgetItem>>({});
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);

  const totalBudget = budgets.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  const handleEdit = (budget: BudgetItem) => {
    setEditingId(budget.id);
    setEditedValues(budget);
  };

  const handleSave = async (budget: BudgetItem) => {
    try {
      await onUpdateBudget({ ...budget, ...editedValues });
      setEditingId(null);
      setEditedValues({});
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <Progress value={(totalSpent / totalBudget) * 100} />
              <p className="text-sm text-gray-500 mt-2">
                {((totalSpent / totalBudget) * 100).toFixed(1)}% utilized
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Spent Amount</p>
                <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                This fiscal year
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Remaining Budget</p>
                <p className="text-2xl font-bold">₹{remainingBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                {remainingBudget < totalBudget * 0.1 && (
                  <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                )}
                {((remainingBudget / totalBudget) * 100).toFixed(1)}% remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Budget Allocation</CardTitle>
              <CardDescription>Department-wise budget distribution</CardDescription>
            </div>
            <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Q1</SelectItem>
                <SelectItem value="2">Q2</SelectItem>
                <SelectItem value="3">Q3</SelectItem>
                <SelectItem value="4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgets
                    .filter(b => b.quarter === selectedQuarter)
                    .map(b => ({
                      name: b.department,
                      value: b.allocated
                    }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgets.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Budget Management Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Budget Management</CardTitle>
              <CardDescription>Manage and track department budgets</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">{budget.department}</TableCell>
                  <TableCell>{budget.category}</TableCell>
                  <TableCell>
                    {editingId === budget.id ? (
                      <Input
                        type="number"
                        value={editedValues.allocated || budget.allocated}
                        onChange={(e) => setEditedValues(prev => ({
                          ...prev,
                          allocated: parseFloat(e.target.value)
                        }))}
                        className="w-32"
                      />
                    ) : (
                      `₹${budget.allocated.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>₹{budget.spent.toLocaleString()}</TableCell>
                  <TableCell>₹{(budget.allocated - budget.spent).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(budget.spent / budget.allocated) * 100}
                        className="w-24"
                      />
                      <span className="text-sm">
                        {((budget.spent / budget.allocated) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === budget.id ? (
                      <Button
                        size="sm"
                        onClick={() => handleSave(budget)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Budget Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Budget</DialogTitle>
          </DialogHeader>
          {/* Add Budget Form */}
        </DialogContent>
      </Dialog>
    </div>
  );
};