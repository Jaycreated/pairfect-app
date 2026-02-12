let RNIap: any = null;
let iapAvailable = false;

// Try to import RNIap, but don't fail if it's not available
try {
  RNIap = require('react-native-iap');
  iapAvailable = true;
} catch (error) {
  console.warn('react-native-iap not available - IAP features will be disabled:', error);
  iapAvailable = false;
}

import { Platform } from 'react-native';
import { verifyIapReceipt } from './subscriptionService';

// Product IDs configuration
export const PRODUCT_IDS = {
  // iOS Product IDs (must match App Store Connect)
  ios: {
    daily: 'com.pairfect.daily',
    monthly: 'com.pairfect.monthly',
  },
  // Android Product IDs (must match Google Play Console)
  android: {
    daily: 'com.pairfect.daily',
    monthly: 'com.pairfect.monthly',
  },
};

// Get platform-specific product IDs
export const getPlatformProductIds = (): string[] => {
  const ids = Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
  return Object.values(ids);
};

let purchaseListener: any = null;
let purchaseErrorListener: any = null;

/**
 * Initialize IAP connection and set up purchase listener
 */
export const connectToIAP = async () => {
  if (!iapAvailable) {
    console.warn('IAP not available on this environment');
    return;
  }

  try {
    // Initialize RNIap connection
    await RNIap.initConnection();
    console.log('IAP Connection established');

    // Fetch available products
    await getAvailableProducts();

    // Set up purchase update listener
    setupPurchaseListener();

    // Handle purchases from previous app sessions
    await handlePendingPurchases();
  } catch (error) {
    console.error('Error connecting to IAP:', error);
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
    console.log('IAP Connection disconnected');
  } catch (error) {
    console.error('Error disconnecting from IAP:', error);
  }
};

/**
 * Get available products from App Store/Play Store
 */
export const getAvailableProducts = async (): Promise<any[]> => {
  if (!iapAvailable) {
    console.warn('IAP not available - returning empty products');
    return [];
  }

  try {
    const productIds = getPlatformProductIds();
    const products = await RNIap.fetchProducts({
      skus: productIds,
    });
    console.log('Available products:', products);
    return (products as any) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Purchase a product
 */
export const purchaseItem = async (productId: string): Promise<any | null> => {
  if (!iapAvailable) {
    console.warn('IAP not available - purchase cannot be completed');
    throw new Error('In-app purchases are not available on this device');
  }

  try {
    console.log('Initiating purchase for product:', productId);

    const purchase = await RNIap.requestPurchase({
      skus: [productId],
    } as any);

    console.log('Purchase initiated:', purchase);
    return (purchase as any) || null;
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED') {
      console.log('User cancelled the purchase');
    } else {
      console.error('Purchase error:', error);
    }
    throw error;
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
    purchaseListener = RNIap.purchaseUpdatedListener(
      (purchase: any) => {
        handlePurchaseUpdate(purchase);
      }
    );

    purchaseErrorListener = RNIap.purchaseErrorListener(
      (error: any) => {
        console.error('Purchase error received:', error);
      }
    );
  } catch (error) {
    console.error('Error setting up purchase listener:', error);
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
    console.log('Purchase update received:', purchase);

    // For iOS: transactionId exists
    // For Android: orderId exists and needs acknowledgement
    const isValidPurchase =
      (purchase as any).transactionId ||
      ((purchase as any).orderId && (purchase as any).purchaseState !== 'cancelled');

    if (isValidPurchase) {
      // Verify receipt with backend
      await verifyPurchase(purchase);

      // Finish the transaction
      if (Platform.OS === 'android') {
        try {
          const token = (purchase as any).purchaseToken || (purchase as any).token;
          if (token) {
            await RNIap.acknowledgePurchaseAndroid(token);
          }
        } catch (err) {
          console.warn('Error acknowledging Android purchase:', err);
        }
      } else {
        try {
          await RNIap.finishTransaction({ purchase, isConsumable: false });
        } catch (err) {
          console.warn('Error finishing iOS transaction:', err);
        }
      }
    }
  } catch (error) {
    console.error('Error handling purchase update:', error);
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
    console.log('Verifying purchase:', purchase.productId);

    const receiptData = {
      transactionId: purchase.transactionId,
      receipt: (purchase as any).transactionReceipt || purchase.transactionId,
      originalJson: (purchase as any).originalJson,
      signature: (purchase as any).signature,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken || (purchase as any).token,
      isAndroid: Platform.OS === 'android',
      isIOS: Platform.OS === 'ios',
    };

    // Call backend to verify receipt
    await verifyIapReceipt(JSON.stringify(receiptData), purchase.productId);

    console.log('Purchase verified successfully');
  } catch (error) {
    console.error('Error verifying purchase:', error);
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
    console.log('Checking for pending purchases...');

    // In a real scenario, you'd check your backend for pending purchases
    // This is a placeholder for cleanup purposes
  } catch (error) {
    console.error('Error handling pending purchases:', error);
  }
};
