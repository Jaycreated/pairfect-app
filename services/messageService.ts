import { API_CONFIG } from "@/config/api";
import { api } from "@/services/api";
import * as SecureStore from "expo-secure-store";

export interface MessageCount {
  totalSent: number;
  freeMessagesUsed: number;
  freeMessagesLimit: number;
  hasPaidAccess: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  requiresSubscription?: boolean;
  remainingFreeMessages?: number;
}

const DEFAULT_FREE_MESSAGES_LIMIT = 3;
const MESSAGE_COUNT_KEY = "message_count";

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------

/**
 * Clear cached message count from local storage
 */
export const clearLocalMessageCount = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(MESSAGE_COUNT_KEY);
    console.log("Cleared cached message count");
  } catch (error) {
    console.error("Error clearing local message count:", error);
  }
};

/**
 * Get message count from local SecureStore (fallback when API is unavailable).
 */
export const getLocalMessageCount = async (): Promise<MessageCount> => {
  try {
    const stored = await SecureStore.getItemAsync(MESSAGE_COUNT_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        totalSent: data.totalSent || 0,
        freeMessagesUsed: data.freeMessagesUsed || 0,
        freeMessagesLimit: data.freeMessagesLimit || DEFAULT_FREE_MESSAGES_LIMIT,
        hasPaidAccess: data.hasPaidAccess || false,
      };
    }
  } catch (error) {
    console.error("Error getting local message count:", error);
  }

  return {
    totalSent: 0,
    freeMessagesUsed: 0,
    freeMessagesLimit: DEFAULT_FREE_MESSAGES_LIMIT,
    hasPaidAccess: false,
  };
};

/**
 * Persist message count to local SecureStore.
 */
export const saveLocalMessageCount = async (
  count: MessageCount,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(MESSAGE_COUNT_KEY, JSON.stringify(count));
  } catch (error) {
    console.error("Error saving local message count:", error);
  }
};

// ---------------------------------------------------------------------------
// Server-backed helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the current message count from the server, falling back to local
 * storage if the request fails.
 */
export const getMessageCount = async (): Promise<MessageCount> => {
  console.log('=== getMessageCount START ===');
  try {
    // Use the correct endpoint that exists in the backend
    const endpoint = API_CONFIG.ENDPOINTS.MESSAGES.COUNT;
    console.log('Fetching message count from endpoint:', endpoint);
    const response = await api.get<{
      success?: boolean;
      data?: {
        hasAccess: boolean;
        planType: string;
        freeMessagesRemaining: number;
        freeMessagesLimit: number;
        nextResetInHours: string;
      };
      // Alternative response format
      freeMessages?: {
        limit: number;
        used: number;
        remaining: number;
      };
    }>(endpoint);
    console.log('getMessageCount API response:', response);

    if (response.error) {
      console.error(`getMessageCount failed for ${endpoint}:`, response.error);
      throw new Error(response.error.message || "Failed to get message count");
    }

    const data = response.data?.data || response.data || {
      hasAccess: false,
      planType: 'free',
      freeMessagesRemaining: 0,
      freeMessagesLimit: DEFAULT_FREE_MESSAGES_LIMIT,
      nextResetInHours: '24'
    };

    console.log('API Response Data:', data);
    
    // Handle both response formats from backend
    const freeMessagesData = (data as any).freeMessages || {};
    const accessData = (data as any).data || data;

    console.log('freeMessagesData:', freeMessagesData);
    console.log('accessData:', accessData);
    
    const messageCount = {
      totalSent: 0, // Backend doesn't provide this, use default
      freeMessagesUsed: freeMessagesData.used !== undefined ? freeMessagesData.used : (accessData.freeMessagesLimit || DEFAULT_FREE_MESSAGES_LIMIT) - (accessData.freeMessagesRemaining || 0),
      freeMessagesLimit: freeMessagesData.limit || accessData.freeMessagesLimit || DEFAULT_FREE_MESSAGES_LIMIT,
      hasPaidAccess: (accessData.planType || freeMessagesData.planType || 'free') !== 'free',
    };

    console.log('Calculated messageCount:', messageCount);

    // Save the correct data to local cache
    await saveLocalMessageCount(messageCount);
    console.log('Message count saved to local cache');
    
    console.log('=== getMessageCount END ===');
    return messageCount;
  } catch (error) {
    console.error("Error getting message count — falling back to local:", error);
    const localCount = await getLocalMessageCount();
    console.log('Fallback to local count:', localCount);
    return localCount;
  }
};

/**
 * Determine whether the current user is allowed to send a message.
 */
export const canSendMessage = async (): Promise<{
  canSend: boolean;
  remainingFree: number;
  requiresSubscription: boolean;
}> => {
  try {
    const messageCount = await getMessageCount();

    if (messageCount.hasPaidAccess) {
      return { canSend: true, remainingFree: 0, requiresSubscription: false };
    }

    const remainingFree =
      messageCount.freeMessagesLimit - messageCount.freeMessagesUsed;
    const canSend = remainingFree > 0;

    return {
      canSend,
      remainingFree: Math.max(0, remainingFree),
      requiresSubscription: !canSend,
    };
  } catch (error) {
    console.error("Error checking if user can send message:", error);
    // When we genuinely cannot determine the state, surface the uncertainty
    // rather than silently granting access with a misleading remainingFree count.
    console.warn(
      "canSendMessage: unable to verify quota — defaulting to blocked to avoid over-consumption.",
    );
    return { canSend: false, remainingFree: 0, requiresSubscription: false };
  }
};

