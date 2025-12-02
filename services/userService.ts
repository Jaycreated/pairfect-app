import { getApiUrl } from '@/config/api';
import { Storage } from '@/utils/storage';

export interface UserSettings {
  darkMode: boolean;
  notifications: {
    matches: boolean;
    messages: boolean;
    promotions: boolean;
  };
}

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

// Helper function to set auth token
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await Storage.setItem('auth_token', token);
    console.log('🔑 [setAuthToken] Token saved successfully');
  } catch (error) {
    console.error('❌ [setAuthToken] Error saving token:', error);
    throw error;
  }
};

// Helper function to get auth token
export const getAuthToken = async (): Promise<string> => {
  console.log('🔑 [getAuthToken] Attempting to retrieve auth token...');
  try {
    const token = await Storage.getItem('auth_token');
    console.log('🔑 [getAuthToken] Token exists:', !!token);
    if (!token) throw new Error('No authentication token found');
    return token;
  } catch (error) {
    console.error('❌ [getAuthToken] Error retrieving token:', error);
    throw error;
  }
};

// Get user settings
export const getUserSettings = async (): Promise<UserSettings> => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(getApiUrl('/users/settings'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user settings');
    }

    const data = await response.json();
    // Extract settings from the nested structure
    return data.settings || data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    
    // DEBUG: Log more error details
    if (error instanceof TypeError) {
      console.error('Network error - is your backend running?');
    }
    
    throw error;
  }
};

// Update user settings
export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(getApiUrl('/users/settings'), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update user settings');
    }

    const data = await response.json();
    // Extract settings from the nested structure
    return data.settings || data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
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
