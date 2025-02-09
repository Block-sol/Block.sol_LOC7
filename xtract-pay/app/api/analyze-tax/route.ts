import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a tax optimization expert. Analyze the provided expense data and suggest tax saving opportunities.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Analyze these expenses and provide tax saving recommendations',
            data: billsSummary,
          }),
        },
      ],
      functions: [
        {
          name: 'provide_tax_recommendations',
          parameters: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    potentialSaving: { type: 'number' },
                    suggestion: { type: 'string' },
                    impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                    implementation: { type: 'string' },
                  },
                  required: ['category', 'potentialSaving', 'suggestion', 'impact', 'implementation'],
                },
              },
            },
          },
        },
      ],
      function_call: { name: 'provide_tax_recommendations' },
    });

    const functionCall = response.choices[0]?.message?.function_call;

    let recommendations: any = [];

    if (functionCall && functionCall.arguments) {
      recommendations = JSON.parse(functionCall.arguments)?.recommendations || [];
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error in tax analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze tax opportunities' }, { status: 500 });
  }
}
