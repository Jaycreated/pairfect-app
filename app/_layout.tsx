
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Storage } from '@/utils/storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { queryClient } from '../lib/queryClient';
import './global.css';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  } as Notifications.NotificationBehavior),
});

// This is a wrapper component to apply the font to all children
function FontWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
}

// This component will handle the auth state and redirects
function AuthLayout() {
  const { profile, isProfileLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check if user has seen onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const seen = await Storage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(seen === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Add a small delay to ensure the navigation is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation based on auth and onboarding status
  useEffect(() => {
    const checkNavigation = async () => {
      if (isProfileLoading || !isNavigationReady || isCheckingOnboarding) return;

      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = segments[0] === '(auth)' && segments[1] === 'onboarding';

      try {
        // Check if user has completed onboarding
        const hasCompleted = await Storage.getItem('onboarding_completed');
        
        // If onboarding not completed, redirect to onboarding
        if (hasCompleted !== 'true') {
          if (!inOnboarding) {
            router.replace('/(auth)/onboarding');
          }
          return;
        }

        // Handle auth-based routing
        if (!profile) {
          if (!inAuthGroup) {
            router.replace('/(auth)/login');
          }
        } else {
          if (inAuthGroup) {
            router.replace('/(tabs)');
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Default to login on error
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      }
    };

    checkNavigation();
  }, [profile, segments, isProfileLoading, isNavigationReady, hasSeenOnboarding, isCheckingOnboarding]);

  if (isProfileLoading || !isNavigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="(auth)/onboarding"
        options={{ 
          headerShown: false,
          animation: 'fade',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <FontWrapper>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AuthLayout />
      </FontWrapper>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <NotificationProvider>
            <SubscriptionProvider>
              <RootLayoutNav />
            </SubscriptionProvider>
          </NotificationProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
