import { getActiveSubscription } from '@/services/subscriptionService';
import { UserSubscription } from '@/types/subscription';
import { useRouter, type Href } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type SubscriptionContextType = {
  subscription: UserSubscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      const activeSub = await getActiveSubscription();
      setSubscription(activeSub);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ subscription, isLoading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

/** 
 * 🔐 Protect Screens Based on Subscription
 * Usage: export default withSubscription(MyScreen, { redirectTo: '/(tabs)/subscribe' });
 */
export const withSubscription = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { redirectTo?: Href } = {}
) => {
  const WithSubscription: React.FC<P> = (props) => {
    const { subscription, isLoading } = useSubscription();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !subscription) {
        router.push(options.redirectTo || '/(tabs)/subscribe');
      }
    }, [subscription, isLoading, router]);

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!subscription) {
      return null; // 👈 Screen will auto-redirect
    }

    return <WrappedComponent {...props} />;
  };

  return WithSubscription;
};
