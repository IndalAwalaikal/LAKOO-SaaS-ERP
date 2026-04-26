import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Product {
  id: string;
  tenant_id: string;
  category_id?: string;
  sku: string;
  name: string;
  description?: string;
  image_url?: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  min_stock: number;
  unit: string;
  is_active: boolean;
  price: number; // legacy/mapping helper
  stock: number; // legacy/mapping helper
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get('/products');
      const rawData = response.data?.data || [];
      return rawData.map((item: any) => ({
        ...item,
        price: item.selling_price ?? item.price ?? 0,
        stock: item.stock_qty ?? item.stock ?? 0
      }));
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      const response = await apiClient.post('/products', newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updatedProduct }: Partial<Product> & { id: string }) => {
      const response = await apiClient.put(`/products/${id}`, updatedProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiClient.delete(`/products/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
