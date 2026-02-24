import { useSubscription } from "@/context/SubscriptionContext";
import { useToast } from "@/context/ToastContext";
import { getAvailableProducts, purchaseItem } from "@/services/iapService";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as RNIap from "react-native-iap";

/**
 * Example subscription component showing how to:
 * 1. Fetch available products
 * 2. Display subscription plans
 * 3. Handle purchases
 * 4. Display current subscription status
 */
export function SubscriptionPlansComponent() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const availableProducts = await getAvailableProducts();
      setProducts((availableProducts as any) || []);
    } catch (error) {
      console.error("Error loading products:", error);
      showToast("Failed to load subscription plans", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setIsPurchasing(productId);
      await purchaseItem(productId);
      // The purchase will be verified automatically in iapService
      // Subscription status will update through the listener
      showToast("Purchase successful!", "success");
    } catch (error: any) {
      if (error?.code !== "E_USER_CANCELLED") {
        showToast(
          error?.message || "Purchase failed. Please try again.",
          "error",
        );
      }
    } finally {
      setIsPurchasing(null);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show current subscription if active
  if (subscription && subscription.status === "active") {
    const endDate = new Date(subscription.endDate);
    return (
      <View
        style={{ padding: 16, backgroundColor: "#f0f9ff", borderRadius: 8 }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          Active Subscription
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 4 }}>
          Plan: {subscription.planId}
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 4 }}>
          Expires: {endDate.toLocaleDateString()}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Your subscription is active. It will automatically renew on the
          expiration date.
        </Text>
      </View>
    );
  }

  // Show available plans
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 16 }}>
        Choose Your Plan
      </Text>

      {products.length === 0 ? (
        <View
          style={{ padding: 16, backgroundColor: "#fef2f2", borderRadius: 8 }}
        >
          <Text style={{ color: "#991b1b" }}>
            Unable to load subscription plans. Please check your internet
            connection and try again.
          </Text>
          <TouchableOpacity
            onPress={loadProducts}
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#dc2626",
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        products.map((product) => {
          // Get product ID based on platform - use type casting for access
          const p = product as any;
          const productId = p.productId || p.productIdentifier;
          const price = p.localizedPrice || p.price;
          const currency = p.currency || "USD";
          const title = p.title || p.name || productId;
          const description = p.description || "";

          return (
            <View
              key={productId}
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 4 }}
              >
                {title}
              </Text>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                {description}
              </Text>
              <Text
                style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}
              >
                {price} {currency}
              </Text>

              <TouchableOpacity
                onPress={() => handlePurchase(productId)}
                disabled={isPurchasing === productId}
                style={{
                  backgroundColor: "#0ea5e9",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 6,
                  opacity: isPurchasing === productId ? 0.5 : 1,
                }}
              >
                {isPurchasing === productId ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Subscribe Now
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <View style={{ marginVertical: 16, paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 12, color: "#666", lineHeight: 18 }}>
          By subscribing, you agree to automatic renewal. Your subscription will
          renew at the end of each billing cycle. Cancel anytime in your account
          settings.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Simple button component for initiating a purchase
 */
export function SubscribeButton({
  productId,
  label = "Subscribe",
  onSuccess,
  onError,
}: {
  productId: string;
  label?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handlePress = async () => {
    try {
      setIsLoading(true);
      await purchaseItem(productId);
      showToast("Purchase successful!", "success");
      onSuccess?.();
    } catch (error: any) {
      if (error?.code !== "E_USER_CANCELLED") {
        const errorMessage =
          error?.message || "Purchase failed. Please try again.";
        showToast(errorMessage, "error");
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={{
        backgroundColor: "#0ea5e9",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 6,
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text
          style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
