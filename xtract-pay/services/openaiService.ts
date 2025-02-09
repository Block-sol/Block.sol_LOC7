// services/openaiService.ts
import { AdminBillData } from '@/types';

interface TaxAnalysisResult {
  potentialSaving: number;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  category: string;
}

interface CostOptimizationResult {
  category: string;
  currentSpend: number;
  benchmark: number;
  potentialSaving: number;
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export const openaiService = {
  analyzeTaxOpportunities: async (bills: AdminBillData[]) => {
    try {
      const response = await fetch('/api/analyze-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bills }),
      });

      if (!response.ok) throw new Error('Failed to analyze tax opportunities');
      return await response.json() as TaxAnalysisResult[];
    } catch (error) {
      console.error('Error analyzing tax opportunities:', error);
      throw error;
    }
  },

  analyzeCostOptimization: async (bills: AdminBillData[]) => {
    try {
      const response = await fetch('/api/analyze-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bills }),
      });

      if (!response.ok) throw new Error('Failed to analyze cost optimization');
      return await response.json() as CostOptimizationResult[];
    } catch (error) {
      console.error('Error analyzing cost optimization:', error);
      throw error;
    }
  },
};  