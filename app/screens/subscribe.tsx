import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useToast } from "@/context/ToastContext";
import { PRODUCT_IDS, purchaseItem, getAvailableProducts, restorePurchases } from "@/services/iapService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SubscribeScreen() {
  const router = useRouter();
  const { subscription, refreshSubscription } = useSubscription();
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/messages");
    }
  };

  const plans = [
    {
      id: "daily",
      name: "Daily",
      duration: "day",
      description: "24 hours chat access",
      features: ["Unlimited messaging", "Chat access for 24 hours"],
      isPopular: true,
    },
    {
      id: "monthly",
      name: "Monthly",
      duration: "month",
      description: "30 days chat access",
      features: ["Unlimited messaging", "Chat access for 30 days"],
      isPopular: false,
    },
  ];

  // Fetch store products dynamically
  useEffect(() => {
    const loadStoreProducts = async () => {
      try {
        const available = await getAvailableProducts();
        console.log("[Subscribe] expected product IDs:", Platform.OS === "ios" ? PRODUCT_IDS.ios : PRODUCT_IDS.android);
        console.log("[Subscribe] raw store products:", JSON.stringify(available, null, 2));

        if (available && available.length > 0) {
          setStoreProducts(available);
          console.log("[Subscribe] dynamically loaded store products:", available.length);
        } else {
          console.log("[Subscribe] no products returned from store; using fallback local pricing");
        }
      } catch (err) {
        console.error("[Subscribe] failed to load store products:", err);
      }
    };
    loadStoreProducts();
  }, []);

  const getPlanPriceDisplay = (planId: string, duration: string) => {
    const platformIds = Platform.OS === "ios" ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
    const productId = planId === "daily" ? platformIds.daily : platformIds.monthly;

    const storeProduct = storeProducts.find((p: any) => {
      const candidateId = p.productId || p.productIdentifier || p.id;
      return candidateId === productId;
    });

    if (storeProduct) {
      const livePrice =
        storeProduct.displayPrice ||
        storeProduct.localizedPrice ||
        `${storeProduct.price} ${storeProduct.currency || "USD"}`;

      console.log("[Subscribe] matched product for", planId, JSON.stringify(storeProduct, null, 2));
      return livePrice;
    }

    console.log("[Subscribe] no product match found for", planId, "expected", productId, "available ids:", storeProducts.map((p: any) => p.productId || p.productIdentifier || p.id));

    // This screen should not show hardcoded store prices.
    return "Loading...";
  };

  const handleSubscribe = async (planId: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setSelectedPlan(planId);

      // Use native IAP for both iOS and Android
      const platformIds = Platform.OS === "ios" ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
      const productId = planId === "daily" ? platformIds.daily : platformIds.monthly;

      console.log("[Subscribe] Purchase completed for product:", productId);
      const purchaseResult = await purchaseItem(productId);
      console.log("[Subscribe] purchaseItem resolved with:", purchaseResult);

      // The backend may update the user's access flag a moment after the receipt is verified.
      // Refresh both the profile and the subscription state before sending the user back.
      console.log("[Subscribe] Refreshing profile + subscription after successful purchase...");
      const [profileResult, subscriptionResult] = await Promise.all([
        refreshProfile().catch((err) => {
          console.error("[Subscribe] refreshProfile failed:", err);
          return null;
        }),
        refreshSubscription().catch((err) => {
          console.error("[Subscribe] refreshSubscription failed:", err);
          return null;
        }),
      ]);

      console.log("[Subscribe] post-purchase state:", {
        profileResult,
        subscriptionResult,
        hasChatAccessFromProfile: (profileResult as any)?.has_chat_access,
      });

      router.replace("/(tabs)/messages");
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process payment. Please try again.";
      if (errorMessage !== "Purchase was cancelled") {
        showToast(errorMessage, "error");
      }
    } finally {
      setSelectedPlan(null);
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;

    try {
      setIsRestoring(true);
      showToast("Checking purchases with Apple...", "info");
      
      const success = await restorePurchases();
      if (success) {
        await refreshSubscription();
        showToast("Purchases restored successfully!", "success");
        router.replace("/(tabs)/messages");
      } else {
        showToast("No active purchases found to restore.", "info");
      }
    } catch (err) {
      console.error("Restore error:", err);
      const msg = err instanceof Error ? err.message : "Failed to restore purchases.";
      showToast(msg, "error");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[styles.planCard, plan.isPopular && styles.popularPlan]}
          >
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {getPlanPriceDisplay(plan.id, plan.duration)}
              <Text style={styles.planDuration}> / {plan.duration}</Text>
            </Text>
            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#651B55" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                isProcessing && selectedPlan === plan.id && styles.subscribeButtonLoading,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isProcessing}
            >
              {isProcessing && selectedPlan === plan.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {subscription ? "Manage Plan" : "Subscribe Now"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* UGC Legal Terms Disclaimers */}
      <View style={styles.footerLinksContainer}>
        <Text style={styles.footerTermsText}>
          By subscribing, you agree to our{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.push("/screens/eula")}
          >
            Terms of Use (EULA)
          </Text>{" "}
          and acknowledge our{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.push("/screens/help-support")}
          >
            Privacy Policy
          </Text>.
        </Text>
        <Text style={styles.footerRenewalText}>
          Subscription billing is processed automatically through your App Store account. You can manage or cancel your subscription at any time in your Apple ID account settings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginLeft: 16,
  },
  headerSpacer: {
    width: 32,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: "#651B55",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#651B55",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#651B55",
    marginBottom: 8,
  },
  planDuration: {
    fontSize: 16,
    color: "#666",
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: "#444",
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: "#651B55",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  subscribeButtonLoading: {
    opacity: 0.8,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerLinksContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  footerTermsText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  footerLink: {
    color: "#651B55",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footerRenewalText: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 15,
  },
});
