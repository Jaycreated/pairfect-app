import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MessageCountProvider } from "@/context/MessageCountContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { ToastProvider } from "@/context/ToastContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIAP } from "@/hooks/useIAP";
import { Storage } from "@/utils/storage";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import "react-native-reanimated";
import { queryClient } from "../lib/queryClient";
import "./global.css";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }) as Notifications.NotificationBehavior,
});

// This component ensures fonts are loaded before rendering the app
function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Prevent the native splash screen from auto-hiding until fonts are loaded
  // This avoids a flash where the native splash disappears before JS is ready
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Render nothing while fonts are loading so the native splash remains the
    // only visible launch screen. `preventAutoHideAsync` keeps the native
    // splash visible until `hideAsync` is called when fontsLoaded becomes true.
    return null;
  }

  return <>{children}</>;
}

// This component will handle the auth state and redirects
function AuthLayout() {
  const { profile, isProfileLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );

  // Initialize IAP on app start
  useIAP();

  // Check if it's the first app launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await Storage.getItem("hasLaunched");

        if (!hasLaunched) {
          // First launch - show onboarding and mark as launched
          await Storage.setItem("hasLaunched", "true");
          setHasSeenOnboarding(false);
        } else {
          // Not first launch - check if onboarding was completed
          const completed = await Storage.getItem("onboarding_completed");
          setHasSeenOnboarding(completed === "true");
        }
      } catch (error) {
        console.error("Error checking first launch status:", error);
        setHasSeenOnboarding(true); // Default to not showing onboarding on error
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkFirstLaunch();
  }, []);

  // Add a small delay to ensure the navigation is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation based on first launch and auth status
  useEffect(() => {
    const checkNavigation = async () => {
      if (isProfileLoading || !isNavigationReady || isCheckingOnboarding)
        return;

      const inAuthGroup = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "onboarding";
      const inTabsGroup = segments[0] === "(tabs)";

      try {
        // First check if it's the first launch or onboarding not completed
        const hasLaunched = await Storage.getItem("hasLaunched");
        const hasCompletedOnboarding = await Storage.getItem(
          "onboarding_completed",
        );

        // If it's the first launch or onboarding not completed, show onboarding
        if (hasLaunched === null || hasCompletedOnboarding !== "true") {
          if (!inOnboarding) {
            router.replace("/onboarding");
          }
          return;
        }

        // Get auth token after checking onboarding
        const token = await Storage.getItem("auth_token");

        if (!token) {
          // No token, redirect to login if not already there
          if (!inAuthGroup && !inOnboarding) {
            router.replace("/(auth)/login");
          }
          return;
        }

        // Check if user needs to complete profile setup
        const needsProfileSetup = await Storage.getItem("needsProfileSetup");

        // If user needs to complete profile setup and not already there
        if (needsProfileSetup === "true" && segments[0] !== "(auth)") {
          router.replace("/(auth)/profile-setup");
          return;
        }

        // User is authenticated and profile setup is complete, redirect to tabs
        // if they're in auth or onboarding screens
        if ((inAuthGroup || inOnboarding) && needsProfileSetup !== "true") {
          // Replace the current route with the tabs navigation
          // This ensures the user can't go back to the auth screens with the back button
          router.replace({
            pathname: "/(tabs)",
            params: { screen: "swipe" }, // Explicitly navigate to the swipe screen
          });
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // On error, redirect to login
        if (!inAuthGroup && !inOnboarding) {
          router.replace("/(auth)/login");
        }
      }
    };

    checkNavigation();
  }, [
    profile,
    segments,
    isProfileLoading,
    isNavigationReady,
    isCheckingOnboarding,
  ]);

  // Hide the native splash when navigation/auth are ready. FontLoader
  // already prevented the splash from auto-hiding until fonts are loaded,
  // and because `AuthLayout` is rendered only after fonts load, this ensures
  // the native splash stays visible until the app is truly ready to show UI.
  useEffect(() => {
    if (!isProfileLoading && isNavigationReady && !isCheckingOnboarding) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isProfileLoading, isNavigationReady, isCheckingOnboarding]);

  if (isProfileLoading || !isNavigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="reportReasonPicker"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <FontLoader>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <AuthLayout />
      </FontLoader>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <NotificationProvider>
              <SubscriptionProvider>
                <MessageCountProvider>
                  <RootLayoutNav />
                </MessageCountProvider>
              </SubscriptionProvider>
            </NotificationProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
