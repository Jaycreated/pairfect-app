
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (isProfileLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!profile && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in and not in the auth group
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      // Redirect away from the sign-in page if the user is signed in
      router.replace('/(tabs)');
    }
  }, [profile, segments, isProfileLoading]);

  if (isProfileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <FontWrapper>
              <AuthLayout />
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </FontWrapper>
          </ThemeProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
