// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://68.183.219.243:8000',
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
  },
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
}; 