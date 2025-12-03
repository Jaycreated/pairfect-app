// API configuration
export const API_CONFIG = {
  // Base URL for API requests (Render URL must be in .env)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL as string,
  
  // WebSocket configuration
  get WS_URL() {
    const url = new URL(this.BASE_URL);
    return `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}${url.pathname}`;
  },
  
  // WebSocket namespace (path from the URL)
  get WS_NAMESPACE() {
    const url = new URL(this.BASE_URL);
    return url.pathname || '/';
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
