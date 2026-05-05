import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/auth';

export const useUpdateTenantProfile = () => {
  const updateTenant = useAuthStore(state => state.updateTenant);
  const updateUser = useAuthStore(state => state.updateUser);

  return useMutation({
    mutationFn: async (payload: { name: string, slug: string, owner_name: string, email: string, logo_url?: string | null, payment_config?: string | null }) => {
      const response = await apiClient.put('/tenant', payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      updateTenant({ name: variables.name, slug: variables.slug, logo_url: variables.logo_url, payment_config: variables.payment_config });
      updateUser({ name: variables.owner_name, email: variables.email });
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.put('/tenant/password', payload);
      return response.data;
    }
  });
};

export const useStaffMembers = () => {
  return useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const response = await apiClient.get('/tenant/users');
      return response.data?.data || [];
    }
  });
};

export const useAddStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/tenant/users', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
    }
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/tenant/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
    }
  });
};
