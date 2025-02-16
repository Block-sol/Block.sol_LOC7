import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Receipt,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

// Types based on the OpenAI function parameters
interface TaxInsight {
  category: string;
  potentialSaving: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

// Mock bills data for testing
const MOCK_BILLS = [
  {
    id: '1',
    amount: 50000,
    category: 'Travel',
    vendor: 'Airlines Co',
    expense_date: '2024-02-01',
    department: 'Sales'
  },
  {
    id: '2',
    amount: 75000,
    category: 'Equipment',
    vendor: 'Tech Store',
    expense_date: '2024-02-05',
    department: 'IT'
  }
];

const TaxCompliancePanel = () => {
  const [insights, setInsights] = React.useState<TaxInsight[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchTaxInsights();
  }, []);

  const fetchTaxInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analyze-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bills: MOCK_BILLS }),
      });

      if (!response.ok) throw new Error('Failed to fetch tax insights');
      
      const data = await response.json();
      setInsights(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalPotentialSavings = insights.reduce(
    (acc, curr) => acc + curr.potentialSaving,
    0
  );

  const highPriorityCount = insights.filter(
    insight => insight.impact === 'high'
  ).length;

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[impact];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading tax insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

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
              <Receipt className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-green-600">
                <TrendingDown className="h-4 w-4 mr-1" />
                Optimizable expenses identified
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">High Priority Actions</p>
                <p className="text-2xl font-bold">{highPriorityCount}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-blue-600">
                Requiring immediate attention
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Tax Compliance Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(((insights.length - highPriorityCount) / Math.max(1, insights.length)) * 100)}%
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-purple-600">
                Overall compliance rating
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Distribution</CardTitle>
          <CardDescription>Potential savings by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Potential Saving']}
                />
                <Legend />
                <Bar 
                  dataKey="potentialSaving" 
                  name="Potential Savings" 
                  fill="#10B981"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Optimization Recommendations</CardTitle>
          <CardDescription>
            Actionable steps to improve tax efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{insight.category}</h4>
                    <p className="text-gray-600 mt-1">{insight.suggestion}</p>
                  </div>
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <Receipt className="h-5 w-5" />
                  <span className="font-medium">
                    Potential Saving: ₹{insight.potentialSaving.toLocaleString()}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="font-medium mb-2">Implementation Steps</h5>
                  <p className="text-sm text-gray-600">{insight.implementation}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxCompliancePanel;