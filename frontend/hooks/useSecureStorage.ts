import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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

export const useSecureStorage = () => {
  const isWeb = Platform.OS === 'web';

  const getItem = async (key: string): Promise<string | null> => {
    if (isWeb) {
      return webStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  };

  const setItem = async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      webStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore errors
    }
  };

  const deleteItem = async (key: string): Promise<void> => {
    if (isWeb) {
      webStorage.deleteItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors
    }
  };

  return {
    getItem,
    setItem,
    deleteItem,
  };
};

