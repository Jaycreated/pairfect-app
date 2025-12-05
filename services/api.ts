import { API_CONFIG, getApiUrl } from '@/config/api';
import { Storage } from '@/utils/storage';

export interface NotificationType {
  id: string;
  type: 'like' | 'match' | 'message' | 'view' | 'other';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  message: string;
  time: string;
  read: boolean;
  isSubscriptionPrompt?: boolean;
  createdAt: string;
}

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
}

// Helper function to handle API requests
async function fetchApi<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  data: any = null,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(endpoint);
  const token = await Storage.getItem('auth_token');
  
  console.log('Current auth token from storage:', token);
  console.log('Making request to:', url);
  
  const headers: HeadersInit = {
    ...API_CONFIG.HEADERS,
    ...customHeaders,
  };
  
  console.log('Request headers before adding auth:', headers);

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data) {
    if (data instanceof FormData) {
      // Remove content-type header for FormData to let the browser set it with the correct boundary
      delete headers['Content-Type'];
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }

  try {
    console.log('Final request config:', {
      url,
      method,
      headers: config.headers,
      body: data instanceof FormData ? '[FormData]' : data
    });
    
    const response = await Promise.race([
      fetch(url, config),
      new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT)
      ) as Promise<Response>
    ]);

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: {
          message: responseData.message || 'An error occurred',
          status: response.status,
          code: responseData.code,
        },
      };
    }

    return { data: responseData };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

