import { api } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.updateProfile(userData);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to update profile');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      // Error toast will be shown by the component
    }
  });
}

// Avatar upload can be handled directly in the component using the api service
