import { getApiUrl } from '@/config/api';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
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

// Generate a unique idempotency key
const generateIdempotencyKey = (): string => {
  return Crypto.randomUUID();
};

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export const createOrder = async (planId: string): Promise<CreateOrderResponse> => {
  const idempotencyKey = generateIdempotencyKey();
  
  const response = await fetch(`${getApiUrl}/subscriptions/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      // Add auth token here
    },
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
};

export const initiatePayment = async (orderId: string): Promise<{ 
  paymentId: string;
  authorizationUrl: string; 
  reference: string;
}> => {
  const idempotencyKey = generateIdempotencyKey();
  
  const response = await fetch(`${getApiUrl}/subscriptions/initiate-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      // Add auth token here
    },
    body: JSON.stringify({
      orderId,
      callbackUrl: Platform.OS === 'web' 
        ? `${window.location.origin}/payment-callback` 
        : 'pairfect://payment-callback',
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to initiate payment');
  }
  
  return response.json();
};

export const verifyPayment = async (reference: string): Promise<{ 
  success: boolean; 
  subscription?: UserSubscription;
  message?: string;
}> => {
  try {
    const response = await fetch(`${getApiUrl}/subscriptions/verify-payment/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Payment verification failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
};

// Payment recovery utilities
export const storePaymentAttempt = async (paymentData: {
  paymentId: string;
  orderId: string;
  reference: string;
  planId: string;
}): Promise<void> => {
  // Get existing payments
  const existingPayments = await getPendingPayments();
  
  // Add new payment
  const updatedPayments = [
    ...existingPayments.filter(p => p.paymentId !== paymentData.paymentId),
    {
      ...paymentData,
      timestamp: new Date().toISOString(),
    }
  ];
  
  // Store all payments under a single key
  await SecureStore.setItemAsync(
    'pending_payments',
    JSON.stringify(updatedPayments)
  );
};

export const getPendingPayments = async (): Promise<Array<{
  paymentId: string;
  orderId: string;
  reference: string;
  planId: string;
  timestamp: string;
}>> => {
  try {
    const paymentsData = await SecureStore.getItemAsync('pending_payments');
    return paymentsData ? JSON.parse(paymentsData) : [];
  } catch (error) {
    console.error('Error getting pending payments:', error);
    return [];
  }
};

export const clearPaymentAttempt = async (paymentId: string): Promise<void> => {
  const payments = await getPendingPayments();
  const updatedPayments = payments.filter(payment => payment.paymentId !== paymentId);
  await SecureStore.setItemAsync('pending_payments', JSON.stringify(updatedPayments));
};
