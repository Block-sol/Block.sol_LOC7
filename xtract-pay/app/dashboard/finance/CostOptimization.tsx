// components/admin/CostOptimization.tsx
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
  TrendingDown,
  AlertCircle,
  ArrowRight,
  PieChart,
  DollarSign,
  Building2
} from 'lucide-react';
import { CostOptimization } from '@/types/admin';
import { adminService } from '@/services/adminService';

interface CostOptimizationProps {
  departments: string[];
  onImplement: (optimization: CostOptimization) => void;
}

export const CostOptimizationDashboard: React.FC<CostOptimizationProps> = ({
  departments,
  onImplement
}) => {
  const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);
  const [departmentSavings, setDepartmentSavings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptimizations = async () => {
      try {
        const data: CostOptimization[] = await adminService.getCostOptimizations();
        setOptimizations(data);
        
        // Calculate department-wise potential savings
        const deptSavings: Record<string, number> = {};
        departments.forEach(dept => {
          const deptOpts = data.filter((opt: { category: string; }) => opt.category.startsWith(dept));
          deptSavings[dept] = deptOpts.reduce((acc: any, curr: { potentialSaving: any; }) => acc + curr.potentialSaving, 0);
        });
        setDepartmentSavings(deptSavings);
      } catch (error) {
        console.error('Error fetching optimizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, [departments]);

  const totalPotentialSavings = optimizations.reduce(
    (acc, curr) => acc + curr.potentialSaving,
    0
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50';
      case 'low':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Potential Savings</p>
                <p className="text-2xl font-bold">₹{totalPotentialSavings.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <TrendingDown className="h-4 w-4 mr-1" />
                Potential {((totalPotentialSavings / totalPotentialSavings) * 100).toFixed(1)}% reduction
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">High Priority Actions</p>
                <p className="text-2xl font-bold">
                  {optimizations.filter(opt => opt.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-red-600">
                Requiring immediate attention
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Departments Affected</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-blue-600">
                With optimization opportunities
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Savings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Optimization Opportunities</CardTitle>
          <CardDescription>Potential savings by department</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Potential Savings</TableHead>
                <TableHead>Action Items</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => {
                const deptOpts = optimizations.filter(opt => 
                  opt.category.startsWith(dept)
                );
                const highPriority = deptOpts.filter(opt => 
                  opt.priority === 'high'
                ).length;

                return (
                  <TableRow key={dept}>
                    <TableCell className="font-medium">{dept}</TableCell>
                    <TableCell>₹{departmentSavings[dept]?.toLocaleString()}</TableCell>
                    <TableCell>{deptOpts.length} items</TableCell>
                    <TableCell>
                      {highPriority > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-600">
                          {highPriority} High Priority
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>Actionable steps to reduce costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((opt, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{opt.category}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Current Spend: ₹{opt.currentSpend.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(opt.priority)}`}>
                    {opt.priority.toUpperCase()} Priority
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    // components/admin/CostOptimization.tsx (continued)
                    <span className="font-medium">
                      Potential Savings: ₹{opt.potentialSaving.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {opt.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 mt-1 text-blue-500" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onImplement(opt)}
                    >
                      Implement Recommendation
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};