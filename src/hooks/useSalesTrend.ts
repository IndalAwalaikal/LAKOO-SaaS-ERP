import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface SalesTrend {
  date: string;
  amount: number;
}

export const useSalesTrend = () => {
  return useQuery<SalesTrend[]>({
    queryKey: ['salesTrend'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/trend');
      return response.data?.data || [];
    },
  });
};
