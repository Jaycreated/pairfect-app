import { Platform } from "react-native";
import { verifyIapReceipt } from "./subscriptionService";

let RNIap: any = null;
let iapAvailable = false;

// Try to import RNIap, but don't fail if it's not available
try {
  RNIap = require("react-native-iap");
  iapAvailable = true;
} catch (error) {
  console.warn(
    "react-native-iap not available - IAP features will be disabled:",
    error,
  );
  iapAvailable = false;
}

const fetchProductsCompat = async (skus: string[], type: "in-app" | "subs") => {
  if (!RNIap) {
    return [];
  }

  if (typeof RNIap.fetchProducts === "function") {
    const result = await RNIap.fetchProducts({ skus, type });
    return Array.isArray(result) ? result : [];
  }

  if (type === "subs" && typeof RNIap.getSubscriptions === "function") {
    return (await RNIap.getSubscriptions({ skus })) || [];
  }

  if (type === "in-app" && typeof RNIap.getProducts === "function") {
    return (await RNIap.getProducts({ skus })) || [];
  }

  throw new Error(`Unsupported react-native-iap API for ${type} products`);
};

// Product IDs configuration
export const PRODUCT_IDS = {
  // iOS Product IDs (must match App Store Connect)
  ios: {
    daily: "ng.com.pairfect.dailysubscribe",
    monthly: "ng.com.pairfect.monthlyaccess",
  },
  // Android Product IDs (must match Google Play Console)
  android: {
    daily: "com.pairfect.daily",
    monthly: "com.pairfect.monthly",
  },
};

// Purchase type mapping
export const PURCHASE_TYPES = {
  daily: "one_time",
  monthly: "subscription",
};

// Get platform-specific product IDs
export const getPlatformProductIds = (): string[] => {
  const ids = Platform.OS === "ios" ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
  return Object.values(ids);
};

let purchaseListener: any = null;
let purchaseErrorListener: any = null;
let cachedSubscriptions: any[] = []; // Store subscriptions for offerToken access

// Promise resolver for pending purchases
let pendingPurchaseResolver: ((value: any) => void) | null = null;
let pendingPurchaseRejecter: ((error: any) => void) | null = null;

/**
 * Initialize IAP connection and set up purchase listener
 */
export const connectToIAP = async () => {
  if (!iapAvailable) {
    console.warn("IAP not available on this environment");
    return;
  }

  try {
    // Initialize RNIap connection
    await RNIap.initConnection();
    console.log("IAP Connection established");

    // Fetch available products
    await getAvailableProducts();

    // Set up purchase update listener
    setupPurchaseListener();

    // Handle purchases from previous app sessions
    await handlePendingPurchases();
  } catch (error) {
    console.error("Error connecting to IAP:", error);
  }
};

/**
 * Disconnect from IAP
 */
export const disconnectIAP = async () => {
  if (!iapAvailable) {
    return;
  }

  try {
    if (purchaseListener) {
      purchaseListener.remove();
      purchaseListener = null;
    }
    if (purchaseErrorListener) {
      purchaseErrorListener.remove();
      purchaseErrorListener = null;
    }
    await RNIap.endConnection();
    console.log("IAP Connection disconnected");
  } catch (error) {
    console.error("Error disconnecting from IAP:", error);
  }
};

/**
 * Get available products from App Store/Play Store
 */
