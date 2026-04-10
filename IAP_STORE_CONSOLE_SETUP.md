# IAP Setup Guide for Store Consoles

This guide will help you set up In-App Purchases (IAP) for Pairfect in both Google Play Console (Android) and App Store Connect (iOS).

## Table of Contents
1. [Google Play Console Setup](#google-play-console-setup)
2. [App Store Connect Setup](#app-store-connect-setup)
3. [Product Configuration](#product-configuration)
4. [Testing Setup](#testing-setup)
5. [Troubleshooting](#troubleshooting)

---

## Google Play Console Setup

### Prerequisites
- Google Play Developer account ($25 one-time fee)
- App uploaded to Google Play Console (even as draft)
- Google Play Console access

### Step 1: Upload Your App
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing Pairfect app
3. Upload a signed APK/AAB for internal testing
4. Complete store listing (can be minimal for testing)

### Step 2: Set Up Billing
1. In your app dashboard, go to **Monetize** → **Monetization setup**
2. Complete the **Payments profile** setup
3. Add **Contact information** and **Tax information**
4. Wait for approval (usually 1-2 business days)

### Step 3: Create In-App Products
1. Go to **Monetize** → **Products** → **In-app products**
2. Click **Create product**
3. Configure each product:

#### Daily Subscription
- **Product ID**: `com.pairfect.daily`
- **Name**: Pairfect Daily
- **Description**: Daily subscription for unlimited messaging
- **Price**: Set your desired daily price
- **Billing period**: 1 day

#### Monthly Subscription
- **Product ID**: `com.pairfect.monthly`
- **Name**: Pairfect Monthly
- **Description**: Monthly subscription for unlimited messaging
- **Price**: Set your desired monthly price
- **Billing period**: 1 month

### Step 4: Activate Products
1. Set products to **Active**
2. Add them to your app's **in-app billing**
3. Save changes

---

## App Store Connect Setup

### Prerequisites
- Apple Developer account ($99/year)
- App Store Connect access
- Xcode with proper certificates

### Step 1: Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+**
3. Create new app for Pairfect
4. Fill in basic app information

### Step 2: Set Up In-App Purchases
1. In your app dashboard, go to **Features** → **In-App Purchases**
2. Click **+** to create new products

#### Auto-Renewable Subscriptions
Create two Auto-Renewable Subscriptions:

**Daily Subscription**
- **Product ID**: `com.pairfect.daily`
- **Reference Name**: Pairfect Daily
- **Subscription Duration**: 1 Day
- **Price**: Set your desired price
- **Localization**: Add description and display name

**Monthly Subscription**
- **Product ID**: `com.pairfect.monthly`
- **Reference Name**: Pairfect Monthly
- **Subscription Duration**: 1 Month
- **Price**: Set your desired price
- **Localization**: Add description and display name

### Step 3: Configure Subscription Groups
1. Create a subscription group (e.g., "Pairfect Premium")
2. Add both subscriptions to this group
3. Set the order (typically monthly first, then daily)

### Step 4: Submit for Review
1. Add all necessary metadata and screenshots
2. Submit subscriptions for review
3. Wait for Apple approval (usually 24-48 hours)

---

## Product Configuration Details

### Android Product IDs
```javascript
// These must match exactly in Google Play Console
export const PRODUCT_IDS = {
  android: {
    daily: "com.pairfect.daily",
    monthly: "com.pairfect.monthly",
  },
  ios: {
    daily: "com.pairfect.daily", 
    monthly: "com.pairfect.monthly",
  },
};
```

### iOS Product IDs
```javascript
// These must match exactly in App Store Connect
// Same IDs as Android for consistency
```

### Important Notes
- Product IDs are **case-sensitive**
- No spaces or special characters (except dots)
- Must match exactly between code and store console
- Once created, product IDs cannot be changed

---

## Testing Setup

### Android Testing
1. **Create Test Accounts**:
   - Go to Google Play Console → **Setup** → **License testing**
   - Add Gmail addresses as test accounts
   - Set test response (usually "RESPOND_NORMALLY")

2. **Upload Signed Build**:
   - Build your app with release keystore
   - Upload to internal testing track
   - Wait for processing (usually 15-30 minutes)

3. **Test Purchase Flow**:
   - Install from Play Store (internal testing)
   - Use test account to purchase
   - Verify purchase flow works

### iOS Testing
1. **Create Sandbox Testers**:
   - Go to App Store Connect → **Users and Access** → **Sandbox**
   - Add test accounts with Apple IDs
   - Note: Use different Apple ID than your main developer account

2. **Build with Development Certificates**:
   - Use Xcode to build with development provisioning
   - Install on physical device (simulator doesn't support IAP)
   - Sign in with sandbox tester account in Settings → App Store

3. **Test Purchase Flow**:
   - Run app on device
   - Attempt purchase with sandbox account
   - Verify purchase flow works

---

## Troubleshooting

### Common Issues

#### "Failed to query product" Error
**Causes:**
- App not uploaded to store console
- Product IDs don't match
- Products not activated
- Wrong build type (debug vs release)

**Solutions:**
1. Verify app is uploaded to Play Store/App Store
2. Double-check product IDs match exactly
3. Ensure products are active, not draft
4. Use release build for Android testing

#### "Purchase not available" Error
**Causes:**
- IAP not enabled in app
- Billing profile not complete
- App not published to testing track

**Solutions:**
1. Complete payments profile setup
2. Enable IAP in app settings
3. Publish to internal/alpha testing track

#### "Verification failed" Error
**Causes:**
- Backend verification not configured
- Receipt format issues
- Network connectivity problems

**Solutions:**
1. Check backend verification endpoint
2. Verify receipt data format
3. Test network connectivity

### Debugging Tips

#### Android
```bash
# Check Play Console status
# Look at product status in dashboard
# Verify test accounts are properly configured
```

#### iOS
```bash
# Check sandbox account status
# Verify device is signed into sandbox account
# Use Xcode console to debug purchase flow
```

### Verification Checklist

Before testing, ensure:

**Android:**
- [ ] App uploaded to Play Console
- [ ] Products created with correct IDs
- [ ] Products set to Active
- [ ] Test accounts added
- [ ] Release build installed
- [ ] Billing profile complete

**iOS:**
- [ ] App created in App Store Connect
- [ ] Subscriptions created with correct IDs
- [ ] Sandbox test accounts created
- [ ] Development build on physical device
- [ ] Signed into sandbox account

---

## Next Steps

Once you complete the setup:

1. **Test thoroughly** with sandbox/test accounts
2. **Verify receipt verification** works with your backend
3. **Monitor purchases** in store consoles
4. **Set up analytics** for purchase tracking
5. **Prepare customer support** for purchase issues

### Support Resources

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [App Store In-App Purchase Documentation](https://developer.apple.com/app-store/in-app-purchases/)
- [React Native IAP Documentation](https://react-native-iap.dooboolab.com/)

---

## Quick Reference

### Product IDs (Both Platforms)
```
com.pairfect.daily    - Daily subscription
com.pairfect.monthly  - Monthly subscription
```

### Code Configuration
```javascript
// Already configured in your app
const productIds = Platform.OS === "ios" 
  ? ["com.pairfect.daily", "com.pairfect.monthly"]
  : ["com.pairfect.daily", "com.pairfect.monthly"];
```

### Testing URLs
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

---

**Need Help?** If you encounter any issues during setup, check the troubleshooting section above or refer to the official documentation links provided.
