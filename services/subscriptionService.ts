import { getApiUrl } from '@/config/api';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import { get } from 'react-hook-form';
import { Platform } from 'react-native';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'daily',
    name: 'Daily Access',
    description: 'Access to all chat features for 24 hours',
    price: 300,
    duration: 'day',
    features: [
      'Unlimited messages',
      'Access to all matches',
      '24/7 support',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Access',
    description: 'Full access for 30 days',
    price: 3000,
    duration: 'month',
    isPopular: true,
    features: [
      'All Daily Access features',
      'Priority support',
      'Profile boost',
      'See who liked you',
    ],
  },
];

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS;
};

export const getActiveSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const response = await fetch(`${getApiUrl}/subscriptions/me`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

export const initiatePayment = async (planId: string): Promise<{ authorizationUrl: string; reference: string }> => {
  try {
    const response = await fetch(`${getApiUrl}/subscriptions/initiate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here
      },
      body: JSON.stringify({
        planId,
        callbackUrl: Platform.OS === 'web' 
          ? `${window.location.origin}/payment-callback` 
          : 'pairfect://payment-callback',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initiating payment:', error);
    throw error;
  }
};

export const verifyPayment = async (reference: string): Promise<{ success: boolean; subscription?: UserSubscription }> => {
  try {
    const response = await fetch(`${getApiUrl}/subscriptions/verify-payment/${reference}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here
      },
    });
    
    if (!response.ok) {
      throw new Error('Payment verification failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false };
  }
};
