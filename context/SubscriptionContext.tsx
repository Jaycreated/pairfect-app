import { useAuth } from "@/context/AuthContext";
import { getActiveSubscription } from "@/services/subscriptionService";
import { UserSubscription } from "@/types/subscription";
import { useRouter, type Href } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type SubscriptionContextType = {
  subscription: UserSubscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      console.log("SubscriptionContext: No authenticated user, clearing subscription");
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // If user profile explicitly says they have paid chat access, mock a valid subscription object
      if (user?.has_chat_access) {
        console.log("SubscriptionContext: User profile has_chat_access is true, granting paid subscription");
        setSubscription({
          id: `sub_profile_${user.id}`,
          userId: String(user.id),
          planId: "premium",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          paymentReference: user.payment_reference || "profile_access",
          amount: 0,
          currency: "NGN"
        });
        return;
      }

      const activeSub = await getActiveSubscription();
      setSubscription(activeSub);
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.has_chat_access, user?.payment_reference]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{ subscription, isLoading, refreshSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

/**
 * 🔐 Protect Screens Based on Subscription
 * Usage: export default withSubscription(MyScreen, { redirectTo: '/(tabs)/subscribe' });
 */
export const withSubscription = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { redirectTo?: Href } = {},
) => {
  const WithSubscription: React.FC<P> = (props) => {
    const { subscription, isLoading } = useSubscription();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !subscription) {
        const target: Href =
          options.redirectTo ?? ("/(tabs)/subscribe" as Href);

        router.replace(target);
      }
    }, [subscription, isLoading, router, options.redirectTo]);

    if (isLoading) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
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
