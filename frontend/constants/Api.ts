// API Configuration  
const getBaseUrl = () => {
  // Backend is running on localhost:8000
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout',
    },
    USERS: {
      ME: '/api/users/me',
    },
    COINS: {
      GET_ALL: '/api/coins',
      DISCOVER: '/api/coins/discover',
      COLLECT: '/api/coins/{id}/collect',
    },
  },
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
}; 