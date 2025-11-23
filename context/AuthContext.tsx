import { SignInCredentials, SignUpData, User } from '@/types/auth';

type ErrorWithMessage = {
  message: string;
};

import { Storage } from '@/utils/storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await Storage.getItem('user');
        const token = await Storage.getItem('token');
        
        if (userData && token) {
          setUser(JSON.parse(userData));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load user';
        console.error('Failed to load user:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async ({ email, password }: SignInCredentials) => {
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

        await Storage.setItem('user', JSON.stringify(dummyUser));
        await Storage.setItem('token', dummyUser.token);
        setUser(dummyUser);
        
        router.replace('/(tabs)');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async ({ name, email, password }: SignUpData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Dummy registration - replace with actual API call
      const dummyUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        token: `dummy-jwt-${Math.random().toString(36).substr(2)}`,
      };

      // Store user data temporarily without setting the user state
      // This allows us to show the profile setup first
      await Storage.setItem('tempUser', JSON.stringify(dummyUser));
      await Storage.setItem('token', dummyUser.token);
      
      // Redirect to profile setup instead of main app
      router.replace('/(auth)/profile-setup');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await Storage.deleteItem('user');
      await Storage.deleteItem('token');
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        isLoading,
        error,
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
