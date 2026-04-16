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

// Product IDs configuration
export const PRODUCT_IDS = {
  // iOS Product IDs (must match App Store Connect)
  ios: {
    daily: "com.anonymous.pairfect.daily",      // One-time purchase (24h access)
    monthly: "com.anonymous.pairfect.monthly",  // Subscription
  },
  // Android Product IDs (must match Google Play Console)
  android: {
    daily: "com.anonymous.pairfect.daily",      // One-time purchase (24h access)
    monthly: "com.anonymous.pairfect.monthly",  // Subscription
  },
};

// Purchase type mapping
export const PURCHASE_TYPES = {
  daily: 'one_time',    // One-time purchase
  monthly: 'subscription', // Auto-renewing subscription
};

// Get platform-specific product IDs
export const getPlatformProductIds = (): string[] => {
  const ids = Platform.OS === "ios" ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
  return Object.values(ids);
};

let purchaseListener: any = null;
let purchaseErrorListener: any = null;
let cachedSubscriptions: any[] = []; // Store subscriptions for offerToken access

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
    console.log("Attempting to fetch products with IDs:", productIds);
    
    // Separate daily (one-time) and monthly (subscription) products
    const dailyProductId = Platform.OS === "ios" ? PRODUCT_IDS.ios.daily : PRODUCT_IDS.android.daily;
    const monthlyProductId = Platform.OS === "ios" ? PRODUCT_IDS.ios.monthly : PRODUCT_IDS.android.monthly;
    
    // Fetch both types of products
    const [products, subscriptions] = await Promise.all([
      RNIap.getProducts({ skus: [dailyProductId] }), // One-time purchase
      RNIap.getSubscriptions({ skus: [monthlyProductId] }) // Subscription
    ]);
    
    // Cache subscriptions for offerToken access during purchase
    cachedSubscriptions = subscriptions || [];
    
    // Debug: Log subscription details to find offerToken
    if (cachedSubscriptions.length > 0) {
      console.log('SUBSCRIPTION DETAILS:', JSON.stringify(cachedSubscriptions, null, 2));
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
    console.warn("IAP not available - purchase cannot be completed");
    throw new Error("In-app purchases are not available on this device");
  }

  try {
    console.log("Initiating purchase for product:", productId);

    // Determine purchase type
    const isMonthly = productId.includes('monthly');
    const isSubscription = isMonthly; // Only monthly is subscription
    
    let purchase;
    
    if (isSubscription) {
      // Use requestSubscription for monthly subscription
      if (Platform.OS === "android") {
        // Android v14+ requires subscriptionOffers array with real offerToken
        
        // Fallback: fetch subscriptions if cache is empty
        if (cachedSubscriptions.length === 0) {
          console.log('Cache empty, fetching subscriptions...');
          const monthlyProductId = PRODUCT_IDS.android.monthly;
          const subs = await RNIap.getSubscriptions({ skus: [monthlyProductId] });
          cachedSubscriptions = subs || [];
          console.log('Fetched subscriptions:', JSON.stringify(cachedSubscriptions, null, 2));
        }
        
        // Find subscription by productId (try multiple property names)
        const subscription = cachedSubscriptions.find(s => 
          s.productId === productId || 
          s.id === productId ||
          s.productIds?.includes(productId)
        );
        
        // Try multiple paths for offerToken
        const offerToken = 
          subscription?.subscriptionOfferDetails?.[0]?.offerToken ||
          subscription?.offerDetails?.[0]?.offerToken ||
          subscription?.subscriptionOffers?.[0]?.offerToken;
        
        if (!offerToken) {
          console.error('No offerToken found for subscription:', productId);
          console.error('Subscription object:', JSON.stringify(subscription, null, 2));
          console.error('All cached subscriptions:', JSON.stringify(cachedSubscriptions, null, 2));
          throw new Error('Subscription offer not available. Please try again.');
        }
        
        console.log('Using offerToken:', offerToken);
        purchase = await RNIap.requestSubscription({
          sku: productId,
          subscriptionOffers: [{
            sku: productId,
            offerToken: offerToken,
          }]
        });
      } else {
        // iOS
        purchase = await RNIap.requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
        });
      }
    } else {
      // Use requestPurchase for one-time daily access
      purchase = await RNIap.requestPurchase({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
    }

    console.log(`${isSubscription ? 'Subscription' : 'One-time purchase'} initiated:`, purchase);
    return purchase || null;
  } catch (error: any) {
    if (error?.code === "E_USER_CANCELLED") {
      console.log("User cancelled the purchase");
      throw new Error("Purchase was cancelled");
    } else if (error?.message?.includes("Failed to query product")) {
      console.warn("Product query failed during purchase:", error);
      throw new Error("Unable to connect to payment service. Please check your internet connection and try again.");
    } else {
      console.error("Purchase error:", error);
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
        await RNIap.finishTransaction(purchase, isConsumable);
      } catch (err) {
        console.warn("Error finishing transaction:", err);
      }
    }
  } catch (error) {
    console.error("Error handling purchase update:", error);
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

    // Call backend to verify receipt
    await verifyIapReceipt(JSON.stringify(receiptData), purchase.productId);

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
