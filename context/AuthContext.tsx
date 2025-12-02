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
      if (response.data?.user) {
        // Get the token from storage to include in user object
        const token = await Storage.getItem('auth_token');
        const userWithToken = {
          ...response.data.user,
          token: token || ''
        };
        setUser(userWithToken);
        setProfile(userWithToken);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // If profile load fails, token might be invalid
      throw error;
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
        setUser(prev => ({ ...prev, ...response.data } as User));
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
          try {
            await loadProfile();
          } catch (error) {
            // If profile load fails, token is likely invalid
            console.error('Profile load failed, clearing auth:', error);
            await Storage.deleteItem('auth_token');
            setUser(null);
            setProfile(null);
          }
        }
        // If no token, user stays null (will show login screen)
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, clear any invalid auth state
        await Storage.deleteItem('auth_token');
        setUser(null);
        setProfile(null);
      } finally {
        // Always set loading to false so the app can render
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [loadProfile]);

  const signIn = async ({ email, password }: SignInCredentials): Promise<User> => {
    setError(null);

    try {
      const response = await api.login(email, password);

      if (!response.data || response.error) {
        const message = response.error?.message || 'Failed to sign in';
        throw new Error(message);
      }

      const { token, user: userData } = response.data as { token: string; user: User };

      // Persist token for subsequent API requests
      await Storage.setItem('auth_token', token);

      // Create user object with token
      const userWithToken = { ...userData, token };
      
      setUser(userWithToken);
      setProfile(userWithToken);

      return userWithToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
      throw error;
    }
  };

  const signUp = async (data: SignUpData): Promise<User> => {
    setError(null);
    
    try {
      // TODO: Implement real sign-up flow against backend
      // const response = await api.signup(data);
      // const { token, user } = response.data;
      // await Storage.setItem('auth_token', token);
      // setUser(user);
      // setProfile(user);
      // return user;
      
      throw new Error('Sign up is not implemented yet');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setError(errorMessage);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth state
      await Storage.deleteItem('auth_token');
      setUser(null);
      setProfile(null);
      setError(null);

      // Navigation will be handled by the layout based on user state
    } catch (error) {
      console.error('Logout failed:', error);
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