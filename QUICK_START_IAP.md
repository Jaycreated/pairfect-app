# Quick Start: In-App Purchases

Quick reference for getting IAP working in your Pairfect app.

## TL;DR

Your app has in-app purchases set up! Here's what to do next:

### 1. iOS Setup (10 minutes)

```
1. Go to https://appstoreconnect.apple.com
2. Create two subscription products:
   - Product ID: com.pairfect.daily (24 hours)
   - Product ID: com.pairfect.monthly (30 days)
3. Create sandbox test users
4. Done!
```

### 2. Android Setup (10 minutes)

```
1. Go to https://play.google.com/console
2. Create two subscription products:
   - Product ID: com.pairfect.daily (1 day)
   - Product ID: com.pairfect.monthly (1 month)
3. Add test accounts
4. Done!
```

### 3. Backend Setup (30 minutes)

```
Implement this endpoint:
POST /api/payments/verify-iap

See BACKEND_IAP_IMPLEMENTATION.md for code samples
```

### 4. Test (15 minutes)

```
1. Install app on iOS test device
2. Go to subscription screen
3. Tap subscribe button
4. Use sandbox test account
5. Verify subscription is active
6. Repeat for Android
```

### 5. Launch!

```
Submit app for review with IAP
Monitor production metrics
```

## Code Snippets

### Display Subscription Plans

```tsx
import { SubscriptionPlansComponent } from "@/components/SubscriptionUI";

export default function SubscribeScreen() {
  return <SubscriptionPlansComponent />;
}
```

### Check if User is Subscribed

```tsx
import { useSubscription } from "@/context/SubscriptionContext";

export function ChatScreen() {
  const { subscription } = useSubscription();

  if (!subscription) {
    return <RequireSubscription />;
  }

  return <Chat />;
}
```

### Get Available Products

```tsx
import { getAvailableProducts } from "@/services/iapService";

const products = await getAvailableProducts();
console.log(products);
```

### Initiate Purchase

```tsx
import { purchaseItem } from "@/services/iapService";

try {
  await purchaseItem("com.pairfect.monthly");
  // Purchase will be verified automatically
} catch (error) {
  console.error("Purchase failed:", error);
}
```

## Product IDs

```
Daily:   com.pairfect.daily   ($0.99)
Monthly: com.pairfect.monthly ($4.99)
```

## Files to Know

| File                              | Purpose              |
| --------------------------------- | -------------------- |
| `services/iapService.ts`          | Purchase handling    |
| `services/subscriptionService.ts` | Receipt verification |
| `hooks/useIAP.ts`                 | Initialization hook  |
| `components/SubscriptionUI.tsx`   | UI components        |
| `context/SubscriptionContext.tsx` | Subscription state   |

## Testing

### iOS

```
Device: Simulator or iPhone
Account: Sandbox test user (created in App Store Connect)
Cost: Free (doesn't charge)
```

### Android

```
Device: Emulator or Android phone
Account: Gmail test account (added to Play Console)
Cost: Free (doesn't charge)
```

## Common Errors & Fixes

| Error                         | Fix                                           |
| ----------------------------- | --------------------------------------------- |
| "SKU not found"               | Product ID doesn't match App Store/Play Store |
| "User not recognized"         | Test account not set up correctly             |
| "Receipt verification failed" | Backend endpoint not implemented              |
| "Product list empty"          | Give app time to load products                |

## Backend Endpoint

```typescript
POST /api/payments/verify-iap
Authorization: Bearer {token}
Content-Type: application/json

{
  "receipt": { ... },
  "productId": "com.pairfect.monthly",
  "platform": "ios" // or "android"
}

Response:
{
  "success": true,
  "subscription": { ... },
  "message": "Subscription activated"
}
```

See `BACKEND_IAP_IMPLEMENTATION.md` for full implementation.

## Implementation Checklist

### Before Testing

- [ ] App Store Connect account created
- [ ] Google Play Console account created
- [ ] Sandbox users created (iOS)
- [ ] Test accounts added (Android)
- [ ] Backend endpoint created
- [ ] App built and ready to test

### Testing

- [ ] iOS purchase works
- [ ] Android purchase works
- [ ] Subscription shows as active
- [ ] Backend logs show verification
- [ ] Renewal works (optional, takes time)

### Before Launch

- [ ] All tests pass
- [ ] No console errors
- [ ] Error handling works
- [ ] Backend deployed to production
- [ ] App ready for submission

## Full Guides

For detailed information, see:

- `IAP_SETUP_GUIDE.md` - Complete setup instructions
- `IAP_CHECKLIST.md` - Detailed testing checklist
- `BACKEND_IAP_IMPLEMENTATION.md` - Backend code samples
- `IAP_IMPLEMENTATION_SUMMARY.md` - Full overview

## Support

Questions? Check:

1. `IAP_SETUP_GUIDE.md` - Most common issues explained there
2. GitHub Issues: https://github.com/dooboolab-community/react-native-iap
3. Apple Dev: https://developer.apple.com/
4. Google Play: https://developer.android.com/

---

**Status**: ✅ Ready to configure and test
