import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function TabLayout() {
  const router = useRouter();

  // Check if onboarding is completed when the tab layout loads
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompleted = await SecureStore.getItemAsync('onboarding_completed');
        if (hasCompleted !== 'true') {
          // If not completed, ensure we're on the onboarding tab
          router.setParams({ screen: 'onboarding' });
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, []);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' }, // Hide tab bar
    }}>
      <Tabs.Screen
        name="onboarding"
        options={{
          title: 'Onboarding',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="info-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
    </Tabs>
  );
}
