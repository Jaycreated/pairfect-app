import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pairfect.com';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
};

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

const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const createOrder = async (amount: number, token: string): Promise<OrderResponse> => {
  const response = await fetch(`${API_URL}/api/subscriptions/orders`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ amount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create order');
  }
  
  const data = await response.json();
  return data.data;
};

export const initializePayment = async (
  orderId: string, 
  planType: string, 
  token: string,
  callbackUrl?: string
): Promise<InitializePaymentResponse> => {
  const payload: any = { orderId, planType };
  if (callbackUrl) {
    payload.callbackUrl = callbackUrl;
  }

  const response = await fetch(`${API_URL}/api/payments/chat/initialize`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize payment');
  }
  
  const data = await response.json();
  return data.data;
};

export const verifyPayment = async (reference: string, token?: string): Promise<VerifyPaymentResponse> => {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/payments/chat/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reference }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }
  
  const data = await response.json();
  return data;
};

export const checkAccess = async (token: string): Promise<AccessStatusResponse> => {
  const response = await fetch(`${API_URL}/api/payments/chat/access`, {
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    throw new Error('Failed to check access status');
  }
  
  const data = await response.json();
  return data;
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${API_URL}/api/payments/subscription/plans`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch subscription plans');
  }
  
  const data = await response.json();
  return data.data;
};

export const verifyIAPReceipt = async (
  provider: 'apple' | 'google', 
  receipt: string, 
  productId?: string,
  token: string
): Promise<{ reference: string }> => {
  const response = await fetch(`${API_URL}/api/subscriptions/verify-iap`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ 
      provider, 
      receipt, 
      ...(productId && { productId }) 
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify IAP receipt');
  }
  
  const data = await response.json();
  return data.data;
};
