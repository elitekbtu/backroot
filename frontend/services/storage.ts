import * as SecureStore from 'expo-secure-store';

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

export class StorageService {
  // Check if SecureStore is available
  private static async isAvailable(): Promise<boolean> {
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