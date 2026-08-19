import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Image, Text } from "react-native";

export default function Index() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const { isLoading: isAuthLoading, profile } = useAuth();

  useEffect(() => {
    SecureStore.getItemAsync("onboarding_completed")
      .then((val) => setOnboardingDone(val === "true"))
      .catch(() => setOnboardingDone(false)); // treat error as needs onboarding
  }, []);

  if (onboardingDone === null || isAuthLoading) {
    // Don't render a JS splash — keep the native splash visible until
    // `FontLoader` hides it. Return null so only the native launch screen
    // is shown while onboarding/auth state resolves.
    return null;
  }

  if (!onboardingDone) return <Redirect href="/onboarding" />;
  if (!profile) return <Redirect href="/(auth)/signup" />;
  return <Redirect href="/(tabs)/swipe" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#651B55",
  },
});