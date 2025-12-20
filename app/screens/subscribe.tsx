// app/(tabs)/subscribe.tsx
import { useSubscription } from '@/context/SubscriptionContext';
import { useToast } from '@/context/ToastContext';
import { connectToIAP, disconnectIAP, IOS_PRODUCT_IDS, purchaseItem } from '@/services/iapService';
import { createOrder, getSubscriptionPlans, initiatePayment, storePaymentAttempt } from '@/services/subscriptionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubscribeScreen() {
  const router = useRouter();
  const { subscription, refreshSubscription } = useSubscription();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const plans = getSubscriptionPlans();

  const handleSubscribe = async (planId: string) => {
    if (isProcessing) return;
    
    // Define the deep link handler function
    const handleDeepLink = (event: { url: string }) => {
      console.log('Received deep link:', event.url);
      // When we get a deep link, refresh the subscription status
      refreshSubscription().then(() => {
        // Navigate to messages tab after subscription is refreshed
        router.replace('/(tabs)/messages');
      });
    };
    
    let subscription: { remove: () => void } | null = null;
    
    try {
      setIsProcessing(true);
      setSelectedPlan(planId);
      
      // If iOS use IAP, Android -> redirect to website
      if (Platform.OS === 'ios') {
        const productId = planId === 'daily' ? IOS_PRODUCT_IDS.daily : IOS_PRODUCT_IDS.monthly;
        await purchaseItem(productId);
        // After purchaseListener verifies and backend verifies, refresh subscription
        await refreshSubscription();
        router.replace('/(tabs)/messages');
        return;
      }

      // For Android/Web: Create order and initiate payment
      const { orderId } = await createOrder(planId);
      const { paymentId, authorizationUrl, reference } = await initiatePayment(orderId, planId);
      await storePaymentAttempt({ paymentId, orderId, reference, planId });
      
      // Open the payment URL in the browser
      if (authorizationUrl) {
        // Add the event listener
        subscription = Linking.addEventListener('url', handleDeepLink);
        
        // Check if we can open the URL
        const canOpen = await Linking.canOpenURL(authorizationUrl);
        if (!canOpen) {
          throw new Error('Cannot open payment URL');
        }
        
        // Open the payment URL in the browser
        await Linking.openURL(authorizationUrl);
        
        // Clean up the listener after 10 minutes
        setTimeout(() => {
          if (subscription) {
            subscription.remove();
          }
        }, 600000); // 10 minutes
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      // Clean up the subscription if it was created
      if (subscription) {
        subscription.remove();
      }
      setSelectedPlan(null);
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    connectToIAP();
    return () => {
      disconnectIAP();
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Plan</Text>
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard,
              plan.isPopular && styles.popularPlan
            ]}
          >
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}
            
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              ₦{plan.price.toLocaleString()}
              <Text style={styles.planDuration}> / {plan.duration}</Text>
            </Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
            
            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#651B55" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                (isProcessing && selectedPlan === plan.id) && styles.subscribeButtonLoading
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isProcessing}
            >
              {isProcessing && selectedPlan === plan.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {subscription ? 'Manage Plan' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    position: 'relative',
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: '#651B55',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#651B55',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#651B55',
    marginBottom: 8,
  },
  planDuration: {
    fontSize: 16,
    color: '#666',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#444',
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: '#651B55',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonLoading: {
    opacity: 0.8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});