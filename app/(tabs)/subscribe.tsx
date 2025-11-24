import { useSubscription } from '@/context/SubscriptionContext';
import { getSubscriptionPlans, initiatePayment } from '@/services/subscriptionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubscribeScreen() {
  const router = useRouter();
  const { subscription, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const plans = getSubscriptionPlans();

  const handleSubscribe = async (planId: string) => {
    try {
      setIsProcessing(true);
      setSelectedPlan(planId);
      
      // Initiate payment
      const { authorizationUrl, reference } = await initiatePayment(planId);
      
      // In a real app, you would open the payment URL in a WebView or deep link
      // For now, we'll simulate a successful payment after a delay
      console.log('Payment initiated:', authorizationUrl);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh subscription status
      await refreshSubscription();
      
      // Navigate to home or success screen
      router.replace('/(tabs)/messages');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Chats</Text>
        <Text style={styles.subtitle}>Choose a plan to start chatting with your matches</Text>
      </View>
      
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard,
              plan.isPopular && styles.popularPlan,
            ]}
          >
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}
            
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
            <Text style={styles.planDuration}>per {plan.duration}</Text>
            
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                isProcessing && selectedPlan === plan.id && styles.subscribeButtonLoading,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isProcessing}
            >
              {isProcessing && selectedPlan === plan.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {subscription?.status === 'active' ? 'Upgrade Plan' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your subscription will automatically renew unless canceled at least 24 hours before the end of the current period.
        </Text>
        <Text style={[styles.footerText, styles.termsText]}>
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
    overflow: 'hidden',
  },
  popularPlan: {
    borderColor: '#6c5ce7',
    borderWidth: 2,
    marginTop: 10,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 8,
  },
  planDuration: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#495057',
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonLoading: {
    opacity: 0.8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  termsText: {
    marginTop: 8,
  },
});
