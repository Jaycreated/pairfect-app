import { getApiUrl } from "@/config/api";
import { SubscriptionPlan, UserSubscription } from "@/types/subscription";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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
  freeMessagesLimit?: number;
  freeMessagesRemaining?: number;
  reference?: string;
};

// Dummy subscription data for development
const DUMMY_SUBSCRIPTION: UserSubscription = {
  id: "sub_123456789",
  userId: "user_123",
  planId: "premium_monthly",
  status: "active",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  paymentReference: "pay_123456789",
  amount: 999,
  currency: "Naira",
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "daily",
    name: "Daily Access",
    description: "Access to all chat features for 24 hours",
    price: 300,
    duration: "day",
    features: ["Unlimited messages", "Access to all matches", "24/7 support"],
  },
  {
    id: "monthly",
    name: "Monthly Access",
    description: "Full access for 30 days",
    price: 3000,
    duration: "month",
    isPopular: true,
    features: [
      "All Daily Access features",
      "Priority support",
      "Profile boost",
      "See who liked you",
    ],
  },
];

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) {
      console.warn("No auth token found in SecureStore");
    }
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Helper function to create headers with auth
const createHeaders = async (
  additionalHeaders: Record<string, string> = {},
): Promise<HeadersInit> => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS;
};

export const getActiveSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      // Use the existing checkChatAccess endpoint
      const accessStatus = await checkChatAccess();

      // Only return subscription if user has actual PAID access (not just free access)
      if (!accessStatus.hasAccess || accessStatus.planType === 'free') {
        console.log("No active subscription found or access not granted");
        return null;
      }

      // If we have PAID access, create a subscription object
      const subscription: UserSubscription = {
        id: `sub_${accessStatus.reference || Date.now()}`,
        userId: "", // This would come from auth context
        planId: accessStatus.planType || "premium",
        status: "active",
        startDate: new Date().toISOString(),
        // Use the expiry date from the response if available, otherwise default to 30 days
        endDate:
          accessStatus.expiryDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentReference: accessStatus.reference || "",
        amount: 0, // This would come from the payment verification
        currency: "NGN", // Default to Naira since this is a Nigerian app
      };

      console.log("Active subscription:", subscription);
      return subscription;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return null;
    }
  };

// Verify iOS/Android in-app purchase receipt with backend
export const verifyIapReceipt = async (
  receiptData: string,
  productId?: string,
): Promise<{
  success: boolean;
  subscription?: UserSubscription;
  message?: string;
}> => {
  try {
    const headers = await createHeaders({
      "Content-Type": "application/json",
    });

    // Parse receipt data if it's a string (could be JSON)
    let receiptPayload: any = receiptData;
    try {
      if (typeof receiptData === "string" && receiptData.startsWith("{")) {
        receiptPayload = JSON.parse(receiptData);
      }
    } catch (e) {
      // If not JSON, treat as raw receipt string
    }

    const response = await fetch(getApiUrl("api/payments/verify-iap"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        receipt: receiptPayload,
        productId,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || "Failed to verify receipt",
      };
    }

    const data = await response.json();
    return {
      success: true,
      subscription: data.subscription,
      message: data.message,
    };
  } catch (error) {
    console.error("Error verifying receipt:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Utility function to check if user has active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    console.log("Checking chat access status...");
    const { hasAccess, planType, expiryDate } = await checkChatAccess();
    console.log(`Chat access status: ${hasAccess ? "GRANTED" : "DENIED"}`);

    if (hasAccess) {
      console.log(
        `Subscription details - Plan: ${planType || "N/A"}, Expires: ${expiryDate || "N/A"}`,
      );
    } else {
      console.warn("No active subscription found or access denied");
    }

    return hasAccess;
  } catch (error) {
    console.error("Error checking subscription status:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
};

/**
 * Check chat access status
 */
export const checkChatAccess = async (): Promise<AccessStatusResponse> => {
  try {
    const headers = await createHeaders();
    const url = getApiUrl("/payments/chat/access");

    console.log("Checking chat access at:", url);
    const response = await fetch(url, {
      headers,
      credentials: "include", // Include cookies if needed
    });

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error(
        `Invalid response format: ${responseText.substring(0, 100)}...`,
      );
    }

    if (!response.ok) {
      console.error("Chat access check failed:", {
        status: response.status,
        statusText: response.statusText,
        url,
        response: data,
      });

      // Return default access denied if it's a 401 or 403
      if (response.status === 401 || response.status === 403) {
        return { hasAccess: false };
      }

      throw new Error(
        `Failed to check chat access: ${response.status} - ${response.statusText}`,
      );
    }

    console.log("Chat access response:", data);
    
    // Parse the nested data structure correctly
    const accessData = data.data || data;
    const freeMessages = accessData.freeMessages || {};
    
    return {
      hasAccess: accessData.hasAccess || false,
      planType: accessData.planType || 'free',
      freeMessagesLimit: freeMessages.limit || accessData.freeMessagesLimit || 3,
      freeMessagesRemaining: freeMessages.remaining !== undefined ? freeMessages.remaining : (accessData.freeMessagesRemaining !== undefined ? accessData.freeMessagesRemaining : 0),
      expiryDate: accessData.expiryDate || null
    };
  } catch (error) {
    console.error("Error checking chat access:", error);
    // Return default access denied on error
    return { hasAccess: false };
  }
};

