import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Fallback for web platform
const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  deleteItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

export class StorageService {
  private static isWeb = Platform.OS === 'web';

  // Check if SecureStore is available
  private static async isAvailable(): Promise<boolean> {
    if (this.isWeb) {
      return true; // localStorage is always available
    }
    try {
      return await SecureStore.isAvailableAsync();
    } catch (error) {
      console.warn('SecureStore is not available:', error);
      return false;
    }
  }

  // Token Management
  static async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      if (this.isWeb) {
        webStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        webStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        return;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('SecureStore is not available on this platform');
      }

      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      if (this.isWeb) {
        return webStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('SecureStore is not available on this platform');
        return null;
      }

      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      if (this.isWeb) {
        return webStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('SecureStore is not available on this platform');
        return null;
      }

      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      if (this.isWeb) {
        webStorage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        webStorage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
        webStorage.deleteItem(STORAGE_KEYS.USER_DATA);
        return;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('SecureStore is not available on this platform');
        return;
      }

      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // User Data Management
  static async setUserData(userData: any): Promise<void> {
    try {
      if (this.isWeb) {
        webStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        return;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('SecureStore is not available on this platform');
        return;
      }

      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      if (this.isWeb) {
        const userData = webStorage.getItem(STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.warn('SecureStore is not available on this platform');
        return null;
      }

      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }
} 