import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Check if this is the first launch
        const hasLaunched = await SecureStore.getItemAsync('hasLaunched');
        
        if (!hasLaunched) {
          // First launch - show onboarding
          await SecureStore.setItemAsync('hasLaunched', 'true');
          setHasSeenOnboarding(false);
        } else {
          // Not first launch - check if onboarding was completed
          const completed = await SecureStore.getItemAsync('onboarding_completed');
          setHasSeenOnboarding(completed === 'true');
        }
      } catch (error) {
        console.error('Error checking first launch status:', error);
        setHasSeenOnboarding(true); // Default to not showing onboarding on error
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  // Show onboarding if it's the first launch or onboarding not completed
  if (hasSeenOnboarding === false) {
    return <Redirect href="/onboarding" />;
  }

  // Check if user is authenticated
  const isAuthenticated = false; // Replace with your actual auth check
  
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signup" />;
  }

  // If authenticated and onboarding completed, go to main app
  return <Redirect href="/(tabs)/swipe" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});