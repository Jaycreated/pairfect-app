import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const { isLoading: isAuthLoading, profile } = useAuth();

  useEffect(() => {
    SecureStore.getItemAsync("onboarding_completed")
      .then((val) => setOnboardingDone(val === "true"))
      .catch(() => setOnboardingDone(false)); // treat error as needs onboarding
  }, []);

  if (onboardingDone === null || isAuthLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
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
    backgroundColor: "#000",
  },
});