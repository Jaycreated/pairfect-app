# In-App Purchase (IAP) Implementation Guide

This guide covers the complete setup and implementation of in-app purchases for both iOS and Android platforms in the Pairfect app.

## Overview

The IAP implementation uses:

- **Library**: `react-native-iap` v14.7.0 (already in your dependencies)
- **Supported Plans**: Daily Access (24 hours) and Monthly Access (30 days)
- **Platforms**: iOS (App Store) and Android (Google Play Store)

## Files Modified/Created

### Core Services

- `services/iapService.ts` - Main IAP service with purchase handling
- `services/subscriptionService.ts` - Backend verification of receipts
- `hooks/useIAP.ts` - React hook for IAP initialization
- `app.json` - Configuration for Expo build

## Setup Instructions

### Step 1: iOS Configuration (App Store Connect)

1. **Create App Store Connect Account**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Create In-App Purchase Products**
   - Navigate to your app in App Store Connect
   - Go to **Subscriptions** section (not In-App Purchases)
   - Create two subscription products:

   **Product 1: Daily Access**
   - Product ID: `com.pairfect.daily`
   - Name: Daily Access
   - Reference Name: Daily Access
   - Subscription Duration: 1 day
   - Price: $0.99 (set your price tier)
   - Status: Ready to Submit
   - Billing Cycle: Every 1 day, then expires

   **Product 2: Monthly Access**
   - Product ID: `com.pairfect.monthly`
   - Name: Monthly Access
   - Reference Name: Monthly Access
   - Subscription Duration: 1 month
   - Price: $4.99 (set your price tier)
   - Status: Ready to Submit
   - Billing Cycle: Every 1 month, then expires

3. **Configure Billing Renewal Settings**
   - Enable billing retry (recommended)
   - Set grace period (e.g., 3 days)
   - Enable family sharing if desired

4. **Set Up Test Users**
   - Go to Users and Roles > Sandbox Testers
   - Create test accounts for testing purchases
   - Use these accounts on test devices

### Step 2: Android Configuration (Google Play Console)

1. **Create Google Play Developer Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create or select your project

2. **Create In-App Products**
   - Navigate to your app
   - Go to **Products** > **Subscriptions**
   - Create two subscription products:

   **Product 1: Daily Subscription**
   - Product ID: `com.pairfect.daily`
   - Title: Daily Access
   - Description: Access to all chat features for 24 hours
   - Price: Same as iOS tier
   - Billing Period: 1 day
   - Status: Active

   **Product 2: Monthly Subscription**
   - Product ID: `com.pairfect.monthly`
   - Title: Monthly Access
   - Description: Full access for 30 days
   - Price: Same as iOS tier
   - Billing Period: 30 days
   - Status: Active

3. **Configure Subscription Settings**
   - Enable free trial if desired
   - Set introductory pricing (optional)
   - Configure billing cycle and renewal

4. **Set Up Test Accounts**
   - Go to Settings > License Testing
   - Add test Google accounts
   - These accounts can make free test purchases

### Step 3: Backend Integration

Your backend needs to implement receipt verification at the endpoint: `api/payments/verify-iap`

#### iOS Receipt Verification

```typescript
// Backend implementation example
POST /api/payments/verify-iap
Headers: Authorization: Bearer {token}

Request Body:
{
  receipt: {
    transactionId: string,
    receipt: string,
    productId: string,
    isIOS: true,
    isAndroid: false
  },
  productId: string,
  platform: "ios"
}

Response:
{
  success: boolean,
  subscription: {
    id: string,
    userId: string,
    planId: string,
    status: 'active' | 'expired' | 'cancelled',
    startDate: string,
    endDate: string,
    paymentReference: string,
    amount: number,
    currency: string
  },
  message?: string
}
```

**iOS Verification Process:**

1. Extract the receipt from `transactionReceipt` field
2. Send to Apple's verification endpoint: `https://buy.itunes.apple.com/verifyReceipt` (production) or `https://sandbox.itunes.apple.com/verifyReceipt` (sandbox)
3. Validate signature and expiration date
4. Create/update subscription in database
5. Return subscription details to client

#### Android Receipt Verification

```typescript
// Backend implementation example
Request Body:
{
  receipt: {
    originalJson: string,
    signature: string,
    productId: string,
    purchaseToken: string,
    isIOS: false,
    isAndroid: true
  },
  productId: string,
  platform: "android"
}
```

