import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  UserInfo,
  AuthApiResponse,
  ApiError
} from '../types/auth';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  REFRESH: '/api/v1/auth/refresh',
  ME: '/api/v1/auth/me',
  LOGOUT: '/api/v1/auth/logout'
};

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const storeTokens = (tokens: TokenResponse): void => {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthApiResponse<T>> => {
  const token = getStoredToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          detail: data.detail || 'An error occurred',
          status_code: response.status,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        detail: error instanceof Error ? error.message : 'Network error',
        status_code: 0,
      },
    };
  }
};

// Auth API functions
export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthApiResponse<TokenResponse>> => {
    const response = await apiRequest<TokenResponse>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      storeTokens(response.data);
    }

    return response;
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<AuthApiResponse<TokenResponse>> => {
    const response = await apiRequest<TokenResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      storeTokens(response.data);
    }

    return response;
  },

  // Refresh access token
  refreshToken: async (): Promise<AuthApiResponse<TokenResponse>> => {
    const refreshToken = getStoredRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        error: {
          detail: 'No refresh token available',
          status_code: 401,
        },
      };
    }

    const response = await apiRequest<TokenResponse>(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.success && response.data) {
      storeTokens(response.data);
    }

    return response;
  },

  // Get current user info
  getCurrentUser: async (): Promise<AuthApiResponse<UserInfo>> => {
    return apiRequest<UserInfo>(AUTH_ENDPOINTS.ME, {
      method: 'GET',
    });
  },

  // Logout user
  logout: async (): Promise<AuthApiResponse<void>> => {
    const response = await apiRequest<void>(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });

    // Clear tokens regardless of API response
    clearTokens();

    return response;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = getStoredToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },
};

// Export individual functions for convenience
export const {
  login,
  register,
  refreshToken,
  getCurrentUser,
  logout,
  isAuthenticated
} = authApi;
