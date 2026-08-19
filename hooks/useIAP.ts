import { useEffect, useRef } from "react";

/**
 * Hook to initialize and manage IAP connection
 * Should be called once in the root layout of your app
 *
 * Note: IAP initialization is optional and gracefully degrades if not available
 */
export const useIAP = () => {
  const initializationAttempted = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializationAttempted.current) {
      return;
    }

    initializationAttempted.current = true;

    const initializeIAP = async () => {
      try {
        // Lazy import to avoid breaking the app if native modules aren't available
        const { connectToIAP, getAvailableProducts, disconnectIAP } =
          await import("@/services/iapService");

        console.log("Initializing IAP...");
        await connectToIAP();

        // Fetch available products
        const products = await getAvailableProducts();
        console.log(`Successfully loaded ${products.length} products`);

        // Keep IAP connection active for the app lifecycle
        return undefined;
      } catch (error) {
        console.warn(
          "IAP not available - app will continue without in-app purchases:",
          error,
        );
        // App continues to work without IAP
        return undefined;
      }
    };

    let cleanup: (() => Promise<void>) | undefined;
    initializeIAP().then((cleanupFn) => {
      cleanup = cleanupFn as any;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);
};
