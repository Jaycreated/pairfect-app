import { useToast } from '@/context/ToastContext';
import {
    canSendMessage,
    getMessageCount,
    sendMessageWithLimit,
    updatePaidAccessStatus,
    type MessageCount
} from '@/services/messageService';
import { useRouter, type Href } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type MessageCountContextType = {
  messageCount: MessageCount | null;
  isLoading: boolean;
  canSend: boolean;
  remainingFreeMessages: number;
  refreshMessageCount: () => Promise<void>;
  sendMessage: (recipientId: string, content: string) => Promise<{ success: boolean; message?: string }>;
  checkCanSend: () => Promise<{ canSend: boolean; remainingFree: number; requiresSubscription: boolean }>;
  updateSubscriptionStatus: (hasAccess: boolean) => Promise<void>;
};

const MessageCountContext = createContext<MessageCountContextType | undefined>(undefined);

export const MessageCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messageCount, setMessageCount] = useState<MessageCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  const refreshMessageCount = async () => {
    try {
      setIsLoading(true);
      const count = await getMessageCount();
      setMessageCount(count);
    } catch (error) {
      console.error('Error refreshing message count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCanSend = async () => {
    try {
      return await canSendMessage();
    } catch (error) {
      console.error('Error checking if can send message:', error);
      return { canSend: false, remainingFree: 0, requiresSubscription: true };
    }
  };

  const sendMessage = async (recipientId: string, content: string) => {
    try {
      const result = await sendMessageWithLimit(recipientId, content);
      
      if (result.success) {
        // Refresh message count after successful send
        await refreshMessageCount();
        
        if (result.remainingFreeMessages !== undefined) {
          if (result.remainingFreeMessages > 0) {
            showToast(`Message sent! ${result.remainingFreeMessages} free messages remaining.`, 'success');
          } else {
            showToast('Message sent! You\'ve used all your free messages. Subscribe to continue chatting.', 'warning');
          }
        } else {
          showToast('Message sent successfully!', 'success');
        }
      } else {
        if (result.requiresSubscription) {
          showToast(result.message || 'Subscription required', 'error');
          // Navigate to subscription screen
          router.push('/(tabs)/subscribe' as Href);
        } else {
          showToast(result.message || 'Failed to send message', 'error');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
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
    }
  };

  // Load initial message count
  useEffect(() => {
    refreshMessageCount();
  }, []);

  const canSend = messageCount?.hasPaidAccess || (messageCount ? messageCount.freeMessagesUsed < messageCount.freeMessagesLimit : false);
  const remainingFreeMessages = messageCount ? Math.max(0, messageCount.freeMessagesLimit - messageCount.freeMessagesUsed) : 0;

  return (
    <MessageCountContext.Provider value={{
      messageCount,
      isLoading,
      canSend,
      remainingFreeMessages,
      refreshMessageCount,
      sendMessage,
      checkCanSend,
      updateSubscriptionStatus,
    }}>
      {children}
    </MessageCountContext.Provider>
  );
};

export const useMessageCount = (): MessageCountContextType => {
  const context = useContext(MessageCountContext);
  if (!context) {
    throw new Error('useMessageCount must be used within a MessageCountProvider');
  }
  return context;
};

/** 
 * 🔐 Protect Message Sending Based on Free Message Limit
 * Usage: export default withMessageLimit(MyComponent);
 */
export const withMessageLimit = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithMessageLimit: React.FC<P> = (props) => {
    const { canSend, remainingFreeMessages, isLoading } = useMessageCount();
    const router = useRouter();
    const { showToast } = useToast();

    const handleSendMessage = async (recipientId: string, content: string) => {
      if (!canSend) {
        showToast(`You've used all your free messages. Subscribe to continue chatting!`, 'error');
        router.push('/(tabs)/subscribe' as Href);
        return { success: false, message: 'Subscription required' };
      }

      // This would be handled by the parent component
      return { success: true };
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
        {...props} 
        canSendMessage={canSend}
        remainingFreeMessages={remainingFreeMessages}
        onSendMessage={handleSendMessage}
      />
    );
  };

  return WithMessageLimit;
};