// API Service
export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await fetchApi(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', { email, password });
    
    // If login is successful and we have a token, save it
    if (response.data?.token) {
      await Storage.setItem('auth_token', response.data.token);
      console.log('Auth token saved after login');
    }
    
    return response;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    sexualOrientation: string;
  }) => {
    const response = await fetchApi(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData);
    
    // If registration is successful and we have a token, save it
    if (response.data?.token) {
      await Storage.setItem('auth_token', response.data.token);
      console.log('Auth token saved after registration');
    }
    
    return response;
  },

  getCurrentUser: () => fetchApi(API_CONFIG.ENDPOINTS.AUTH.ME),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, 'POST', {
      currentPassword,
      newPassword,
    }),

  logout: () => fetchApi(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST'),

  // User
  // User Profile
  getProfile: () => fetchApi<{
    user: {
      id: number;
      email: string;
      name: string;
      age: number | null;
      gender: string | null;
      bio: string | null;
      location: string | null;
      orientation: string | null;
      photos: string[];
      interests: string[];
      preferences: Record<string, any>;
      created_at: string;
      updated_at: string;
      has_chat_access: boolean;
      payment_date: string | null;
      payment_reference: string | null;
      is_admin: boolean;
      last_login: string;
    }
  }>(API_CONFIG.ENDPOINTS.USERS.PROFILE),

  updateProfile: async (userData: {
    name?: string;
    gender?: string | null;
    age?: number | null;
    location?: string | null;
    orientation?: string | null;
    bio?: string | null;
    interests?: string[];
    photos?: string[];
  }) => {
    try {
      console.log('📤 [API] Updating profile with data:', userData);
      const response = await fetchApi(API_CONFIG.ENDPOINTS.USERS.PROFILE, 'PUT', userData);
      
      if (response.error) {
        console.error('❌ [API] Profile update failed:', response.error);
        throw new Error(response.error.message || 'Failed to update profile');
      }
      
      console.log('✅ [API] Profile updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [API] Error in updateProfile:', error);
      throw error;
    }
  },

  // Matches
  getPotentialMatches: async () => {
    try {
      const response = await fetchApi<{
        success: boolean;
        count: number;
        matches: Array<{
          id: number | string;
          name: string;
          age: number | null;
          bio: string | null;
          location: string | null;
          photos: string[];
          preferences: {
            lookingFor?: string;
            interestedIn?: string;
          };
        }>;
      }>(API_CONFIG.ENDPOINTS.USERS.POTENTIAL_MATCHES, 'GET');
      
      if (response.error) {
        console.error('Error fetching potential matches:', response.error);
        return [];
      }
      
      // Transform the API response to match the expected format
      return (response.data?.matches || []).map(match => ({
        id: String(match.id),
        name: match.name,
        age: match.age || 0,
        bio: match.bio || '',
        distance: '', // Not provided in the API response
        location: match.location || '',
        interest: match.preferences?.lookingFor || match.preferences?.interestedIn || '',
        images: match.photos || []
      }));
    } catch (error) {
      console.error('Failed to fetch potential matches:', error);
      return [];
    }
  },
    
  likeUser: async (userId: string) => {
    try {
      const response = await fetchApi<{ success: boolean; match?: boolean; message?: string }>(
        API_CONFIG.ENDPOINTS.MATCHES.LIKE(userId),
        'POST'
      );
      
      // Only include match in the response if it exists in the API response
      const responseData = response.data?.match !== undefined 
        ? { match: response.data.match }
        : {};
        
      return { data: responseData, error: response.error };
    } catch (error) {
      console.error('Error liking user:', error);
      return { error: 'Failed to like user' };
    }
  },
    
  passUser: async (userId: string) => {
    try {
      const response = await fetchApi<{ success: boolean; message?: string }>(
        API_CONFIG.ENDPOINTS.MATCHES.PASS(userId),
        'POST'
      );
      return { data: {}, error: response.error };
    } catch (error) {
      console.error('Error passing user:', error);
      return { error: 'Failed to pass user' };
    }
  },
    
  getMatches: () => 
    fetchApi(API_CONFIG.ENDPOINTS.MATCHES.BASE),

  // Messages
  getMessages: (conversationId: string | number) => 
    fetchApi(`/messages/${conversationId}`),
    
  sendMessage: (conversationId: string | number, messageData: { content: string; senderId: string | number; recipientId: string | number }) => {
    return fetchApi(`/messages/${conversationId}`, 'POST', messageData);
  },
  
  getUnreadMessageCount() {
    return this.get('/messages/unread-count');
  },

  // Conversations
  getConversations() {
    return this.get<{ conversations: any[] }>(API_CONFIG.ENDPOINTS.MESSAGES.CONVERSATIONS).then(response => {
      if (response.data) {
        // Return the nested conversations array directly
        return {
          ...response,
          data: response.data.conversations || []
        };
      }
      return response;
    });
  },
  
  // Get single conversation details
  getConversation: (conversationId: string | number) => 
    fetchApi(`/conversations/${conversationId}`),

  // Generic methods
  get: <T = any>(endpoint: string) => fetchApi<T>(endpoint, 'GET'),
  post: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'POST', data),
  put: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'PUT', data),
  patch: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'PATCH', data),
  delete: (endpoint: string) => fetchApi(endpoint, 'DELETE'),

  // Notifications
  getNotifications: async () => {
    const response = await fetchApi<{ notifications: NotificationType[] }>('/notifications', 'GET');
    // Return the notifications array from the response data or an empty array if not found
    return {
      ...response,
      data: response.data?.notifications || []
    };
  },
  
  getUnreadNotificationCount: () => 
    fetchApi<{ count: number }>('/notifications/unread/count', 'GET'),
  
  markNotificationAsRead: (notificationId: string) => 
    fetchApi(`/notifications/${notificationId}/read`, 'PUT'),
  
  markAllNotificationsAsRead: () => 
    fetchApi('/notifications/read-all', 'PUT'),
  
  deleteNotification: (notificationId: string) => 
    fetchApi(`/notifications/${notificationId}`, 'DELETE'),
};

// Auth interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Improved auth retry with proper token refresh
export const withAuthRetry = async <T = any>(
  apiCall: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  const result = await apiCall();
  
  // If the error is not an authentication error, return it
  if (!result.error || result.error.status !== 401) {
    return result;
  }

  // If we're already refreshing, add to the queue
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => apiCall());
  }

  isRefreshing = true;

  try {
    // TODO: Implement actual token refresh endpoint
    // Example: const refreshResult = await fetchApi('/auth/refresh', 'POST');
    
    // For now, clear the token and return the error
    await Storage.deleteItem('auth_token');
    processQueue(new Error('Token expired'), null);
    
    return result;
  } catch (error) {
    console.error('Error during token refresh:', error);
    await Storage.deleteItem('auth_token');
    processQueue(error, null);
    return result;
  } finally {
    isRefreshing = false;
  }
};