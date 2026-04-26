import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  points?: number;
  orders?: number;
  created_at: string;
}

export const useCustomers = () => {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await apiClient.get('/customers');
      return response.data?.data || [];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const response = await apiClient.post('/customers', customer);
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }) }
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }) }
  });
};
