# In-App Purchase Backend Implementation Guide

This guide covers implementing the backend endpoints needed to verify IAP receipts from iOS and Android.

## Required Endpoint

```
POST /api/payments/verify-iap
Headers: Authorization: Bearer {auth_token}
Content-Type: application/json
```

## Request Format

### iOS Request Example

```json
{
  "receipt": {
    "transactionId": "1000000123456789",
    "receipt": "MIIFpgYJKoZIhvcNAQcCoIIFmDCCBZQC...",
    "productId": "com.pairfect.monthly",
    "isIOS": true,
    "isAndroid": false
  },
  "productId": "com.pairfect.monthly",
  "platform": "ios"
}
```

### Android Request Example

```json
{
  "receipt": {
    "originalJson": "{\"packageName\":\"com.anonymous.Pairfect\",\"productId\":\"com.pairfect.monthly\",...}",
    "signature": "MEUCIQDxLjCyQkJI...",
    "productId": "com.pairfect.monthly",
    "purchaseToken": "glkadfjsd...",
    "isIOS": false,
    "isAndroid": true
  },
  "productId": "com.pairfect.monthly",
  "platform": "android"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "subscription": {
    "id": "sub_123456789",
    "userId": "user_123",
    "planId": "monthly",
    "status": "active",
    "startDate": "2024-01-21T00:00:00Z",
    "endDate": "2024-02-21T00:00:00Z",
    "paymentReference": "purchase_token_or_transaction_id",
    "amount": 499,
    "currency": "USD"
  },
  "message": "Subscription activated successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid receipt: receipt has expired"
}
```

## iOS Implementation

### Using App Store Server API (Recommended)

```typescript
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";

interface AppleReceiptData {
  transactionId: string;
  receipt: string;
  productId: string;
}

interface AppleJWT {
  iss: string; // Team ID
  iat: number;
  exp: number;
  aud: string;
  nonce: string;
  bid: string; // Bundle ID
}

class AppleIAPVerifier {
  private privateKey: string;
  private keyId: string;
  private issuerId: string;
  private bundleId: string;

  constructor(
    privateKey: string,
    keyId: string,
    issuerId: string,
    bundleId: string,
  ) {
    this.privateKey = privateKey;
    this.keyId = keyId;
    this.issuerId = issuerId;
    this.bundleId = bundleId;
  }

  private createJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: AppleJWT = {
      iss: this.issuerId,
      iat: now,
      exp: now + 3600,
      aud: "appstoreconnect-v1",
      nonce: crypto.randomUUID(),
      bid: this.bundleId,
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: "ES256",
      header: {
        kid: this.keyId,
      },
    });
  }

  async verifyReceipt(receiptData: AppleReceiptData) {
    try {
      const token = this.createJWT();

      // For newer receipts (iOS 13.5+), use App Store Server API
      const response = await axios.post(
        `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${receiptData.transactionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const transaction = response.data.data;

      return {
        isValid: true,
        productId: transaction.productId,
        transactionId: transaction.transactionId,
        originalTransactionId: transaction.originalTransactionId,
        purchaseDate: new Date(transaction.purchaseDate),
        expiresDate: new Date(transaction.expiresDate),
        isRenewable: transaction.isUpgraded === false,
        environment: transaction.environment, // 'Sandbox' or 'Production'
      };
    } catch (error) {
      console.error("Apple receipt verification failed:", error);
      throw new Error("Invalid Apple receipt");
    }
  }
}

