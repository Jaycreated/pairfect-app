import { api } from '@/services/api';
import { SignInCredentials, SignUpData, User } from '@/types/auth';
import { Storage } from '@/utils/storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  // User state
  user: User | null;
  profile: User | null;
  isProfileLoading: boolean;
  
  // Auth methods
  signIn: (credentials: SignInCredentials) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  signOut: () => Promise<void>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Profile methods
  updateProfile: (userData: Partial<User>) => Promise<Partial<User>>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    setIsProfileLoading(true);
    try {
      const response = await api.getProfile();
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, [user]);

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await api.updateProfile(userData);
      if (response.data) {
        setProfile(prev => ({ ...prev, ...response.data } as User));
      }
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await Storage.getItem('auth_token');
        if (token) {
          // If we have a token, try to load the user profile
          await loadProfile();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [loadProfile]);

  const signIn = async ({ email, password }: SignInCredentials): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Dummy authentication - replace with actual API call
      if (email === 'test@example.com' && password === 'password123') {
        const dummyUser: User = {
          id: '1',
          email,
          name: 'Test User',
          token: 'dummy-jwt-token',
        };

        // In a real app, you would get the token from the API response
        await Storage.setItem('auth_token', dummyUser.token);
        
        setUser(dummyUser);
        setProfile(dummyUser);
        
        // Check if user has seen onboarding
        const hasSeenOnboarding = await Storage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
          router.replace('/(tabs)');
        } else {
          // If it's the first time, show onboarding
          await Storage.setItem('hasSeenOnboarding', 'true');
          router.replace('/(tabs)'); // Or '/onboarding' if you want to show onboarding
        }
        
        return dummyUser;
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<User> => {
    setIsLoading(true);
  };

  const signOut = async () => {
    try {
      // Clear all auth state
      await Storage.deleteItem('auth_token');
      setUser(null);
      setProfile(null);
      setError(null);
      
      // Redirect to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.warn('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile,
        isProfileLoading,
        signIn, 
        signUp, 
        signOut, 
        isLoading, 
        error,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
