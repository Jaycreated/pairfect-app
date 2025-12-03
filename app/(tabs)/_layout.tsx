import { Header } from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';

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

  const handleNotificationPress = () => {
    router.push('/(tabs)/notifications');
  };

  return (
    <Tabs
      screenOptions={{
        header: () => <Header onNotificationPress={handleNotificationPress} />,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: '#651B55',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
          paddingRight: 32,
          paddingLeft: 32,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
     
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}