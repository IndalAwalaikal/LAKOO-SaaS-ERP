import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface FinanceTransaction {
  id: string;
  tenant_id: string;
  type: 'Income' | 'Expense';
  amount: number;
  description: string;
  category: string;
  reference_id?: string;
  date: string;
  created_at: string;
}

export const useFinance = () => {
  return useQuery<FinanceTransaction[]>({
    queryKey: ['finance'],
    queryFn: async () => {
      const response = await apiClient.get('/finance');
      return response.data?.data || [];
    },
  });
};

export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['financeSummary'],
    queryFn: async () => {
      const response = await apiClient.get('/finance/summary');
      return response.data?.data || { total_income: 0, total_expense: 0, net_profit: 0 };
    },
  });
};

export const useRecordFinance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<FinanceTransaction>) => {
      const response = await apiClient.post('/finance', record);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
    },
  });
};