export const getAvailableProducts = async (): Promise<any[]> => {
  if (!iapAvailable) {
    console.warn("IAP not available - returning empty products");
    return [];
  }

  try {
    const productIds = getPlatformProductIds();
    console.log("[IAP] Attempting to fetch products with IDs:", productIds);

    // Separate daily (one-time) and monthly (subscription) products
    const dailyProductId = Platform.OS === "ios" ? PRODUCT_IDS.ios.daily : PRODUCT_IDS.android.daily;
    const monthlyProductId = Platform.OS === "ios" ? PRODUCT_IDS.ios.monthly : PRODUCT_IDS.android.monthly;

    const isIOS = Platform.OS === "ios";

    if (isIOS) {
      // Apple treats daily and monthly as different product types.
      // Daily pass is an in-app purchase (consumable), while monthly access is an auto-renewable subscription.
      const [dailyProducts, monthlyProducts] = await Promise.all([
        fetchProductsCompat([dailyProductId], "in-app"),
        fetchProductsCompat([monthlyProductId], "subs"),
      ]);

      const allProducts = [...(dailyProducts || []), ...(monthlyProducts || [])];
      console.log("[IAP] iOS product results:", JSON.stringify({ dailyProducts, monthlyProducts }, null, 2));
      cachedSubscriptions = monthlyProducts || [];
      return allProducts;
    }

    const [products, subscriptions] = await Promise.all([
      fetchProductsCompat([dailyProductId], "in-app"),
      fetchProductsCompat([monthlyProductId], "subs"),
    ]);

    console.log("[IAP] Android product results:", JSON.stringify({ products, subscriptions }, null, 2));
    cachedSubscriptions = subscriptions || [];

    if (cachedSubscriptions.length > 0) {
      console.log("SUBSCRIPTION DETAILS:", JSON.stringify(cachedSubscriptions, null, 2));
    }

    const allProducts = [...(products || []), ...(subscriptions || [])];
    console.log("Available products:", allProducts);

    // If no products found, this might be normal in development
    if (!allProducts || allProducts.length === 0) {
      console.warn("No products found - this is normal in development environment");
      console.warn("Products will be available when app is published with proper IAP setup");
    }

    return allProducts;
  } catch (error: any) {
    console.error("Error fetching products:", error);

    // Provide more helpful error messages
    if (error.message?.includes("Failed to query product")) {
      console.warn("Product query failed - this is expected in development:");
      console.warn("1. Make sure app is uploaded to Google Play Console");
      console.warn("2. Products are configured in Play Console");
      console.warn("3. App is signed with release key for testing");
      console.warn("4. Test account is added to Play Console");
    }

    return [];
  }
};

/**
 * Purchase a product (handles both one-time and subscription)
 */
