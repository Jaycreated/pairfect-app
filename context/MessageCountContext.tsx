import { useRouter, type Href } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  canSendMessage,
  getMessageCount,
  getLocalMessageCount,
  sendMessageWithLimit,
  updatePaidAccessStatus,
  type MessageCount,
} from '@/services/messageService';

type MessageCountContextType = {
  messageCount: MessageCount | null;
  isLoading: boolean;
  canSend: boolean;
  remainingFreeMessages: number;
  refreshMessageCount: () => Promise<void>;
  sendMessage: (
    recipientId: string,
    content: string
  ) => Promise<{ success: boolean; message?: string }>;
  checkCanSend: () => Promise<{
    canSend: boolean;
    remainingFree: number;
    requiresSubscription: boolean;
  }>;
  updateSubscriptionStatus: (hasAccess: boolean) => Promise<void>;
};

const MessageCountContext = createContext<MessageCountContextType | undefined>(
  undefined
);

/* =========================
   Provider
========================= */

export const MessageCountProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [messageCount, setMessageCount] = useState<MessageCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const refreshMessageCount = useCallback(async () => {
    console.log('=== refreshMessageCount START ===');
    try {
      setIsLoading(true);
      
      let count: MessageCount;
      if (user?.has_chat_access) {
        console.log('[DEBUG] User has explicit paid chat access, bypassing remote API count check');
        count = {
          totalSent: 0,
          freeMessagesUsed: 0,
          freeMessagesLimit: 9999,
          hasPaidAccess: true
        };
      } else {
        count = await getMessageCount();
      }
      
      console.log('getMessageCount resolved:', count);
      setMessageCount(count);
      console.log('messageCount state updated');
    } catch (error) {
      console.error('Error refreshing message count:', error);
      
      // Resilient fallback to local SecureStore cache so network timeout doesn't break user experience
      try {
        const localCount = await getLocalMessageCount();
        if (user?.has_chat_access) {
          localCount.hasPaidAccess = true;
        }
        setMessageCount(localCount);
        console.log('[DEBUG] Successfully set message count to local cache fallback:', localCount);
      } catch (fallbackError) {
        console.error('[DEBUG] Failed to get local count fallback:', fallbackError);
      }
    } finally {
      setIsLoading(false);
      console.log('=== refreshMessageCount END ===');
    }
  }, [user?.id, user?.has_chat_access]);

  const checkCanSend = async () => {
    try {
      // If user has explicit paid chat access in their profile, skip backend limit check
      if (user?.has_chat_access) {
        return { canSend: true, remainingFree: 9999, requiresSubscription: false };
      }
      return await canSendMessage();
    } catch (error) {
      console.error('Error checking send permission:', error);
      showToast('Network error while checking message limits', 'error');
      return { canSend: false, remainingFree: 0, requiresSubscription: false };
    }
  };

  const sendMessage = async (recipientId: string, content: string) => {
    console.log('=== MessageCountContext.sendMessage START ===');
    console.log('recipientId:', recipientId);
    console.log('content:', content);
    console.log('Current messageCount before send:', messageCount);
    console.log('Current remainingFreeMessages before send:', remainingFreeMessages);
    
    try {
      // If user has explicit paid chat access, skip sending limit guards and just make the direct API send call
      if (user?.has_chat_access) {
        const { api } = await import('@/services/api');
        const response = await api.sendMessage(recipientId, {
          content,
          senderId: String(user.id),
          recipientId
        });
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to send message');
        }
        
        showToast('Message sent!', 'success');
        console.log('=== MessageCountContext.sendMessage END ===');
        return { success: true };
      }

      const result = await sendMessageWithLimit(recipientId, content);
      console.log('sendMessageWithLimit result:', result);

      if (!result.success) {
        console.log('sendMessageWithLimit failed');
        if (result.requiresSubscription) {
          showToast(result.message || 'Subscription required', 'error');
          router.push('/(tabs)/subscribe' as Href);
        } else {
          showToast(result.message || 'Failed to send message', 'error');
        }
        return result;
      }

      console.log('Message sent successfully, updating local state from storage...');
      // Manually update state from local storage to reflect the increment
      const updatedCount = await getMessageCount();
      console.log('Updated count from local storage:', updatedCount);
      setMessageCount(updatedCount);
      console.log('React state updated with new count');
      console.log('New remainingFreeMessages:', Math.max(0, updatedCount.freeMessagesLimit - updatedCount.freeMessagesUsed));

      if (typeof result.remainingFreeMessages === 'number') {
        console.log('remainingFreeMessages from result:', result.remainingFreeMessages);
        if (result.remainingFreeMessages > 0) {
          showToast(
            `Message sent! ${result.remainingFreeMessages} free messages remaining.`,
            'success'
          );
        } else {
          showToast(
            `Message sent! You've used all your free messages.`,
            'warning'
          );
        }
      } else {
        console.log('No remainingFreeMessages in result, showing generic success');
        showToast('Message sent successfully!', 'success');
      }

      console.log('=== MessageCountContext.sendMessage END ===');
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';
      showToast(errorMessage, 'error');
      return { success: false, message: errorMessage };
    }
  };

  const updateSubscriptionStatus = async (hasAccess: boolean) => {
    try {
      await updatePaidAccessStatus(hasAccess);
      await refreshMessageCount();
    } catch (error) {
      console.error('Error updating subscription status:', error);
      showToast('Failed to update subscription status', 'error');
    }
  };

  useEffect(() => {
    // Only refresh message count if there's an authenticated user
    if (user?.id) {
      refreshMessageCount();
    } else {
      // Clear message count when user is null (logged out)
      setMessageCount(null);
      setIsLoading(false);
    }
  }, [user?.id]); // Refresh when user changes

  const canSend =
    !!user?.has_chat_access || (
    !!messageCount &&
    (messageCount.hasPaidAccess ||
      messageCount.freeMessagesUsed < messageCount.freeMessagesLimit)
    );

  const remainingFreeMessages = user?.has_chat_access
    ? 9999
    : (messageCount
        ? Math.max(
            0,
            messageCount.freeMessagesLimit - messageCount.freeMessagesUsed
          )
        : 0);

  return (
    <MessageCountContext.Provider
      value={{
        messageCount,
        isLoading,
        canSend,
        remainingFreeMessages,
        refreshMessageCount,
        sendMessage,
        checkCanSend,
        updateSubscriptionStatus,
      }}
    >
      {children}
    </MessageCountContext.Provider>
  );
};

