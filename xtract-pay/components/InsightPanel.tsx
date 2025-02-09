import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  BarChart3
} from 'lucide-react';

// Insight Card Component
interface Insight {
  category: string;
  suggestion?: string;
  recommendations: string[];
  priority?: string;
  impact?: string;
  potentialSaving: number;
  implementation?: string;
}

export interface TaxInsight {
    category: string;
    potentialSaving: number;
    recommendations: string[];
  }

const InsightCard = ({ insight, type }: { insight: Insight; type: string }) => {
  const getImpactColor = (impact: string | number | undefined) => {
    const colors = {
      high: 'bg-red-50 text-red-600',
      medium: 'bg-yellow-50 text-yellow-600',
      low: 'bg-green-50 text-green-600'
    };
    return impact ? colors[impact as keyof typeof colors] || colors.medium : colors.medium;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{insight.category}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {type === 'tax' ? insight.suggestion : insight.recommendations[0]}
            </p>
          </div>
          <Badge className={getImpactColor(insight.priority || insight.impact)}>
            {((insight.priority || insight.impact) ?? '').toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-green-600 mb-4">
          <DollarSign className="h-5 w-5" />
          <span className="font-medium">
            Potential Savings: ₹{insight.potentialSaving.toLocaleString()}
          </span>
        </div>

        {type === 'cost' && insight.recommendations.length > 1 && (
          <div className="space-y-2 mt-4">
            <p className="font-medium text-sm text-gray-700">Additional Recommendations:</p>
            {insight.recommendations.slice(1).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-gray-600">{rec}</p>
              </div>
            ))}
          </div>
        )}

        {type === 'tax' && (
          <div className="mt-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Implementation: </span>
              {insight.implementation}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Implement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Summary Stats Component
interface SummaryStatsProps {
  data: Insight[];
  type: string;
}

const SummaryStats = ({ data, type }: SummaryStatsProps) => {
  const totalSavings = data.reduce((acc: any, curr: { potentialSaving: any; }) => acc + curr.potentialSaving, 0);
  const highPriority = data.filter((item: Insight) => 
    (item.priority === 'high' || item.impact === 'high')
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Potential Savings</p>
              <p className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">High Priority Actions</p>
              <p className="text-2xl font-bold">{highPriority}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Optimization Score</p>
              <p className="text-2xl font-bold">{Math.round((data.length - highPriority) / data.length * 100)}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Savings Chart Component
const SavingsChart = ({ data }: { data: Insight[] }) => {
  const chartData = data.map((item: Insight) => ({
    category: item.category,
    saving: item.potentialSaving,
    priority: item.priority || item.impact
  }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Savings Distribution</CardTitle>
        <CardDescription>Potential savings by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="saving"
                fill="#10B981"
                name="Potential Savings"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Components Export
export const TaxInsightsPanel = ({ insights }: { insights: TaxInsight[] }) => {
  return (
    <div className="space-y-6">
      <SummaryStats data={insights} type="tax" />
      <SavingsChart data={insights} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight: Insight, index: React.Key | null | undefined) => (
          <InsightCard key={index} insight={insight} type="tax" />
        ))}
      </div>
    </div>
  );
};

export const CostInsightsPanel = ({ insights }: { insights: Insight[] }) => {
  return (
    <div className="space-y-6">
      <SummaryStats data={insights} type="cost" />
      <SavingsChart data={insights} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight: Insight, index: React.Key | null | undefined) => (
          <InsightCard key={index} insight={insight} type="cost" />
        ))}
      </div>
    </div>
  );
};