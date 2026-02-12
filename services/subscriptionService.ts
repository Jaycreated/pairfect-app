import { getApiUrl } from '@/config/api';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

export type OrderResponse = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
};

export type InitializePaymentResponse = {
  payment_url: string;
  redirect_url: string;
  reference: string;
  provider_transaction_id: string;
  amount: number;
  planType: string;
};

export type VerifyPaymentResponse = {
  paid: boolean;
  planType: string;
  expiryDate: string;
  message: string;
};

export type AccessStatusResponse = {
  hasAccess: boolean;
  planType?: string;
  expiryDate?: string;
  reference?: string;
};

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
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      console.warn('No auth token found in SecureStore');
    }
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
  try {
    // Use the existing checkChatAccess endpoint
    const accessStatus = await checkChatAccess();
    
    if (!accessStatus.hasAccess) {
      console.log('No active subscription found or access not granted');
      return null;
    }
    
    // If we have access, create a subscription object with the available data
    const subscription: UserSubscription = {
      id: `sub_${accessStatus.reference || Date.now()}`,
      userId: '', // This would come from auth context
      planId: accessStatus.planType || 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      // Use the expiry date from the response if available, otherwise default to 30 days
      endDate: accessStatus.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentReference: accessStatus.reference || '',
      amount: 0, // This would come from the payment verification
      currency: 'NGN' // Default to Naira since this is a Nigerian app
    };

    console.log('Active subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
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

export const initiatePayment = async (orderId: string, planId: string): Promise<{ 
  paymentId: string;
  authorizationUrl: string; 
  reference: string;
}> => {
  try {
    const idempotencyKey = generateIdempotencyKey();
    const headers = await createHeaders({
      'Idempotency-Key': idempotencyKey,
    });
    
    // For web, use the payment-callback route
    // For mobile, use a deep link that will open the app
    let callbackUrl: string;
    
    if (Platform.OS === 'web') {
      // For web, redirect to a dedicated payment callback page
      callbackUrl = `${window.location.origin}/payment-callback`;
    } else {
      // For mobile, use a deep link that will open the app
      // Include the order ID and plan ID in the callback URL for verification
      callbackUrl = `pairfect://payment-callback?orderId=${orderId}&planId=${planId}`;
      
      // Also handle the case where the app is opened via the callback URL
      const handleDeepLink = (event: { url: string }) => {
        // Handle the deep link here if needed
        console.log('Received deep link:', event.url);
      };
      
      // Add the event listener
      Linking.addEventListener('url', handleDeepLink);
      
      // Clean up the event listener when done
      setTimeout(() => {
        Linking.removeAllListeners('url');
      }, 10000); // Clean up after 10 seconds
    }
    
    const response = await fetch(getApiUrl('/subscriptions/initiate-payment'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        planId,
        callbackUrl,
        platform: Platform.OS
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

// Verify iOS/Android in-app purchase receipt with backend
export const verifyIapReceipt = async (receiptData: string, productId?: string): Promise<{ success: boolean; subscription?: UserSubscription; message?: string }> => {
  try {
    const headers = await createHeaders({
      'Content-Type': 'application/json',
    });

    // Parse receipt data if it's a string (could be JSON)
    let receiptPayload: any = receiptData;
    try {
      if (typeof receiptData === 'string' && receiptData.startsWith('{')) {
        receiptPayload = JSON.parse(receiptData);
      }
    } catch (e) {
      // If not JSON, treat as raw receipt string
    }

    const response = await fetch(getApiUrl('api/payments/verify-iap'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        receipt: receiptPayload,
        productId,
        platform: Platform.OS
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to verify receipt'
      };
    }

    const data = await response.json();
    return {
      success: true,
      subscription: data.subscription,
      message: data.message
    };
  } catch (error) {
    console.error('Error verifying receipt:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
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
    return SecureStore.setItemAsync(
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
    return SecureStore.setItemAsync('pending_payments', JSON.stringify(updatedPayments));
  } catch (error) {
    console.error('Error clearing payment attempt:', error);
    throw error;
  }
};

// Utility function to check if user has active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    console.log('Checking chat access status...');
    const { hasAccess, planType, expiryDate } = await checkChatAccess();
    console.log(`Chat access status: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    
    if (hasAccess) {
      console.log(`Subscription details - Plan: ${planType || 'N/A'}, Expires: ${expiryDate || 'N/A'}`);
    } else {
      console.warn('No active subscription found or access denied');
    }
    
    return hasAccess;
  } catch (error) {
    console.error('Error checking subscription status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// Clean up expired payment attempts (older than 24 hours)
export const cleanupExpiredPayments = async (): Promise<void> => {
  try {
    const pendingPayments = await getPendingPayments();
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    for (const payment of pendingPayments) {
      const paymentTime = new Date(payment.timestamp).getTime();
      if (paymentTime < twentyFourHoursAgo) {
        await clearPaymentAttempt(payment.paymentId);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired payments:', error);
  }
};

/**
 * Create a new payment order
 */
export const createPaymentOrder = async (amount: number): Promise<OrderResponse> => {
  const headers = await createHeaders();
  const idempotencyKey = generateIdempotencyKey();
  
  const response = await fetch(getApiUrl('/api/subscriptions/orders'), {
    method: 'POST',
    headers: {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ amount, id: idempotencyKey }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment order');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Initialize payment with payment provider
 */
export const initializeChatPayment = async (
  orderId: string,
  planType: string,
  callbackUrl?: string
): Promise<InitializePaymentResponse> => {
  const headers = await createHeaders();
  const payload: any = { orderId, planType };
  
  if (callbackUrl) {
    payload.callbackUrl = callbackUrl;
  }

  const response = await fetch(getApiUrl('/api/payments/chat/initialize'), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize payment');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Verify payment status
 */
export const verifyChatPayment = async (
  reference: string,
  token?: string
): Promise<VerifyPaymentResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const authToken = await getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  const response = await fetch(getApiUrl('/api/payments/chat/verify'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ reference }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }

  return await response.json();
};

/**
 * Check chat access status
 */
export const checkChatAccess = async (): Promise<AccessStatusResponse> => {
  try {
    const headers = await createHeaders();
    const url = getApiUrl('/payments/chat/access');
    
    console.log('Checking chat access at:', url);
    const response = await fetch(url, {
      headers,
      credentials: 'include' // Include cookies if needed
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error('Chat access check failed:', {
        status: response.status,
        statusText: response.statusText,
        url,
        response: data
      });
      
      // Return default access denied if it's a 401 or 403
      if (response.status === 401 || response.status === 403) {
        return { hasAccess: false };
      }
      
      throw new Error(`Failed to check chat access: ${response.status} - ${response.statusText}`);
    }

    console.log('Chat access response:', data);
    return data;
  } catch (error) {
    console.error('Error checking chat access:', error);
    // Return default access denied on error
    return { hasAccess: false };
  }
};

/**
 * Get subscription plans from the server
 */
export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(getApiUrl('/api/payments/subscription/plans'));

  if (!response.ok) {
    throw new Error('Failed to fetch subscription plans');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Verify in-app purchase receipt
 */
export const verifyInAppPurchase = async (
  provider: 'apple' | 'google',
  receipt: string,
  productId?: string
): Promise<{ reference: string }> => {
  const headers = await createHeaders();
  
  const response = await fetch(getApiUrl('/api/subscriptions/verify-iap'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      provider, 
      receipt, 
      ...(productId && { productId }) 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify in-app purchase');
  }

  const data = await response.json();
  return data.data;
};