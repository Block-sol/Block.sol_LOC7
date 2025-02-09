// components/admin/TaxCompliance.tsx
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TaxInsight, SpendingControl } from '@/types/admin';
import { adminService } from '@/services/adminService';
import {
  Receipt,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Settings,
  PlusCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaxComplianceProps {
  data: {
    taxInsights: TaxInsight[];
    spendingControls: SpendingControl[];
  };
  onUpdateControl: (control: SpendingControl) => void;
  onAddControl: (control: Omit<SpendingControl, 'id'>) => void;
}

export const TaxCompliancePanel: React.FC<TaxComplianceProps> = ({
  data,
  onUpdateControl,
  onAddControl
}) => {
  const [showAddControl, setShowAddControl] = useState(false);
  const [newControl, setNewControl] = useState<{
    type: 'department' | 'category';
    target: string;
    limit: number;
    period: 'monthly' | 'quarterly' | 'yearly';
  }>({
    type: 'department',
    target: '',
    limit: 0,
    period: 'monthly'
  });

  const totalPotentialSavings = data.taxInsights.reduce(
    (acc, curr) => acc + curr.potentialSaving,
    0
  );

  const handleAddControl = () => {
    onAddControl({
      ...newControl,
      currentSpend: 0,
      active: true
    });
    setShowAddControl(false);
    setNewControl({
      type: 'department',
      target: '',
      limit: 0,
      period: 'monthly'
    });
  };

  return (
    <div className="space-y-6">
      {/* Tax Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Potential Tax Savings</p>
                <p className="text-2xl font-bold">₹{totalPotentialSavings.toLocaleString()}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Tax Compliance Score</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active Spending Controls</p>
                <p className="text-2xl font-bold">
                  {data.spendingControls.filter(c => c.active).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Optimization Opportunities</CardTitle>
          <CardDescription>
            Actionable recommendations to optimize tax savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.taxInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{insight.category}</h4>
                    <p className="text-sm text-gray-500 mt-1">{insight.suggestion}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    insight.impact === 'high' ? 'bg-red-50 text-red-600' :
                    insight.impact === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {insight.impact.toUpperCase()} Impact
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">
                      Potential Saving: ₹{insight.potentialSaving.toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    Implementation: {insight.implementation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spending Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Spending Controls</CardTitle>
            <CardDescription>Manage department and category spending limits</CardDescription>
          </div>
          <Button 
            onClick={() => setShowAddControl(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Control
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Current Spend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.spendingControls.map((control) => (
                <TableRow key={control.id}>
                  <TableCell className="font-medium capitalize">
                    {control.type}
                  </TableCell>
                  <TableCell>{control.target}</TableCell>
                  <TableCell>₹{control.limit.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{control.period}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      ₹{control.currentSpend.toLocaleString()}
                      {control.currentSpend > control.limit && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      control.active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {control.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateControl({
                        ...control,
                        active: !control.active
                      })}
                    >
                      {control.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Control Dialog */}
      <Dialog open={showAddControl} onOpenChange={setShowAddControl}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Spending Control</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newControl.type}
                onValueChange={(value) => setNewControl(prev => ({ ...prev, type: value as 'department' | 'category' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Target</label>
              <Input
                value={newControl.target}
                onChange={(e) => setNewControl(prev => ({ ...prev, target: e.target.value }))}
                placeholder={`Enter ${newControl.type} name`}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Limit</label>
              <Input
                type="number"
                value={newControl.limit}
                onChange={(e) => setNewControl(prev => ({ ...prev, limit: parseFloat(e.target.value) }))}
                placeholder="Enter amount limit"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Period</label>
              <Select
                value={newControl.period}
                onValueChange={(value) => setNewControl(prev => ({ ...prev, period: value as 'monthly' | 'quarterly' | 'yearly' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddControl(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddControl}>
                Add Control
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};