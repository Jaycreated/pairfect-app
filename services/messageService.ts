import { getApiUrl } from '@/config/api';
import * as SecureStore from 'expo-secure-store';
import { getAuthToken } from './userService';

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

const FREE_MESSAGES_LIMIT = 3;
const MESSAGE_COUNT_KEY = 'message_count';

/**
 * Get the current message count for the user
 */
export const getMessageCount = async (): Promise<MessageCount> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = getApiUrl('/messages/count');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        try {
          errorData = { message: await response.text() };
        } catch (e2) {
          errorData = {};
        }
      }

      console.error(`getMessageCount failed for ${url}:`, response.status, response.statusText, errorData);
      throw new Error(errorData.message || `Failed to get message count (status ${response.status})`);
    }

    const data = await response.json();
    return {
      totalSent: data.totalSent || 0,
      freeMessagesUsed: data.freeMessagesUsed || 0,
      freeMessagesLimit: data.freeMessagesLimit || FREE_MESSAGES_LIMIT,
      hasPaidAccess: data.hasPaidAccess || false,
    };
  } catch (error) {
    console.error('Error getting message count:', error);
    
    // Fallback to local storage if API fails
    return getLocalMessageCount();
  }
};

/**
 * Get message count from local storage (fallback)
 */
export const getLocalMessageCount = async (): Promise<MessageCount> => {
  try {
    const stored = await SecureStore.getItemAsync(MESSAGE_COUNT_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        totalSent: data.totalSent || 0,
        freeMessagesUsed: data.freeMessagesUsed || 0,
        freeMessagesLimit: FREE_MESSAGES_LIMIT,
        hasPaidAccess: data.hasPaidAccess || false,
      };
    }
  } catch (error) {
    console.error('Error getting local message count:', error);
  }

  return {
    totalSent: 0,
    freeMessagesUsed: 0,
    freeMessagesLimit: FREE_MESSAGES_LIMIT,
    hasPaidAccess: false,
  };
};

/**
 * Save message count to local storage
 */
export const saveLocalMessageCount = async (count: MessageCount): Promise<void> => {
  try {
    await SecureStore.setItemAsync(MESSAGE_COUNT_KEY, JSON.stringify(count));
  } catch (error) {
    console.error('Error saving local message count:', error);
  }
};

/**
 * Check if user can send a message
 */
export const canSendMessage = async (): Promise<{ canSend: boolean; remainingFree: number; requiresSubscription: boolean }> => {
  try {
    const messageCount = await getMessageCount();
    
    // If user has paid access, they can always send messages
    if (messageCount.hasPaidAccess) {
      return {
        canSend: true,
        remainingFree: 0,
        requiresSubscription: false,
      };
    }

    // Check if user has free messages remaining
    const remainingFree = messageCount.freeMessagesLimit - messageCount.freeMessagesUsed;
    const canSend = remainingFree > 0;

    return {
      canSend,
      remainingFree: Math.max(0, remainingFree),
      requiresSubscription: !canSend,
    };
  } catch (error) {
    console.error('Error checking if user can send message:', error);
    // Default to allowing the message if we can't check
    return {
      canSend: true,
      remainingFree: 1,
      requiresSubscription: false,
    };
  }
};

/**
 * Send a message with free message limit checking
 */
export const sendMessageWithLimit = async (
  recipientId: string,
  content: string
): Promise<SendMessageResponse> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Check if user can send a message
    const { canSend, remainingFree, requiresSubscription } = await canSendMessage();
    
    if (!canSend) {
      return {
        success: false,
        message: `You've used your ${FREE_MESSAGES_LIMIT} free messages. Subscribe to continue chatting!`,
        requiresSubscription: true,
        remainingFreeMessages: 0,
      };
    }

    // Send the message
    const url = getApiUrl('/messages');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId,
        content,
      }),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        try {
          errorData = { message: await response.text() };
        } catch (e2) {
          errorData = {};
        }
      }

      console.error(`sendMessageWithLimit failed for ${url}:`, response.status, response.statusText, errorData);

      // Check if it's a subscription error
      if (errorData.code === 'SUBSCRIPTION_REQUIRED' || response.status === 402) {
        return {
          success: false,
          message: errorData.message || 'Subscription required to send messages',
          requiresSubscription: true,
          remainingFreeMessages: 0,
        };
      }

      throw new Error(errorData.message || `Failed to send message (status ${response.status})`);
    }

    const data = await response.json();
    
    // Update local message count if successful
    if (data.success) {
      const currentCount = await getLocalMessageCount();
      const updatedCount = {
        ...currentCount,
        totalSent: currentCount.totalSent + 1,
        freeMessagesUsed: currentCount.freeMessagesUsed + 1,
      };
      await saveLocalMessageCount(updatedCount);
    }

    return {
      success: true,
      message: 'Message sent successfully',
      remainingFreeMessages: Math.max(0, remainingFree - 1),
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
};

/**
 * Reset message count (typically called after subscription)
 */
export const resetMessageCount = async (hasAccess: boolean = true): Promise<void> => {
  try {
    const token = await getAuthToken();
    
    if (token) {
      // Try to reset on server
      await fetch(getApiUrl('/messages/count/reset'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Error resetting message count on server:', error);
  }
  
  // Always reset locally
  const currentCount = await getLocalMessageCount();
  const resetCount = {
    ...currentCount,
    freeMessagesUsed: 0,
    hasPaidAccess: hasAccess,
  };
  await saveLocalMessageCount(resetCount);
};

/**
 * Update paid access status
 */
export const updatePaidAccessStatus = async (hasAccess: boolean): Promise<void> => {
  const currentCount = await getLocalMessageCount();
  const updatedCount = {
    ...currentCount,
    hasPaidAccess: hasAccess,
  };
  await saveLocalMessageCount(updatedCount);
};
