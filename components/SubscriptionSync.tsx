import { useSubscription } from '@/context/SubscriptionContext';
import { useMessageCount } from '@/context/MessageCountContext';
import React, { useEffect } from 'react';

/**
 * Component that syncs subscription status with message count
 * Place this inside the providers to ensure proper synchronization
 */
export const SubscriptionSync: React.FC = () => {
  const { subscription } = useSubscription();
  const { updateSubscriptionStatus } = useMessageCount();

  useEffect(() => {
    // Update message count when subscription changes
    updateSubscriptionStatus(!!subscription);
  }, [subscription, updateSubscriptionStatus]);

  // This component doesn't render anything
  return null;
};

export default SubscriptionSync;
