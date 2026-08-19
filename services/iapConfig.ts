export const PRODUCT_IDS = {
  ios: {
    daily: "ng.com.pairfect.dailysubscribe",
    monthly: "ng.com.pairfect.monthlyaccess",
  },
  android: {
    daily: "com.pairfect.daily",
    monthly: "com.pairfect.monthly",
  },
} as const;

export const getProductIdsForPlatform = (platform: "ios" | "android") => {
  const ids = PRODUCT_IDS[platform];
  return Object.values(ids);
};

export const isPurchaseVerificationSuccessful = (response: any): boolean => {
  if (!response) {
    return false;
  }

  if (typeof response === "boolean") {
    return response;
  }

  if (response.ok === false) {
    return false;
  }

  if (typeof response.status === "number" && response.status >= 400) {
    return false;
  }

  const body = response.body ?? response.data ?? response;

  if (body && typeof body === "object") {
    if (body.success === false) {
      return false;
    }

    if (body.success === true) {
      return true;
    }
  }

  return Boolean(response.ok) || false;
};
