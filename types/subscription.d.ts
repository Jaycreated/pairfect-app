export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'day' | 'month';
  features: string[];
  isPopular?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  paymentReference: string;
  amount: number;
  currency: string;
}
