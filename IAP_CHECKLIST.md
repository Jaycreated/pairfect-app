# In-App Purchase Implementation Checklist

Use this checklist to ensure your IAP implementation is complete and ready for testing.

## Code Implementation ✅

- [x] `services/iapService.ts` - Main IAP service
  - [x] `connectToIAP()` - Initialize connection
  - [x] `disconnectIAP()` - Clean up
  - [x] `getAvailableProducts()` - Fetch products
  - [x] `purchaseItem()` - Initiate purchase
  - [x] Purchase listener setup
  - [x] Receipt verification flow

- [x] `services/subscriptionService.ts` - Backend communication
  - [x] `verifyIapReceipt()` - Verify receipts
  - [x] Support for iOS and Android receipts

- [x] `hooks/useIAP.ts` - React hook
  - [x] Automatic initialization
  - [x] Cleanup handling

- [x] `app/_layout.tsx` - App initialization
  - [x] Import `useIAP` hook
  - [x] Call `useIAP()` in AuthLayout

- [x] `context/SubscriptionContext.tsx` - Subscription state
  - [x] Fetches active subscription
  - [x] Handles deep link callbacks

- [x] `components/SubscriptionUI.tsx` - UI components
  - [x] `SubscriptionPlansComponent` - Display plans
  - [x] `SubscribeButton` - Purchase button

## iOS Setup

### App Store Connect Configuration

- [ ] Create Apple Developer account
- [ ] Create iOS app in App Store Connect
- [ ] Create app-specific password for API access
- [ ] Create `com.pairfect.daily` subscription product
  - [ ] Set daily duration (1 day)
  - [ ] Set price tier
  - [ ] Add description and localization
  - [ ] Mark as "Ready to Submit"
- [ ] Create `com.pairfect.monthly` subscription product
  - [ ] Set monthly duration (1 month)
  - [ ] Set price tier
  - [ ] Add description and localization
  - [ ] Mark as "Ready to Submit"
- [ ] Configure billing renewal settings
- [ ] Create sandbox test users (at least 2)

### Xcode Configuration

- [ ] Set bundle identifier to `com.anonymous.Pairfect`
- [ ] Update version number in Xcode
- [ ] Add signing team
- [ ] Enable In-App Purchase capability
- [ ] Build and test on simulator/device

### Testing

- [ ] Test with sandbox account on simulator
- [ ] Test with sandbox account on physical device
- [ ] Verify receipt verification works
- [ ] Verify subscription shows as active
- [ ] Test subscription renewal flow
- [ ] Test cancellation flow

## Android Setup

### Google Play Console Configuration

- [ ] Create Google Play Developer account
- [ ] Create Android app in Google Play Console
- [ ] Set package name to `com.anonymous.Pairfect`
- [ ] Upload app signing key
- [ ] Create `com.pairfect.daily` subscription product
  - [ ] Set daily billing cycle (1 day)
  - [ ] Set price tier
  - [ ] Add description
  - [ ] Mark as "Active"
- [ ] Create `com.pairfect.monthly` subscription product
  - [ ] Set monthly billing cycle (1 month)
  - [ ] Set price tier
  - [ ] Add description
  - [ ] Mark as "Active"
- [ ] Configure billing settings
- [ ] Add test Google accounts (at least 2)
- [ ] Add test devices if needed

### Android Studio Configuration

- [ ] Update `app.json` with package name
- [ ] Ensure `react-native-iap` is properly installed
- [ ] Test on Android emulator
- [ ] Test on physical Android device with Play Services

### Testing

- [ ] Test with test account on emulator
- [ ] Test with test account on physical device
- [ ] Verify receipt verification works
- [ ] Verify subscription shows as active
- [ ] Test subscription renewal flow
- [ ] Test cancellation flow

## Backend Setup

### API Endpoints

- [ ] Create `/api/payments/verify-iap` endpoint
- [ ] Implement iOS receipt verification
  - [ ] Call Apple verification endpoint
  - [ ] Validate receipt signature
  - [ ] Check expiration date
  - [ ] Create/update subscription in database
- [ ] Implement Android receipt verification
  - [ ] Validate with Google Play API
  - [ ] Check purchase state
  - [ ] Create/update subscription in database
- [ ] Return proper error responses

### Database Updates

- [ ] Add `iap_receipt_id` field to subscriptions table
- [ ] Add `iap_platform` field (ios/android)
- [ ] Add `auto_renewal_status` field
- [ ] Add `original_transaction_id` field (iOS)
- [ ] Add `purchase_token` field (Android)

### Security Checklist

- [ ] Use HTTPS for all API calls
- [ ] Validate auth token on verification endpoint
- [ ] Store app-specific API credentials securely
- [ ] Don't expose secret keys in client code
- [ ] Log verification attempts for debugging
- [ ] Implement rate limiting on verification endpoint

