import { useToast } from '@/context/ToastContext';
import { checkChatAccess, verifyChatPayment } from '@/services/subscriptionService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ reference?: string }>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);

        const reference = typeof params?.reference === 'string' ? params.reference : undefined;

        if (reference) {
          try {
            await verifyChatPayment(reference);
          } catch (err) {
            // best-effort; access check is authoritative
          }
        }

        const access = await checkChatAccess();

        if (!isMounted) return;

        if (access?.hasAccess) {
          showToast('Payment successful', 'success');
          router.replace('/(tabs)/messages' as any);
          return;
        }

        showToast('Payment not confirmed yet. Please try again.', 'error');
        router.replace('/(tabs)/messages' as any);
      } catch (error) {
        if (!isMounted) return;
        showToast('Could not confirm payment. Please try again.', 'error');
        router.replace('/(tabs)/messages' as any);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [params?.reference, router, showToast]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoading ? <ActivityIndicator size="large" /> : null}
    </View>
  );
}
