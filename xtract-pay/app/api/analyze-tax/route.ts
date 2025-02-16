import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';
import { TaxInsight } from '@/types/admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { bills } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a tax optimization expert. Analyze the provided expense data and suggest tax saving opportunities. 
          Focus on these aspects:
          - Tax deductions and credits
          - Expense categorization
          - Compliance optimization
          - Documentation requirements
          Return specific, actionable recommendations with estimated savings.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Analyze these expenses and provide detailed tax saving recommendations',
            data: bills,
          }),
        },
      ],
      functions: [
        {
          name: 'provide_tax_insights',
          parameters: {
            type: 'object',
            properties: {
              insights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { 
                      type: 'string',
                      description: 'Category of tax optimization (e.g., "Travel Expenses", "Equipment Depreciation")'
                    },
                    potentialSaving: { 
                      type: 'number',
                      description: 'Estimated annual savings in rupees'
                    },
                    suggestion: { 
                      type: 'string',
                      description: 'Clear, actionable suggestion for tax optimization'
                    },
                    impact: { 
                      type: 'string', 
                      enum: ['high', 'medium', 'low'],
                      description: 'Priority level of the suggestion'
                    },
                    implementation: { 
                      type: 'string',
                      description: 'Step-by-step implementation guidance'
                    }
                  },
                  required: ['category', 'potentialSaving', 'suggestion', 'impact', 'implementation']
                }
              }
            },
            required: ['insights']
          }
        }
      ],
      function_call: { name: 'provide_tax_insights' }
    });

    const functionCall = response.choices[0]?.message?.function_call;
    
    if (functionCall?.arguments) {
      const { insights } = JSON.parse(functionCall.arguments);
      return NextResponse.json(insights);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error in tax analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze tax opportunities' }, { status: 500 });
  }
}
