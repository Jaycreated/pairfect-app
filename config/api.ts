// API configuration
export const API_CONFIG = {
  // Base URL for API requests (Render URL must be in .env)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL as string,
  
  // WebSocket configuration
  get WS_URL() {
    const url = new URL(this.BASE_URL);
    // Convert http/https to ws/wss
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove any existing /api from the path if present
    const path = url.pathname.replace(/\/api\/?$/, '');
    return `${protocol}//${url.host}${path}`;
  },
  
  // WebSocket namespace (path from the URL)
  get WS_NAMESPACE() {
    const url = new URL(this.BASE_URL);
    // Get the base path without /api
    const path = url.pathname.replace(/\/api\/?$/, '');
    return path || '/';
  },

  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: 'auth/login',
      REGISTER: 'auth/register',
      ME: 'auth/me',
      CHANGE_PASSWORD: 'auth/change-password',
      LOGOUT: 'auth/logout',
    },
    USERS: {
      PROFILE: 'users/profile',
      POTENTIAL_MATCHES: 'users/potential-matches',
      SETTINGS: 'users/settings',
    },
    MATCHES: {
      BASE: 'matches',
      LIKE: (userId: string) => `matches/like/${userId}`,
      PASS: (userId: string) => `matches/pass/${userId}`,
    },
    MESSAGES: {
      CONVERSATION: (matchId: string) => `messages/${matchId}`,
    }
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
  const base = API_CONFIG.BASE_URL.replace(/\/+$/, ''); // remove trailing slash
  const clean = endpoint.replace(/^\/+/, ''); // remove leading slash
  return `${base}/${clean}`;
};
