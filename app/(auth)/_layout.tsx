import { Storage } from '@/utils/storage';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const customFonts = {
  'Poppins-Regular': Poppins_400Regular,
  'Poppins-Medium': Poppins_500Medium,
  'Poppins-SemiBold': Poppins_600SemiBold,
  'Poppins-Bold': Poppins_700Bold,
};

export default function AuthLayout() {
  const [fontsLoaded] = useFonts(customFonts);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompleted = await Storage.getItem('onboarding_completed');
        if (hasCompleted !== 'true') {
          // If not completed, redirect to onboarding
          router.replace('/(auth)/onboarding');
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // On error, redirect to onboarding to be safe
        router.replace('/(auth)/onboarding');
        return;
      } finally {
        setIsReady(true);
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    };

    checkOnboarding();
  }, [fontsLoaded]);

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#651B55" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
      </Stack>
    </View>
  );
}
