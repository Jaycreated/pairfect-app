import { API_CONFIG, getApiUrl } from '@/config/api';
import { Storage } from '@/utils/storage';
import Device from 'expo-device';
import * as Notifications from 'expo-notifications';

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
  
  const headers: HeadersInit = {
    ...API_CONFIG.HEADERS,
    ...customHeaders,
  };

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
  login: (email: string, password: string) =>
    fetchApi(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', { email, password }),

  register: (userData: {
    email: string;
    password: string;
    name: string;
    // Add other registration fields as needed
  }) => fetchApi(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData),

  // User
  getProfile: () => fetchApi(API_CONFIG.ENDPOINTS.USER.PROFILE),
  
  updateProfile: (userData: any) =>
    fetchApi(API_CONFIG.ENDPOINTS.USER.UPDATE_PROFILE, 'PATCH', userData),
    
  uploadAvatar: (imageUri: string) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg', // or any other image type
      name: 'profile.jpg',
    } as any);
    
    return fetchApi(
      API_CONFIG.ENDPOINTS.USER.UPLOAD_AVATAR,
      'POST',
      formData,
      { 'Content-Type': 'multipart/form-data' }
    );
  },

  // Matches
  getMatches: () => fetchApi(API_CONFIG.ENDPOINTS.MATCHES.GET_MATCHES),
  
  likeUser: (userId: string) =>
    fetchApi(API_CONFIG.ENDPOINTS.MATCHES.LIKE_USER, 'POST', { userId }),
    
  passUser: (userId: string) =>
    fetchApi(API_CONFIG.ENDPOINTS.MATCHES.PASS_USER, 'POST', { userId }),

  // Notifications
  registerPushToken: async () => {
    if (!Device.isDevice) {
      console.log('Must use a physical device for Push Notifications');
      return { error: { message: 'Must use a physical device' } };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return { error: { message: 'Failed to get push token' } };
    }

    try {
      const projectId = 'your-expo-project-id'; // Replace with your Expo project ID
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Send the token to your backend
      return fetchApi(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN,
        'POST',
        { token }
      );
    } catch (error) {
      console.error('Error registering push token:', error);
      return { error: { message: 'Error registering push token' } };
    }
  },

  // Generic methods
  get: <T = any>(endpoint: string) => fetchApi<T>(endpoint, 'GET'),
  post: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'POST', data),
  put: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'PUT', data),
  patch: <T = any>(endpoint: string, data: any) => fetchApi<T>(endpoint, 'PATCH', data),
  delete: <T = any>(endpoint: string) => fetchApi<T>(endpoint, 'DELETE'),
};

// Auth interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<() => void> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => prom());
  failedQueue = [];
};

// You can add this to your API calls to handle token refresh
// This is a simplified example - you might need to adjust it based on your auth flow
const withAuthRetry = async <T>(
  apiCall: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiCall();
    
    if (response.error?.status === 401) {
      // Token expired, try to refresh
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshResponse = await fetchApi(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN, 'POST');
          
          if (refreshResponse.data?.token) {
            // Save new token using Storage
            await Storage.setItem('auth_token', refreshResponse.data.token);
            // Retry the original request
            const retryResponse = await apiCall();
            processQueue();
            return retryResponse;
          } else {
            // Refresh failed, logout user
            processQueue(new Error('Session expired'));
            // TODO: Redirect to login
            return { error: { message: 'Session expired. Please login again.' } };
          }
        } catch (error) {
          processQueue(error);
          return { error: { message: 'Failed to refresh session' } };
        } finally {
          isRefreshing = false;
        }
      } else {
        // If we're already refreshing, queue the request
        return new Promise((resolve) => {
          failedQueue.push(() => {
            resolve(apiCall());
          });
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
    };
  }
};
