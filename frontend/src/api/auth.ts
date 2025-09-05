import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  TokenResponse, 
  RefreshTokenRequest, 
  UserInfo 
} from '../types/auth';
import { apiClient } from './client';

export const login = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<TokenResponse>('/auth/login', loginData);
    apiClient.setAuth(response.access_token, response.refresh_token);
    
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Login failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Login failed' 
      } 
    };
  }
};

export const register = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<TokenResponse>('/auth/register', registerData);
    apiClient.setAuth(response.access_token, response.refresh_token);
    
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Registration failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Registration failed' 
      } 
    };
  }
};

export const refreshAccessToken = async (): Promise<AuthResponse> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshData: RefreshTokenRequest = { refresh_token: refreshToken };
    const response = await apiClient.post<TokenResponse>('/auth/refresh', refreshData);
    
    apiClient.setAuth(response.access_token, response.refresh_token);
    
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Token refresh failed' 
      } 
    };
  }
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await apiClient.get<UserInfo>('/auth/me');
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get user info' 
      } 
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    apiClient.clearAuth();
  }
};

export const isAuthenticated = (): boolean => {
  return apiClient.isAuthenticated();
};