// Alternative: For older receipts, use legacy verification
async function legacyAppleVerification(receiptData: string) {
  const isSandbox = process.env.NODE_ENV === "development";
  const url = isSandbox
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

  try {
    const response = await axios.post(url, {
      "receipt-data": receiptData,
      password: process.env.APPLE_SHARED_SECRET,
    });

    if (response.data.status !== 0) {
      throw new Error(
        `Apple verification failed with status ${response.data.status}`,
      );
    }

    const receipt = response.data.receipt;
    const latestReceipt = response.data["latest_receipt_info"]?.[0] || receipt;

    return {
      isValid: true,
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      originalTransactionId: latestReceipt.original_transaction_id,
      purchaseDate: new Date(parseInt(latestReceipt.purchase_date_ms)),
      expiresDate: new Date(parseInt(latestReceipt.expires_date_ms)),
      isRenewable: latestReceipt.is_trial_period === "false",
    };
  } catch (error) {
    console.error("Legacy Apple verification failed:", error);
    throw new Error("Invalid Apple receipt");
  }
}
```

### Environment Variables Required

```
APPLE_KEY_ID=ABC123DEFG
APPLE_ISSUER_ID=12345678-1234-1234-1234-123456789012
APPLE_BUNDLE_ID=com.anonymous.Pairfect
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_SHARED_SECRET=abcd1234efgh5678ijkl9012mnop3456  # For legacy verification
```

## Android Implementation

### Using Google Play Billing Library

```typescript
import { google } from "googleapis";
import jwt from "jsonwebtoken";

interface AndroidReceiptData {
  originalJson: string;
  signature: string;
  purchaseToken: string;
  productId: string;
}

class GooglePlayIAPVerifier {
  private androidPublisherService: any;
  private packageName: string;

  constructor(credentialsPath: string, packageName: string) {
    this.packageName = packageName;
    const credentials = require(credentialsPath);

    this.androidPublisherService = google.androidpublisher({
      version: "v3",
      auth: new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      }),
    });
  }

  async verifySubscription(receiptData: AndroidReceiptData): Promise<{
    isValid: boolean;
    productId: string;
    purchaseState: number;
    purchaseDate: Date;
    expiryDate: Date;
    autoRenewing: boolean;
  }> {
    try {
      const response =
        await this.androidPublisherService.monetization.subscriptions.userSubscriptions.get(
          {
            packageName: this.packageName,
            subscriptionId: receiptData.productId,
            token: receiptData.purchaseToken,
          },
        );

      const subscription = response.data;

      // Verify signature
      const publicKey = await this.getPublicKey();
      const isSignatureValid = this.verifySignature(
        receiptData.originalJson,
        receiptData.signature,
        publicKey,
      );

      if (!isSignatureValid) {
        throw new Error("Invalid signature");
      }

      return {
        isValid: true,
        productId: subscription.subscriptionId,
        purchaseState: subscription.linkedPurchaseToken
          ? 1 // PURCHASED
          : 0, // PENDING
        purchaseDate: new Date(parseInt(subscription.startTimeMillis)),
        expiryDate: new Date(parseInt(subscription.expiryTimeMillis)),
        autoRenewing: subscription.autoRenewingState === 1,
      };
    } catch (error) {
      console.error("Google Play verification failed:", error);
      throw new Error("Invalid Android receipt");
    }
  }

  private verifySignature(
    originalJson: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      // Convert signature from base64
      const signatureBuffer = Buffer.from(signature, "base64");

      // Verify using public key
      const verifier = crypto.createVerify("RSA-SHA1");
      verifier.update(originalJson);

      return verifier.verify(publicKey, signatureBuffer);
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  private async getPublicKey(): Promise<string> {
    // This would be cached in practice
    const response =
      await this.androidPublisherService.androidpublisher.getPublicKey({
        packageName: this.packageName,
      });

    return response.data.publicKey;
  }
}
```

### Environment Variables Required

```
GOOGLE_PLAY_PACKAGE_NAME=com.anonymous.Pairfect
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Database Schema

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  status ENUM('active', 'expired', 'cancelled') NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  payment_reference VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),

  -- IAP specific fields
  iap_receipt_id VARCHAR(255),
  iap_platform ENUM('ios', 'android') NOT NULL,
  auto_renewal_status BOOLEAN,
  original_transaction_id VARCHAR(255), -- iOS
  purchase_token VARCHAR(500), -- Android

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_active_sub (user_id, status),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- IAP Receipts table (audit trail)
CREATE TABLE iap_receipts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  platform ENUM('ios', 'android') NOT NULL,
  receipt_data JSON NOT NULL,
  status ENUM('verified', 'failed', 'pending') NOT NULL,
  error_message TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
);
```

## Express/Node.js Implementation Example

```typescript
import express from "express";
import { authenticateToken } from "./middleware/auth";
import { AppleIAPVerifier } from "./services/apple-iap";
import { GooglePlayIAPVerifier } from "./services/google-play-iap";