export const purchaseItem = async (productId: string): Promise<any | null> => {
  if (!iapAvailable) {
    console.error("[IAP-ERROR] IAP not available - purchase cannot be completed");
    console.error("[IAP-ERROR] RNIap available:", !!RNIap);
    throw new Error("In-app purchases are not available on this device");
  }

  try {
    console.log("[IAP-INFO] =========================================");
    console.log("[IAP-INFO] Initiating purchase for product:", productId);
    console.log("[IAP-INFO] Platform:", Platform.OS);
    console.log("[IAP-INFO] Product ID from config:", productId);
    console.log("[IAP-INFO] Expected product IDs:", PRODUCT_IDS.android);

    // Determine purchase type
    const isMonthly = productId.includes('monthly');
    const isSubscription = isMonthly; // Only monthly is subscription

    let purchase;

    if (isSubscription) {
      if (Platform.OS === "android") {
        console.log("[IAP-INFO] Fetching fresh subscriptions for purchase...");
        console.log("[IAP-INFO] Requesting subscriptions with SKU:", productId);

        let subs: any[] = [];
        try {
          subs = await fetchProductsCompat([productId], "subs");
          console.log("[IAP-INFO] Raw subscription response:", JSON.stringify(subs, null, 2));

          if (!subs || subs.length === 0) {
            console.error("[IAP-ERROR] No subscriptions returned from Play Store");
            throw new Error("Subscription not available. Please check your internet connection and try again.");
          }
        } catch (fetchError) {
          console.error("[IAP-ERROR] Failed to fetch subscriptions:", fetchError);
          throw new Error("Unable to fetch subscription details. Please try again.");
        }

        let offerToken = null;
        const subscription = subs.find((s: any) =>
          s.productId === productId ||
          s.id === productId ||
          s.productIds?.includes(productId)
        ) || subs[0];

        if (subscription) {
          if (subscription.subscriptionOfferDetails?.length > 0) {
            offerToken = subscription.subscriptionOfferDetails[0].offerToken;
          } else if (subscription.offerDetails?.length > 0) {
            offerToken = subscription.offerDetails[0].offerToken;
          } else if (subscription.subscriptionOffers?.length > 0) {
            offerToken = subscription.subscriptionOffers[0].offerToken;
          }
        }

        const requestPayload: any = {
          request: {
            android: {
              skus: [productId],
              ...(offerToken ? { subscriptionOffers: [{ sku: productId, offerToken }] } : {}),
            },
          },
          type: "subs",
        };

        console.log("[IAP-INFO] Purchase params:", JSON.stringify(requestPayload, null, 2));
        try {
          purchase = await RNIap.requestPurchase(requestPayload);
          console.log("[IAP-SUCCESS] Subscription request successful:", JSON.stringify(purchase, null, 2));
        } catch (purchaseError: any) {
          console.error("[IAP-ERROR] Subscription request failed:");
          console.error("[IAP-ERROR] Error details:", JSON.stringify(purchaseError, null, 2));
          throw purchaseError;
        }
      } else {
        purchase = await RNIap.requestPurchase({
          request: {
            ios: { sku: productId },
          },
          type: "subs",
        });
      }
    } else {
      purchase = await RNIap.requestPurchase({
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: "in-app",
      });
    }

    console.log(`${isSubscription ? 'Subscription' : 'One-time purchase'} initiated:`, purchase);

    // Wait for purchase verification to complete (handlePurchaseUpdate will resolve this)
    return new Promise((resolve, reject) => {
      pendingPurchaseResolver = resolve;
      pendingPurchaseRejecter = reject;

      // Timeout after 30 seconds in case verification never completes
      setTimeout(() => {
        if (pendingPurchaseRejecter) {
          pendingPurchaseRejecter(new Error("Purchase verification timeout"));
          pendingPurchaseResolver = null;
          pendingPurchaseRejecter = null;
        }
      }, 30000);
    });
  } catch (error: any) {
    console.error('[IAP-ERROR] =========================================');
    console.error('[IAP-ERROR] Purchase failed for product:', productId);
    console.error('[IAP-ERROR] Full error object:', JSON.stringify(error, null, 2));
    console.error('[IAP-ERROR] Error code:', (error as any)?.code);
    console.error('[IAP-ERROR] Error message:', (error as any)?.message);
    console.error('[IAP-ERROR] Error responseCode:', (error as any)?.responseCode);
    console.error('[IAP-ERROR] Error platform:', (error as any)?.platform);
    console.error('[IAP-ERROR] Error productId:', (error as any)?.productId);

    if (error?.code === "E_USER_CANCELLED") {
      console.log('[IAP-INFO] User cancelled the purchase');
      throw new Error("Purchase was cancelled");
    } else if (error?.message?.includes("Failed to query product")) {
      console.error('[IAP-ERROR] Product query failed during purchase:', error);
      console.error('[IAP-ERROR] This usually means:');
      console.error('[IAP-ERROR] 1. App not uploaded to Play Console');
      console.error('[IAP-ERROR] 2. Wrong product ID in code vs Play Console');
      console.error('[IAP-ERROR] 3. No license testers configured');
      throw new Error("Unable to connect to payment service. Please check your internet connection and try again.");
    } else if (error?.message?.includes("Missing purchase request configuration")) {
      console.error('[IAP-ERROR] Missing purchase request configuration - this is a v14 API issue');
      console.error('[IAP-ERROR] Usually means:');
      console.error('[IAP-ERROR] 1. No base plan configured in Play Console');
      console.error('[IAP-ERROR] 2. No offers for the base plan');
      console.error('[IAP-ERROR] 3. Incorrect subscriptionOffers format');
      throw new Error("Purchase failed: Subscription not properly configured in Play Console");
    } else {
      console.error('[IAP-ERROR] Unknown purchase error:', error);
      throw new Error("Purchase failed: " + (error?.message || "Unknown error"));
    }
  }
};

/**
 * Set up listener for purchase updates
 */
const setupPurchaseListener = () => {
  if (!iapAvailable || !RNIap) {
    return;
  }

  try {
    purchaseListener = RNIap.purchaseUpdatedListener((purchase: any) => {
      handlePurchaseUpdate(purchase);
    });

    purchaseErrorListener = RNIap.purchaseErrorListener((error: any) => {
      console.error("Purchase error received:", error);
    });
  } catch (error) {
    console.error("Error setting up purchase listener:", error);
  }
};

