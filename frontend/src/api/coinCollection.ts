import { apiClient } from './client';

// Response wrapper type for consistent error handling
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    detail: string;
  };
}

// Types
export interface CoinCollectionCreate {
  coin_id: number;
}

export interface CoinCollectionResponse {
  id: number;
  user_id: number;
  coin_id: number;
  collected_at: string;
  is_active: boolean;
}

export interface CoinCollectionStats {
  total_collected: number;
  unique_coins: number;
  collection_rate: number;
}

export interface UserCoinCollectionSummary {
  user_id: number;
  stats: CoinCollectionStats;
  recent_collections: CoinCollectionResponse[];
}

// Collect a coin
export const collectCoin = async (coinId: number): Promise<ApiResponse<CoinCollectionResponse>> => {
  try {
    const response = await apiClient.post<CoinCollectionResponse>('/coin-collections/', {
      coin_id: coinId
    });
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Collect coin failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to collect coin' 
      } 
    };
  }
};

// Collect a coin (public endpoint for AR)
export const collectCoinPublic = async (coinId: number): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>('/coin-collections/public', {
      coin_id: coinId
    });
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Collect coin public failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to collect coin' 
      } 
    };
  }
};

// Get user's collections
export const getUserCollections = async (limit: number = 50): Promise<ApiResponse<CoinCollectionResponse[]>> => {
  try {
    const response = await apiClient.get<CoinCollectionResponse[]>(`/coin-collections/?limit=${limit}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get user collections failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get collections' 
      } 
    };
  }
};

// Get user's collection summary
export const getUserCollectionSummary = async (): Promise<ApiResponse<UserCoinCollectionSummary>> => {
  try {
    const response = await apiClient.get<UserCoinCollectionSummary>('/coin-collections/summary');
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get collection summary failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get collection summary' 
      } 
    };
  }
};

// Get collected coin IDs
export const getCollectedCoinIds = async (): Promise<ApiResponse<number[]>> => {
  try {
    const response = await apiClient.get<number[]>('/coin-collections/collected-ids');
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Get collected coin IDs failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to get collected coin IDs' 
      } 
    };
  }
};

// Remove a collection
export const removeCollection = async (collectionId: number): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/coin-collections/${collectionId}`);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('Remove collection failed:', error);
    return { 
      success: false, 
      error: { 
        detail: error instanceof Error ? error.message : 'Failed to remove collection' 
      } 
    };
  }
};
