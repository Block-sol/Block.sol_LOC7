import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart } from "recharts";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

export const DepartmentSpendingChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Spending</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" name="Total Spend" />
            <Bar dataKey="budget" fill="#82ca9d" name="Budget" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};