import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Notification {
  id: string;
  type: 'low_stock' | 'new_sale';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const useNotifications = () => {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data?.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for semi-real-time
  });
};