const router = express.Router();
const appleVerifier = new AppleIAPVerifier(
  process.env.APPLE_PRIVATE_KEY!,
  process.env.APPLE_KEY_ID!,
  process.env.APPLE_ISSUER_ID!,
  process.env.APPLE_BUNDLE_ID!,
);

const googleVerifier = new GooglePlayIAPVerifier(
  process.env.GOOGLE_APPLICATION_CREDENTIALS!,
  process.env.GOOGLE_PLAY_PACKAGE_NAME!,
);

router.post("/verify-iap", authenticateToken, async (req, res) => {
  try {
    const { receipt, productId, platform } = req.body;
    const userId = req.user.id;

    if (!receipt || !platform) {
      return res.status(400).json({
        success: false,
        message: "Missing receipt or platform",
      });
    }

    let verificationResult: any;

    if (platform === "ios") {
      // iOS verification
      verificationResult = await appleVerifier.verifyReceipt({
        transactionId: receipt.transactionId,
        receipt: receipt.receipt,
        productId: productId || receipt.productId,
      });
    } else if (platform === "android") {
      // Android verification
      verificationResult = await googleVerifier.verifySubscription({
        originalJson: receipt.originalJson,
        signature: receipt.signature,
        purchaseToken: receipt.purchaseToken,
        productId: productId || receipt.productId,
      });
    } else {
      throw new Error("Invalid platform");
    }

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid receipt",
      });
    }

    // Check if subscription already exists
    let subscription = await getSubscriptionByReference(
      verificationResult.transactionId || verificationResult.purchaseToken,
    );

    if (!subscription) {
      // Create new subscription
      const planId = mapProductIdToPlanId(verificationResult.productId);
      subscription = await createSubscription({
        userId,
        planId,
        status: "active",
        startDate: verificationResult.purchaseDate,
        endDate: verificationResult.expiryDate,
        paymentReference:
          verificationResult.transactionId || verificationResult.purchaseToken,
        amount: getPriceForProduct(verificationResult.productId),
        currency: "USD",
        iapReceiptId: verificationResult.transactionId,
        iapPlatform: platform,
        originalTransactionId: verificationResult.originalTransactionId,
        purchaseToken: verificationResult.purchaseToken,
        autoRenewalStatus: verificationResult.isRenewable,
      });
    } else if (subscription.endDate < new Date()) {
      // Renew existing subscription
      subscription = await renewSubscription(subscription.id, {
        startDate: verificationResult.purchaseDate,
        endDate: verificationResult.expiryDate,
        status: "active",
      });
    }

    // Log receipt for audit trail
    await logIAPReceipt({
      userId,
      subscriptionId: subscription.id,
      productId: verificationResult.productId,
      platform,
      receiptData: receipt,
      status: "verified",
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        paymentReference: subscription.paymentReference,
        amount: subscription.amount,
        currency: subscription.currency,
      },
      message: "Subscription verified successfully",
    });
  } catch (error: any) {
    console.error("IAP verification error:", error);

    // Log failed receipt
    await logIAPReceipt({
      userId: req.user.id,
      productId: req.body.productId,
      platform: req.body.platform,
      receiptData: req.body.receipt,
      status: "failed",
      errorMessage: error.message,
    });

    res.status(400).json({
      success: false,
      message: error.message || "Verification failed",
    });
  }
});

export default router;
```

## Important Notes

1. **Never trust client-side verification** - Always verify receipts on the backend
2. **Use HTTPS** - All IAP communications must be encrypted
3. **Cache verification results** - Don't verify the same receipt twice
4. **Handle timezone issues** - Store all dates in UTC
5. **Monitor for fraud** - Log all verification attempts
6. **Update certificates regularly** - Apple/Google rotate their keys
7. **Test with sandbox first** - Before going to production

## Production Considerations

- Implement retry logic for verification failures
- Add rate limiting to prevent abuse
- Monitor verification latency
- Set up alerts for verification failures
- Implement webhook handlers for subscription events
- Use background jobs to check subscription expiration
- Implement grace period for failed renewals
- Log all transactions for compliance/auditing
