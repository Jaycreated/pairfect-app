import { getApiUrl } from '@/config/api';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  distance: string;
  location: string;
  interest: string;
  images: string[];
  // Add other user profile fields as needed
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Fetch potential matches for swiping
export const getPotentialMatches = async (): Promise<UserProfile[]> => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(getApiUrl('/users/potential-matches'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch potential matches');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
  }
};

// Send swipe action (like/pass)
export const sendSwipeAction = async (targetUserId: string, action: 'like' | 'pass'): Promise<{ match: boolean }> => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(getApiUrl('/swipes'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUserId,
        action,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to process swipe action');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing swipe action:', error);
    throw error;
  }
};
