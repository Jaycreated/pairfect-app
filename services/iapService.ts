import { Linking, Platform } from 'react-native';
import { verifyIapReceipt, verifyPayment } from './subscriptionService';

// Product IDs must be registered in App Store Connect
export const IOS_PRODUCT_IDS = {
  daily: 'com.pairfect.daily',
  monthly: 'com.pairfect.monthly',
};

let iapModule: any = null;

export const connectToIAP = async () => {
  if (Platform.OS !== 'ios') return;
  try {
    const raw = await import('expo-in-app-purchases');
    iapModule = raw && raw.default ? raw.default : raw;

    if (!iapModule || typeof iapModule.connectAsync !== 'function') {
      console.warn('IAP module loaded but missing expected methods; skipping IAP setup');
      return;
    }

    await iapModule.connectAsync();

    // get available items
    if (typeof iapModule.getProductsAsync === 'function') {
      await iapModule.getProductsAsync(Object.values(IOS_PRODUCT_IDS));
    }

    // register listener
    const purchaseListener = async ({ responseCode, results, errorCode }: any) => {
      if (responseCode === iapModule.IAPResponseCode.OK) {
        if (!results || results.length === 0) return;

        for (const purchase of results) {
          if (!purchase) continue;
          if (!purchase.acknowledged) {
            try {
              const receipt = purchase.transactionReceipt || purchase.originalJson || purchase.orderId || purchase.productId;

              if (receipt) {
                await verifyIapReceipt(receipt, purchase.productId);
              } else {
                await verifyPayment(purchase.orderId || purchase.productId);
              }

              await iapModule.finishTransactionAsync(purchase, false);
            } catch (err) {
              console.error('IAP verification error:', err);
            }
          }
        }
      } else if (responseCode === iapModule.IAPResponseCode.USER_CANCELED) {
        console.log('User canceled IAP');
      } else {
        console.error('IAP error', responseCode, errorCode);
      }
    };

    if (typeof iapModule.setPurchaseListener === 'function') {
      iapModule.setPurchaseListener(purchaseListener);
    } else if (typeof iapModule.addPurchaseListener === 'function') {
      iapModule.addPurchaseListener(purchaseListener);
    } else {
      console.warn('IAP module has no purchase listener registration method');
    }
  } catch (error) {
    console.error('Error connecting to IAP:', error);
  }
};

export const disconnectIAP = async () => {
  try {
    if (iapModule) {
      try {
        await iapModule.disconnectAsync();
      } catch (err) {
        console.warn('Error disconnecting IAP module:', err);
      }
      iapModule = null;
    }
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
};

export const purchaseItem = async (productId: string) => {
  if (Platform.OS === 'android') {
    // On Android, redirect to website
    const url = 'https://pairfect.example.com/subscribe';
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening URL:', err);
      throw err;
    }
    return;
  }

  try {
    // dynamic import to avoid loading native module on web
    const raw = iapModule || (await import('expo-in-app-purchases'));
    const mod = raw && raw.default ? raw.default : raw;

    // Try common purchase method names
    const tryFns = [
      'purchaseItemAsync',
      'requestPurchaseAsync',
      'requestPurchase',
      'purchaseAsync',
      'buyItemAsync',
      'purchaseItem'
    ];

    let fn: any = null;
    for (const name of tryFns) {
      if (mod && typeof mod[name] === 'function') {
        fn = mod[name];
        break;
      }
    }

    if (!fn) {
      console.warn('No purchase function found on IAP module — falling back to web checkout');
      const url = 'https://pairfect.example.com/subscribe';
      try {
        await Linking.openURL(url);
        return { fallback: 'web' } as any;
      } catch (err) {
        console.error('Failed to open fallback URL for purchase:', err);
        throw new Error('No purchase function available and fallback failed');
      }
    }

    const purchaseRequest = await fn.call(mod, productId);
    return purchaseRequest;
  } catch (error) {
    console.error('purchaseItem error:', error);
    throw error;
  }
};
