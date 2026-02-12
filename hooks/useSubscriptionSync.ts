import { updatePaidAccessStatus } from '@/services/messageService';
import { useSubscription } from '@/context/SubscriptionContext';
import { useMessageCount } from '@/context/MessageCountContext';
import { useEffect } from 'react';

/**
 * Hook to sync subscription status with message count
 * This avoids circular dependencies between contexts
 */
export const useSubscriptionSync = () => {
  const { subscription } = useSubscription();
  const { refreshMessageCount } = useMessageCount();

  useEffect(() => {
    const syncSubscription = async () => {
      try {
        if (subscription) {
          await updatePaidAccessStatus(true);
        } else {
          await updatePaidAccessStatus(false);
        }
        await refreshMessageCount();
      } catch (error) {
        console.error('Error syncing subscription status:', error);
      }
    };

    syncSubscription();
  }, [subscription, refreshMessageCount]);
};
