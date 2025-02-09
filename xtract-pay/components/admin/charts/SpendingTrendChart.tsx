import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart } from "recharts";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";

export const SpendingTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8884d8"
              name="Total Spend"
            />
            <Line
              type="monotone"
              dataKey="validAmount"
              stroke="#82ca9d"
              name="Valid Spend"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};