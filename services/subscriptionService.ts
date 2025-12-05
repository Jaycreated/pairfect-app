import { getApiUrl } from '@/config/api';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Dummy subscription data for development
const DUMMY_SUBSCRIPTION: UserSubscription = {
  id: 'sub_123456789',
  userId: 'user_123',
  planId: 'premium_monthly',
  status: 'active',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  paymentReference: 'pay_123456789',
  amount: 999,
  currency: 'Naira'
};

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

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  // In development, return a dummy token
  if (__DEV__) {
    return 'dummy_auth_token';
  }
  
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to create headers with auth
const createHeaders = async (additionalHeaders: Record<string, string> = {}): Promise<HeadersInit> => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS;
};

export const getActiveSubscription = async (): Promise<UserSubscription | null> => {
  // In development, return the dummy subscription
  if (__DEV__) {
    console.log('Using dummy subscription data for development');
    return DUMMY_SUBSCRIPTION;
  }

  try {
    const headers = await createHeaders();
    const response = await fetch(getApiUrl('/subscriptions/me'), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Subscription fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      
      throw new Error(`Failed to fetch subscription: ${response.status}`);
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
  try {
    const idempotencyKey = generateIdempotencyKey();
    const headers = await createHeaders({
      'Idempotency-Key': idempotencyKey,
    });
    
    const response = await fetch(getApiUrl('/subscriptions/orders'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Order creation failed:', {
        status: response.status,
        error: errorData
      });
      throw new Error(errorData.message || 'Failed to create order');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const initiatePayment = async (orderId: string): Promise<{ 
  paymentId: string;
  authorizationUrl: string; 
  reference: string;
}> => {
  try {
    const idempotencyKey = generateIdempotencyKey();
    const headers = await createHeaders({
      'Idempotency-Key': idempotencyKey,
    });
    
    const callbackUrl = Platform.OS === 'web' 
      ? `${window.location.origin}/payment-callback` 
      : 'pairfect://payment-callback';
    
    const response = await fetch(getApiUrl('/subscriptions/initiate-payment'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        callbackUrl,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment initiation failed:', {
        status: response.status,
        error: errorData
      });
      throw new Error(errorData.message || 'Failed to initiate payment');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error initiating payment:', error);
    throw error;
  }
};

export const verifyPayment = async (reference: string): Promise<{ 
  success: boolean; 
  subscription?: UserSubscription;
  message?: string;
}> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(getApiUrl(`/subscriptions/verify-payment/${reference}`), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment verification failed:', {
        status: response.status,
        error: errorData
      });
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
  try {
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
  } catch (error) {
    console.error('Error storing payment attempt:', error);
    throw error;
  }
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
  try {
    const payments = await getPendingPayments();
    const updatedPayments = payments.filter(payment => payment.paymentId !== paymentId);
    await SecureStore.setItemAsync('pending_payments', JSON.stringify(updatedPayments));
  } catch (error) {
    console.error('Error clearing payment attempt:', error);
    throw error;
  }
};

// Utility function to check if user has active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const subscription = await getActiveSubscription();
    if (!subscription) return false;
    
    const expiresAt = new Date(subscription.endDate);
    return expiresAt > new Date();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Clean up expired payment attempts (older than 24 hours)
export const cleanupExpiredPayments = async (): Promise<void> => {
  try {
    const payments = await getPendingPayments();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const validPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.timestamp);
      return paymentDate > oneDayAgo;
    });
    
    if (validPayments.length !== payments.length) {
      await SecureStore.setItemAsync('pending_payments', JSON.stringify(validPayments));
      console.log(`Cleaned up ${payments.length - validPayments.length} expired payment attempts`);
    }
  } catch (error) {
    console.error('Error cleaning up expired payments:', error);
  }
};