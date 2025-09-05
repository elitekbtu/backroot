import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, UserInfo, LoginRequest, RegisterRequest } from '../types/auth';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, isAuthenticated as checkAuth } from '../api/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Хук для использования AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      if (checkAuth()) {
        try {
          const response = await getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data as UserInfo);
            setIsAuthenticated(true);
          } else {
            // Если не удалось получить пользователя, очищаем токены
            await apiLogout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          await apiLogout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiLogin(credentials);
      
      if (response.success) {
        // Получаем информацию о пользователе после успешного логина
        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data as UserInfo);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiRegister(data);
      
      if (response.success) {
        // Получаем информацию о пользователе после успешной регистрации
        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data as UserInfo);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
