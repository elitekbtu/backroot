import type { 
  CoinList, 
  CoinResponse, 
  CoinCreate, 
  CoinUpdate
} from '../types/coin';
import { apiClient } from './client';

// Response wrapper type for consistent error handling
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    detail: string;
  };
}

// Create a new coin
export const createCoin = async (coinData: CoinCreate): Promise<ApiResponse<CoinResponse>> => {
  try {
    const response = await apiClient.post<CoinResponse>('/coins/', coinData);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Create coin failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to create coin' 
      } 
    };
  }
};

// Get coins with pagination and filtering
export const getCoins = async (
  page: number = 1,
  size: number = 10,
  isActive?: boolean,
  search?: string
): Promise<ApiResponse<CoinList>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await apiClient.get<CoinList>(`/coins/?${params.toString()}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get coins failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get coins' 
      } 
    };
  }
};

// Get all active coins for AR functionality
export const getCoinsForAR = async (): Promise<ApiResponse<CoinResponse[]>> => {
  try {
    const response = await apiClient.get<CoinResponse[]>('/coins/ar');
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get coins for AR failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get coins for AR' 
      } 
    };
  }
};

// Get coin by symbol
export const getCoinBySymbol = async (symbol: string): Promise<ApiResponse<CoinResponse>> => {
  try {
    const response = await apiClient.get<CoinResponse>(`/coins/symbol/${symbol}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get coin by symbol failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get coin by symbol' 
      } 
    };
  }
};

// Get coin by ID
export const getCoin = async (coinId: number): Promise<ApiResponse<CoinResponse>> => {
  try {
    const response = await apiClient.get<CoinResponse>(`/coins/${coinId}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get coin failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get coin' 
      } 
    };
  }
};

// Update coin by ID
export const updateCoin = async (coinId: number, coinData: CoinUpdate): Promise<ApiResponse<CoinResponse>> => {
  try {
    const response = await apiClient.put<CoinResponse>(`/coins/${coinId}`, coinData);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Update coin failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to update coin' 
      } 
    };
  }
};

// Delete coin by ID (soft delete)
export const deleteCoin = async (coinId: number): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/coins/${coinId}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Delete coin failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to delete coin' 
      } 
    };
  }
};

// Search coins by query
export const searchCoins = async (query: string, page: number = 1, size: number = 10): Promise<ApiResponse<CoinList>> => {
  return getCoins(page, size, undefined, query);
};

// Filter coins by active status
export const filterCoins = async (isActive: boolean, page: number = 1, size: number = 10): Promise<ApiResponse<CoinList>> => {
  return getCoins(page, size, isActive);
};

// Get all coins (no pagination) - useful for dropdowns or simple lists
export const getAllCoins = async (): Promise<ApiResponse<CoinResponse[]>> => {
  try {
    // Get a large number of coins to effectively get all
    const response = await getCoins(1, 1000);
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.coins
      };
    }
    return {
      success: false,
      error: {
        detail: 'Failed to get all coins'
      }
    };
  } catch (error) {
    console.error('Get all coins failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get all coins' 
      } 
    };
  }
};