## Testing Plan

### iOS Testing

- [ ] [ ] Create sandbox test account
- [ ] [ ] Sign out of personal Apple ID on test device
- [ ] [ ] Install debug build from Xcode
- [ ] [ ] Navigate to subscription screen
- [ ] [ ] Tap subscribe button
- [ ] [ ] Select test account
- [ ] [ ] Complete "purchase" (no charge)
- [ ] [ ] Verify subscription is activated
- [ ] [ ] Check backend logs for receipt verification
- [ ] [ ] Test cancellation
- [ ] [ ] Test renewing expired subscription

### Android Testing

- [ ] [ ] Create test Google account
- [ ] [ ] Add to License Testing in Play Console
- [ ] [ ] Install debug build from Android Studio
- [ ] [ ] Install Google Play Services on device/emulator
- [ ] [ ] Navigate to subscription screen
- [ ] [ ] Tap subscribe button
- [ ] [ ] Select test account
- [ ] [ ] Complete "purchase" (no charge)
- [ ] [ ] Verify subscription is activated
- [ ] [ ] Check backend logs for receipt verification
- [ ] [ ] Test cancellation
- [ ] [ ] Test renewing expired subscription

### Cross-Platform Testing

- [ ] [ ] Subscribe on iOS, verify on Android (won't work - different platforms)
- [ ] [ ] Subscribe on Android, verify on iOS (won't work - different platforms)
- [ ] [ ] Kill app during purchase and restart (should retry)
- [ ] [ ] Test with poor network connection
- [ ] [ ] Test with no network connection
- [ ] [ ] Test app background/foreground transitions

## Production Deployment

### Pre-Release Checklist

- [ ] All tests pass
- [ ] No console errors in logs
- [ ] Receipt verification working on both platforms
- [ ] Subscription expiration logic tested
- [ ] Auto-renewal working (or manual renewal if not supported)
- [ ] Error handling for edge cases
- [ ] Monitor app performance
- [ ] Test in production certificate environment

### iOS Submission

- [ ] [ ] Complete app review with IAP mention
- [ ] [ ] Submit IAP products for review (usually automatic)
- [ ] [ ] Test with production receipts
- [ ] [ ] Verify App Store certificates are valid
- [ ] [ ] Set up App Store Server Notifications (for subscription events)
- [ ] [ ] Release app to 1% of users first

### Android Release

- [ ] [ ] Test in internal testing track
- [ ] [ ] Monitor for crashes/errors
- [ ] [ ] Release to closed beta (1-5% of users)
- [ ] [ ] Monitor for issues
- [ ] [ ] Gradually roll out to 100%
- [ ] [ ] Monitor production metrics

## Documentation & Support

- [ ] Document product IDs in team wiki/docs
- [ ] Document test account credentials (securely)
- [ ] Document backend endpoint implementation details
- [ ] Create runbook for common issues
- [ ] Document refund/cancellation procedures
- [ ] Set up monitoring/alerts for IAP failures

## Common Issues to Handle

### During Development

- [ ] Product IDs don't match (check App Store Connect/Play Console)
- [ ] Receipt verification fails (check backend implementation)
- [ ] App crashes on purchase (check error handling)
- [ ] Subscription doesn't show as active (check subscription context)

### During Testing

- [ ] "SKU not found" error → Wrong product ID
- [ ] "Invalid token" → Test account not configured
- [ ] Receipt verification returning 404 → Wrong backend endpoint
- [ ] Subscription not persisting → Check database/backend

### Production Issues

- [ ] Users complaining about duplicate charges → Check renewal logic
- [ ] Receipts failing verification → Check Apple/Google API keys
- [ ] App crashing on older devices → Check minimum OS version
- [ ] Missing subscriptions in backend → Check webhook implementations

## Next Steps After Implementation

1. [ ] Monitor production IAP metrics
2. [ ] Track subscription conversion rates
3. [ ] Monitor cancellation reasons
4. [ ] Implement analytics for IAP funnel
5. [ ] Consider implementing:
   - [ ] Free trial period
   - [ ] Introductory pricing
   - [ ] Family sharing
   - [ ] Subscription retention strategies

## Resources

- [react-native-iap GitHub](https://github.com/dooboolab-community/react-native-iap)
- [Apple App Store Server API](https://developer.apple.com/app-store-server-api/)
- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [Expo Documentation](https://docs.expo.dev/)

---

**Notes:**

- Product IDs: `com.pairfect.daily` and `com.pairfect.monthly`
- Bundle ID: `com.anonymous.Pairfect`
- Backend endpoint: `/api/payments/verify-iap`
- Receipt verification must happen on backend (never trust client)
