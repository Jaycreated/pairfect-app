
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
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

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <FontWrapper>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </FontWrapper>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
