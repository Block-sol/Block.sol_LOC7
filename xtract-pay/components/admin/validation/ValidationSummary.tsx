import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const ValidationSummary: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data.errors).map(([category, count]) => (
            <div key={category} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{category}</span>
              <span className="text-sm font-medium">{count as number}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};