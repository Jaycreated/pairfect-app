import { api } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

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
      return response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Show success message
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  });
}

// Avatar upload can be handled directly in the component using the api service