/**
 * Handle purchase updates
 */
const handlePurchaseUpdate = async (purchase: any) => {
  if (!iapAvailable) {
    return;
  }

  try {
    console.log("Purchase update received:", purchase);

    // For iOS: transactionId exists
    // For Android: orderId exists and needs acknowledgement
    const isValidPurchase =
      (purchase as any).transactionId ||
      ((purchase as any).orderId &&
        (purchase as any).purchaseState !== "cancelled");

    if (isValidPurchase) {
      // Verify receipt with backend
      await verifyPurchase(purchase);

      // Finish the transaction for both platforms
      try {
        const isConsumable = purchase.productId.includes('daily'); // Daily pass is consumable
        // v14+ API: finishTransaction(purchase, isConsumable, developerPayloadAndroid)
        await RNIap.finishTransaction({ purchase, isConsumable });
      } catch (err) {
        console.warn("Error finishing transaction:", err);
      }

      // Resolve the pending purchase promise
      if (pendingPurchaseResolver) {
        pendingPurchaseResolver(purchase);
        pendingPurchaseResolver = null;
        pendingPurchaseRejecter = null;
      }
    }
  } catch (error) {
    console.error("Error handling purchase update:", error);
    // Reject the pending purchase promise on error
    if (pendingPurchaseRejecter) {
      pendingPurchaseRejecter(error);
      pendingPurchaseResolver = null;
      pendingPurchaseRejecter = null;
    }
  }
};

/**
 * Verify purchase with backend
 */
const verifyPurchase = async (purchase: any) => {
  if (!iapAvailable) {
    return;
  }

  try {
    console.log("Verifying purchase:", purchase.productId);

    // Prepare receipt data with base64 encoding for security
    let receiptData: any = {};

    if (Platform.OS === "ios") {
      // For iOS, the transactionReceipt is already base64 encoded
      receiptData = {
        transactionId: purchase.transactionId,
        receipt: (purchase as any).transactionReceipt || purchase.transactionId,
        productId: purchase.productId,
        isIOS: true,
        isAndroid: false,
      };
    } else {
      // For Android, base64 encode the originalJson for security
      const originalJson = (purchase as any).originalJson;
      const base64Receipt = btoa(unescape(encodeURIComponent(originalJson)));

      receiptData = {
        originalJson: base64Receipt, // Base64 encoded
        signature: (purchase as any).signature,
        purchaseToken: purchase.purchaseToken || (purchase as any).token,
        productId: purchase.productId,
        isIOS: false,
        isAndroid: true,
      };
    }

    // Call backend to verify receipt and fail explicitly if the backend rejects the receipt.
    const verificationResult = await verifyIapReceipt(
      JSON.stringify(receiptData),
      purchase.productId,
    );

    if (!verificationResult.success) {
      const message =
        verificationResult.message || "Purchase verification failed on the backend";
      console.error("[IAP-ERROR] Purchase verification rejected by backend:", message);
      throw new Error(message);
    }

    console.log("Purchase verified successfully");
  } catch (error) {
    console.error("Error verifying purchase:", error);
    throw error;
  }
};

/**
 * Handle purchases from previous app sessions
 */
const handlePendingPurchases = async () => {
  if (!iapAvailable) {
    return;
  }

  try {
    console.log("Checking for pending purchases...");

    const purchases = await RNIap.getAvailablePurchases();
    for (const purchase of purchases) {
      console.log("Processing pending purchase:", purchase);
      await handlePurchaseUpdate(purchase);
    }
  } catch (error) {
    console.error("Error handling pending purchases:", error);
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  if (!iapAvailable) {
    console.warn("IAP not available on this device");
    throw new Error("In-app purchases are not available on this device");
  }

  try {
    console.log("Initiating restore purchases...");
    const purchases = await RNIap.getAvailablePurchases();
    console.log("Restored purchases count:", purchases?.length || 0);

    if (purchases && purchases.length > 0) {
      for (const purchase of purchases) {
        await handlePurchaseUpdate(purchase);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error restoring purchases:", error);
    throw error;
  }
};