**Android Verification Process:**

1. Use Google Play Billing Library to verify the purchase
2. Call Google Play API with `purchaseToken`
3. Validate the purchase state and expiration
4. Create/update subscription in database
5. Return subscription details to client

**Recommended Backend Libraries:**

- iOS: `node-app-store-connect` or manual HTTP requests to Apple APIs
- Android: `@google-cloud/recaptcha-enterprise` or Google Play Developer API

### Step 4: Implementation in App

1. **Initialize IAP in Root Layout** (`app/_layout.tsx`)

   ```typescript
   import { useIAP } from "@/hooks/useIAP";

   function RootLayout() {
     useIAP(); // Initialize IAP on app start
     // ... rest of layout
   }
   ```

2. **Purchase Flow in UI Component**

   ```typescript
   import { purchaseItem, getAvailableProducts } from '@/services/iapService';
   import { useSubscription } from '@/context/SubscriptionContext';

   export function SubscriptionComponent() {
     const { refreshSubscription } = useSubscription();

     const handlePurchase = async (productId: string) => {
       try {
         await purchaseItem(productId);
         // Refresh subscription after successful purchase
         await refreshSubscription();
       } catch (error) {
         console.error('Purchase failed:', error);
       }
     };

     return (
       <Button
         onPress={() => handlePurchase('com.pairfect.monthly')}
       >
         Subscribe
       </Button>
     );
   }
   ```

3. **Check Subscription Status**

   ```typescript
   import { useSubscription } from '@/context/SubscriptionContext';

   export function ChatScreen() {
     const { subscription, isLoading } = useSubscription();

     if (!subscription) {
       return <Text>Please subscribe to access chat</Text>;
     }

     return <ChatUI />;
   }
   ```

### Step 5: Testing

#### iOS Testing

1. Create sandbox test account in App Store Connect
2. Sign out of your personal Apple ID on test device
3. Install your debug build from Xcode
4. Attempt purchase with sandbox test account
5. Confirm receipt verification works

#### Android Testing

1. Add test Google Account to License Testing
2. Install your debug build from Android Studio
3. Attempt purchase with test account
4. Confirm receipt verification works

**Test Purchases:**

- Sandbox purchases should NOT charge the test account
- Enable logging in `iapService.ts` to debug
- Use console.log statements to track purchase flow

### Step 6: Production Deployment

1. **iOS:**
   - Complete app review for in-app purchases
   - Update product IDs in your code to match App Store Connect
   - Test with production receipts before release

2. **Android:**
   - Test with internal testing track first
   - Roll out to 1-5% of users initially
   - Monitor for issues before full release

## Important Notes

### Product IDs

- Must exactly match App Store Connect and Google Play Console
- Format: `com.pairfect.[planType]`
- iOS and Android can use the same product IDs

### Security Best Practices

1. **Never store raw receipts on client** - always verify on backend
2. **Validate expiration dates** - subscriptions expire and should be renewed
3. **Use HTTPS** - all communication with backend must be encrypted
4. **Secure storage** - store auth tokens in expo-secure-store
5. **Server verification** - never trust client-side subscription verification

### Common Issues

**"SKU not found" Error**

- Product ID doesn't match App Store Connect/Google Play Console
- Verify exact spelling and format

**Purchases Not Appearing**

- Test account not properly configured
- Not signed into sandbox/test account on device
- Product not "Ready to Submit" or "Active"

**Receipt Verification Failing**

- Backend endpoint not implemented correctly
- Wrong Apple verification URL (sandbox vs production)
- Invalid receipt format from client

## Subscription Context

The `SubscriptionContext` automatically:

1. Fetches active subscription on app load
2. Handles deep links for payment callbacks
3. Refreshes subscription after purchases
4. Provides `withSubscription` HOC for protected screens

## Support Resources

- [react-native-iap Documentation](https://github.com/dooboolab-community/react-native-iap)
- [Apple App Store Server API](https://developer.apple.com/app-store-server-api/)
- [Google Play Billing Library](https://developer.android.com/google/play/billing/integrate)
- [Expo Documentation](https://docs.expo.dev/)

## Next Steps

1. Create App Store and Google Play Developer accounts
2. Implement backend receipt verification endpoints
3. Set up test accounts on both platforms
4. Test purchase flow on iOS and Android devices
5. Submit for app review (including IAP review)
6. Monitor and handle subscription lifecycle events
