import OpenAI from 'openai';
import { NextResponse, NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
});

export async function POST(req: NextRequest) {
  try {
    const { bills } = await req.json();

    // Prepare data for analysis
    const billsSummary = bills.map((bill: { amount: number; category: string; vendor: string; expense_date: string; department: string }) => ({
      amount: bill.amount,
      category: bill.category,
      vendor: bill.vendor,
      date: bill.expense_date,
      department: bill.department,
    }));

    // Group by department and category for better analysis
    const departmentSummary = bills.reduce(
      (acc: Record<string, { total: number; categories: Record<string, number> }>, bill: { department: string; amount: number; category: string }) => {
        if (!acc[bill.department]) {
          acc[bill.department] = { total: 0, categories: {} };
        }
        acc[bill.department].total += bill.amount;
        acc[bill.department].categories[bill.category] = (acc[bill.department].categories[bill.category] || 0) + bill.amount;
        return acc;
      },
      {}
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a cost optimization expert. Analyze the provided expense data and suggest cost reduction opportunities.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Analyze these expenses and provide cost optimization recommendations',
            data: {
              bills: billsSummary,
              departmentAnalysis: departmentSummary,
            },
          }),
        },
      ],
      functions: [
        {
          name: 'provide_cost_recommendations',
          parameters: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    currentSpend: { type: 'number' },
                    benchmark: { type: 'number' },
                    potentialSaving: { type: 'number' },
                    recommendations: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  },
                  required: ['category', 'currentSpend', 'benchmark', 'potentialSaving', 'recommendations', 'priority'],
                },
              },
            },
          },
        },
      ],
      function_call: { name: 'provide_cost_recommendations' },
    });

    const functionCall = response.choices[0]?.message?.function_call;

    let recommendations: any = [];

    if (functionCall && functionCall.arguments) {
      recommendations = JSON.parse(functionCall.arguments)?.recommendations || [];
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error in cost analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze cost optimization' }, { status: 500 });
  }
}