/**
 * Send a message, enforcing the free-message limit and updating local state
 * from the server response where possible.
 */
export const sendMessageWithLimit = async (
  conversationId: string,
  content: string,
): Promise<SendMessageResponse> => {
  console.log('=== sendMessageWithLimit START ===');
  console.log('conversationId:', conversationId);
  console.log('content:', content);
  
  try {
    const { canSend, remainingFree, requiresSubscription } =
      await canSendMessage();
    console.log('canSendMessage check result:', { canSend, remainingFree, requiresSubscription });

    if (!canSend) {
      console.log('User cannot send message - returning failure');
      return {
        success: false,
        message: `You've used all your free messages. Subscribe to continue chatting!`,
        requiresSubscription: true,
        remainingFreeMessages: 0,
      };
    }

    console.log('User can send message, calling API...');
    // Use conversation-based send to match the API used elsewhere (`api.getMessages`)
    const endpoint = API_CONFIG.ENDPOINTS.MESSAGES.CONVERSATION(conversationId);
    console.log('API endpoint:', endpoint);
    const response = await api.post<{
      success?: boolean;
      message?: string;
      freeMessagesUsed?: number;
      freeMessagesLimit?: number;
      hasPaidAccess?: boolean;
    }>(endpoint, { content });
    console.log('API response:', response);

    if (response.error) {
      console.error(
        `sendMessageWithLimit failed for ${endpoint}:`,
        response.error,
      );

      if (
        response.error.code === "SUBSCRIPTION_REQUIRED" ||
        response.error.status === 402
      ) {
        return {
          success: false,
          message:
            response.error.message || "Subscription required to send messages",
          requiresSubscription: true,
          remainingFreeMessages: 0,
        };
      }

      throw new Error(response.error.message || "Failed to send message");
    }

    const data = response.data || {};
    console.log('Response data after successful send:', data);

    // Check if the request was successful based on absence of error or presence of success field
    // The API returns HTTP 201 for successful message sending
    const isSuccess = !response.error || data.success === true;
    console.log('Request successful check:', { isSuccess, hasError: !!response.error, dataSuccess: data.success });

    if (isSuccess) {
      console.log('Message send successful, updating local count...');
      // Prefer server-authoritative counts; fall back to local increment.
      const currentCount = await getLocalMessageCount();
      console.log('Current local count before update:', currentCount);
      
      const updatedCount: MessageCount = {
        ...currentCount,
        totalSent: currentCount.totalSent + 1,
        // Use server value if returned, otherwise increment locally.
        freeMessagesUsed:
          data.freeMessagesUsed ?? currentCount.freeMessagesUsed + 1,
        freeMessagesLimit:
          data.freeMessagesLimit ?? currentCount.freeMessagesLimit,
        hasPaidAccess: data.hasPaidAccess ?? currentCount.hasPaidAccess,
      };
      console.log('Updated count to be saved:', updatedCount);
      
      await saveLocalMessageCount(updatedCount);
      console.log('Local count saved');

      const updatedRemaining = Math.max(
        0,
        updatedCount.freeMessagesLimit - updatedCount.freeMessagesUsed,
      );
      console.log('Calculated remaining messages:', updatedRemaining);

      const result = {
        success: true,
        message: "Message sent successfully",
        remainingFreeMessages: updatedCount.hasPaidAccess
          ? undefined
          : updatedRemaining,
      };
      console.log('sendMessageWithLimit returning:', result);
      console.log('=== sendMessageWithLimit END ===');
      return result;
    }

    // Server responded without an error but success was falsy — treat as failure.
    return {
      success: false,
      message: data.message || "Message could not be delivered",
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to send message",
    };
  }
};

/**
 * Reset the message count after a subscription purchase.
 * Uses the shared `api` wrapper (fixes the missing `getApiUrl` bug).
 */
export const resetMessageCount = async (
  hasAccess: boolean = true,
): Promise<void> => {
  try {
    // Fix: use the api wrapper instead of the undefined `getApiUrl` helper.
    const endpoint = `${API_CONFIG.ENDPOINTS.MESSAGES.BASE}/count/reset`;
    const response = await api.post(endpoint, { hasPaidAccess: hasAccess });

    if (response.error) {
      console.error("Error resetting message count on server:", response.error);
    }
  } catch (error) {
    console.error("Error resetting message count on server:", error);
  }

  // Always reset locally regardless of server outcome.
  const currentCount = await getLocalMessageCount();
  await saveLocalMessageCount({
    ...currentCount,
    freeMessagesUsed: 0,
    hasPaidAccess: hasAccess,
  });
};

/**
 * Update the paid-access flag in local storage (e.g. after a webhook confirms
 * a subscription without a full count reset).
 */
export const updatePaidAccessStatus = async (
  hasAccess: boolean,
): Promise<void> => {
  const currentCount = await getLocalMessageCount();
  await saveLocalMessageCount({ ...currentCount, hasPaidAccess: hasAccess });
};