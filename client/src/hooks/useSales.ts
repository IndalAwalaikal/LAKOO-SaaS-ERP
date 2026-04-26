import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  qty: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  tenant_id: string;
  invoice_no: string;
  customer_id?: string;
  total_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items?: SaleItem[];
}

export const useSales = () => {
  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiClient.get('/sales');
      return response.data?.data || [];
    },
  });
};
