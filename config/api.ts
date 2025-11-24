// API configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH_TOKEN: '/auth/refresh-token',
    },
    USER: {
      PROFILE: '/users/me',
      UPDATE_PROFILE: '/users/me',
      UPLOAD_AVATAR: '/users/me/avatar',
    },
    MATCHES: {
      GET_MATCHES: '/matches',
      LIKE_USER: '/matches/like',
      PASS_USER: '/matches/pass',
    },
    NOTIFICATIONS: {
      REGISTER_TOKEN: '/notifications/register',
      UNREGISTER_TOKEN: '/notifications/unregister',
    },
  },
  
  // Default headers for API requests
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Timeout for requests in milliseconds
  TIMEOUT: 30000,
} as const;

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_CONFIG.BASE_URL.replace(/\/+$/, '')}/${cleanEndpoint}`;
};
