import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async ({ file, options }: { file: File, options?: { remove_bg?: boolean } }) => {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      if (options?.remove_bg) params.append('remove_bg', 'true');

      const response = await apiClient.post(`/media/upload?${params.toString()}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};
