import { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import type { LoginRequest, RegisterRequest, UserInfo } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = await StorageService.getAccessToken();
      const userData = await StorageService.getUserData();

      if (accessToken && userData) {
        apiService.setAccessToken(accessToken);
        
        // Verify token is still valid by fetching current user
        const response = await apiService.getCurrentUser();
        
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: response.data!,
            loading: false,
          }));
        } else {
          // Token expired or invalid, try refresh
          await attemptTokenRefresh();
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const attemptTokenRefresh = async () => {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      
      if (!refreshToken) {
        await logout();
        return;
      }

      const response = await apiService.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        await StorageService.setTokens(
          response.data.access_token,
          response.data.refresh_token
        );
        apiService.setAccessToken(response.data.access_token);
        
        // Fetch updated user info
        await refreshUserData();
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await logout();
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        // Store tokens
        await StorageService.setTokens(
          response.data.access_token,
          response.data.refresh_token
        );
        
        // Set API token
        apiService.setAccessToken(response.data.access_token);

        // Fetch user data
        const userResponse = await apiService.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          await StorageService.setUserData(userResponse.data);
          
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: userResponse.data!,
            loading: false,
          }));
          
          return true;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: response.error || 'Login failed',
      }));
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiService.register(userData);

      if (response.success && response.data) {
        // Store tokens
        await StorageService.setTokens(
          response.data.access_token,
          response.data.refresh_token
        );
        
        // Set API token
        apiService.setAccessToken(response.data.access_token);

        // Fetch user data
        const userResponse = await apiService.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          await StorageService.setUserData(userResponse.data);
          
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: userResponse.data!,
            loading: false,
          }));
          
          return true;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: response.error || 'Registration failed',
      }));
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      await StorageService.clearTokens();
      apiService.setAccessToken(null);
      
      // Используем функциональное обновление состояния для безопасности
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      }));
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        await StorageService.setUserData(response.data);
        setState(prev => ({
          ...prev,
          user: response.data!,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUserData,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
} 