/* =========================
   Hook
========================= */

export const useMessageCount = (): MessageCountContextType => {
  const context = useContext(MessageCountContext);
  if (!context) {
    throw new Error(
      'useMessageCount must be used within a MessageCountProvider'
    );
  }
  return context;
};

/* =========================
   HOC (Message Limit Guard)
========================= */

type InjectedProps = {
  canSendMessage: boolean;
  remainingFreeMessages: number;
  onSendMessage: (
    recipientId: string,
    content: string
  ) => Promise<{ success: boolean; message?: string }>;
};

export const withMessageLimit = <P extends InjectedProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithMessageLimit: React.FC<Omit<P, keyof InjectedProps>> = (props) => {
    const {
      canSend,
      remainingFreeMessages,
      isLoading,
      sendMessage,
    } = useMessageCount();

    const router = useRouter();
    const { showToast } = useToast();

    const handleSendMessage = async (recipientId: string, content: string) => {
      if (!canSend) {
        showToast(
          "You've used all your free messages. Subscribe to continue chatting!",
          'error'
        );
        router.push('/(tabs)/subscribe' as Href);
        return { success: false, message: 'Subscription required' };
      }

      return await sendMessage(recipientId, content);
    };

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <WrappedComponent
        {...(props as P)}
        canSendMessage={canSend}
        remainingFreeMessages={remainingFreeMessages}
        onSendMessage={handleSendMessage}
      />
    );
  };

  return WithMessageLimit;
};