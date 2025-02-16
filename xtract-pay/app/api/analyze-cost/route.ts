import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';
import { CostOptimization } from '@/types/admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { bills } = await req.json();

    // Group expenses by department and category
    const groupedExpenses = bills.reduce((acc: any, bill: any) => {
      const key = `${bill.department}-${bill.category}`;
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          count: 0,
          department: bill.department,
          category: bill.category
        };
      }
      acc[key].total += bill.amount;
      acc[key].count++;
      return acc;
    }, {});

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a cost optimization expert. Analyze the provided expense data and suggest cost reduction opportunities.
          Focus on:
          - Spending patterns by department
          - Category-wise expense analysis
          - Vendor consolidation opportunities
          - Process efficiency improvements
          Provide specific recommendations with quantifiable savings potential.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Analyze these expenses and provide detailed cost optimization recommendations',
            data: {
              bills,
              groupedExpenses
            },
          }),
        },
      ],
      functions: [
        {
          name: 'provide_cost_optimizations',
          parameters: {
            type: 'object',
            properties: {
              optimizations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { 
                      type: 'string',
                      description: 'Department or expense category'
                    },
                    currentSpend: { 
                      type: 'number',
                      description: 'Current annual spending'
                    },
                    benchmark: { 
                      type: 'number',
                      description: 'Industry benchmark or target spending'
                    },
                    potentialSaving: { 
                      type: 'number',
                      description: 'Estimated annual savings potential'
                    },
                    recommendations: { 
                      type: 'array',
                      items: { type: 'string' },
                      description: 'List of specific recommendations'
                    },
                    priority: { 
                      type: 'string', 
                      enum: ['high', 'medium', 'low'],
                      description: 'Priority level based on impact and effort'
                    }
                  },
                  required: ['category', 'currentSpend', 'benchmark', 'potentialSaving', 'recommendations', 'priority']
                }
              }
            },
            required: ['optimizations']
          }
        }
      ],
      function_call: { name: 'provide_cost_optimizations' }
    });

    const functionCall = response.choices[0]?.message?.function_call;
    
    if (functionCall?.arguments) {
      const { optimizations } = JSON.parse(functionCall.arguments);
      return NextResponse.json(optimizations);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error in cost analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze cost optimization' }, { status: 500 });
  }
}