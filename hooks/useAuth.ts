import { api } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

export const AUTH_QUERY_KEYS = {
  PROFILE: 'auth-profile',
} as const;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
  // Add other registration fields as needed
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.login(credentials.email, credentials.password);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.token) {
        await SecureStore.setItemAsync('auth_token', response.data.token);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch any auth-related queries
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEYS.PROFILE] });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await api.register(userData);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post(api.ENDPOINTS.AUTH.LOGOUT, {});
      } catch (error) {
        console.warn('Logout API call failed, but continuing with local logout', error);
      }
      
      // Clear local auth state regardless of server response
      await SecureStore.deleteItemAsync('auth_token');
      
      // Clear all queries from the cache
      queryClient.clear();
    },
  });

  // Get user profile query
  const profileQuery = useQuery({
    queryKey: [AUTH_QUERY_KEYS.PROFILE],
    queryFn: async () => {
      const response = await api.getProfile();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    enabled: false, // Will only run when manually triggered
    retry: 1,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.updateProfile(userData);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEYS.PROFILE] });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const response = await api.uploadAvatar(imageUri);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEYS.PROFILE] });
    },
  });

  return {
    // Login
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    // Registration
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registrationError: registerMutation.error,
    
    // Logout
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    
    // Profile
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    refetchProfile: profileQuery.refetch,
    
    // Update Profile
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    
    // Upload Avatar
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
};

export default useAuth;
