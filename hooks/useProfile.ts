import { api } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getProfile();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: any) => api.updateProfile(userData),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageUri: string) => api.uploadAvatar(imageUri),
    onSuccess: () => {
      // Invalidate and refetch profile data after avatar upload
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
