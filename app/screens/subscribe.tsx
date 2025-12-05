// app/(tabs)/subscribe.tsx
import { useSubscription } from '@/context/SubscriptionContext';
import { createOrder, getSubscriptionPlans, initiatePayment, storePaymentAttempt } from '@/services/subscriptionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubscribeScreen() {
  const router = useRouter();
  const { subscription, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const plans = getSubscriptionPlans();

  const handleSubscribe = async (planId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setSelectedPlan(planId);
      
      // 1. Create an order first
      const { orderId } = await createOrder(planId);
      
      // 2. Initiate payment with the order ID
      const { paymentId, authorizationUrl, reference } = await initiatePayment(orderId);
      
      // 3. Store payment attempt for recovery
      await storePaymentAttempt({
        paymentId,
        orderId,
        reference,
        planId,
      });
      
      // 4. In a real app, you would open the payment URL in a WebView or deep link
      console.log('Payment URL:', authorizationUrl);
      
      // 5. For demo purposes, we'll simulate a successful payment
      // In a real app, you would:
      // - Open WebView with the authorization URL
      // - Listen for payment completion
      // - Verify payment status
      // - Update subscription status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 6. Refresh subscription status
      await refreshSubscription();
      
      // 7. Navigate to success screen
      router.replace('/(tabs)/messages');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error instanceof Error ? error.message : 'Failed to process payment. Please try again.'
      );
    } finally {
      setSelectedPlan(null);
      setIsProcessing(false);
    }
  };

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