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

  // Load user profile from backend using current auth token
  const loadProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const response = await api.getProfile();
      if (response.data) {
        // Backend /users/me returns the user object
        setUser(response.data as User);
        setProfile(response.data as User);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

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
          // If we have a token, load the user profile
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
      const response = await api.login(email, password);

      if (!response.data || response.error) {
        const message = response.error?.message || 'Failed to sign in';
        throw new Error(message);
      }

      const { token, user } = response.data as { token: string; user: User };

      // Persist token so services/api can use it for subsequent requests
      await Storage.setItem('auth_token', token);

      setUser(user);
      setProfile(user);

      // Check if user has seen onboarding
      const hasSeenOnboarding = await Storage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding === 'true') {
        router.replace('/(tabs)');
      } else {
        await Storage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
      }

      return user;
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
    // TODO: Implement real sign-up flow against backend
    setIsLoading(false);
    throw new Error('Sign up is not implemented yet');
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
