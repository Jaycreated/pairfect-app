import { useRouter, type Href } from 'expo-router';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
    canSendMessage,
    getMessageCount,
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

  const refreshMessageCount = async () => {
    try {
      setIsLoading(true);
      const count = await getMessageCount();
      setMessageCount(count);
    } catch (error) {
      console.error('Error refreshing message count:', error);
      showToast('Failed to load message limits', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkCanSend = async () => {
    try {
      return await canSendMessage();
    } catch (error) {
      console.error('Error checking send permission:', error);
      showToast('Network error while checking message limits', 'error');
      return { canSend: false, remainingFree: 0, requiresSubscription: false };
    }
  };

  const sendMessage = async (recipientId: string, content: string) => {
    try {
      const result = await sendMessageWithLimit(recipientId, content);

      if (!result.success) {
        if (result.requiresSubscription) {
          showToast(result.message || 'Subscription required', 'error');
          router.push('/(tabs)/subscribe' as Href);
        } else {
          showToast(result.message || 'Failed to send message', 'error');
        }
        return result;
      }

      // update count after successful send
      await refreshMessageCount();

      if (typeof result.remainingFreeMessages === 'number') {
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
        showToast('Message sent successfully!', 'success');
      }

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
    !!messageCount &&
    (messageCount.hasPaidAccess ||
      messageCount.freeMessagesUsed < messageCount.freeMessagesLimit);

  const remainingFreeMessages = messageCount
    ? Math.max(
        0,
        messageCount.freeMessagesLimit - messageCount.freeMessagesUsed
      )
    : 0;

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