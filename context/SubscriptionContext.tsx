import { useToast } from "@/context/ToastContext";
import {
    clearPaymentAttempt,
    getActiveSubscription,
} from "@/services/subscriptionService";
import { UserSubscription } from "@/types/subscription";
import { useRouter, type Href } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Linking, View } from "react-native";

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
  const { showToast } = useToast();
  const router = useRouter();

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      const activeSub = await getActiveSubscription();
      setSubscription(activeSub);
    } catch (error) {
      console.error("Error refreshing subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  // Global deep-link handler for payment callbacks
  useEffect(() => {
    const handleUrlEvent = async (event: { url: string }) => {
      try {
        const url = event.url;
        if (!url) return;

        // parse query params
        const query = url.includes("?") ? url.split("?")[1] : "";
        const params = new URLSearchParams(query);
        const reference =
          params.get("reference") ||
          params.get("ref") ||
          params.get("payment_reference");
        if (!reference) return;

        // Verify payment with backend
        const result = await verifyChatPayment(reference);

        if (result && result.paid) {
          // Clear any pending payment attempts that match this reference
          try {
            const pending = await getPendingPayments();
            const matches = pending.filter((p) => p.reference === reference);
            for (const m of matches) {
              await clearPaymentAttempt(m.paymentId);
            }
          } catch (err) {
            console.warn("Error clearing pending payments:", err);
          }

          // Refresh local subscription state
          try {
            await refreshSubscription();
          } catch (err) {
            console.warn(
              "Error refreshing subscription after payment callback:",
              err,
            );
          }

          showToast("Subscription activated successfully", "success");
          // Navigate to messages or default screen
          try {
            router.replace("/(tabs)/messages" as unknown as Href);
          } catch (err) {
            // ignore navigation errors
          }
        } else {
          const message = result?.message || "Payment verification failed";
          showToast(message, "error");
        }
      } catch (error) {
        console.error("Error handling deep link payment callback:", error);
      }
    };

    // Add listener
    const subscriptionListener: any = Linking.addEventListener(
      "url",
      handleUrlEvent,
    );

    // Handle initial URL (cold start)
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleUrlEvent({ url: initialUrl });
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      try {
        subscriptionListener.remove();
      } catch (err) {
        // ignore
      }
    };
  }, [refreshSubscription, router, showToast]);

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
          (options.redirectTo as Href) ??
          ("/(tabs)/subscribe" as unknown as Href);
        router.push(target);
      }
    }, [subscription, isLoading, router]);

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
