// API configuration
export const API_CONFIG = {
  // Base URL for API requests (Render URL must be in .env)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL as string,

  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: 'auth/login',
      REGISTER: 'auth/register',
      LOGOUT: 'auth/logout',
      REFRESH_TOKEN: 'auth/refresh-token',
    },
    USER: {
      PROFILE: 'users/me',
      UPDATE_PROFILE: 'users/me',
      UPLOAD_AVATAR: 'users/me/avatar',
    },
    MATCHES: {
      GET_MATCHES: 'matches',
      LIKE_USER: 'matches/like',
      PASS_USER: 'matches/pass',
    },
    NOTIFICATIONS: {
      REGISTER_TOKEN: 'notifications/register',
      UNREGISTER_TOKEN: 'notifications/unregister',
    },
  },

  // Default headers for API requests
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  // Timeout for requests in milliseconds
  TIMEOUT: 30000,
} as const;

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  const base = API_CONFIG.BASE_URL.replace(/\/+$/, ''); // remove trailing slash
  const clean = endpoint.replace(/^\/+/, ''); // remove leading slash
  return `${base}/${clean}`;
};
