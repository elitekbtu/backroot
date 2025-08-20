import { API_CONFIG, type ApiResponse } from '@/constants/Api';

// Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Coin Types
export interface Coin {
  id: number;
  map_id: number;
  latitude: number;
  longitude: number;
  is_collected: boolean;
  collected_by_id?: number;
  collected_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CoinWithDistance extends Coin {
  distance_meters?: number;
  map_name?: string;
  map_description?: string;
}

export interface CoinList {
  items: Coin[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CoinListWithDistance {
  items: CoinWithDistance[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Add authorization header if access token exists
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData?.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<ApiResponse<TokenResponse>> {
    return this.makeRequest<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<TokenResponse>> {
    return this.makeRequest<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
    const requestData: RefreshTokenRequest = {
      refresh_token: refreshToken,
    };
    
    return this.makeRequest<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return this.makeRequest<UserInfo>(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  // Coin Methods
  async getCoins(page: number = 1, size: number = 10): Promise<ApiResponse<CoinList>> {
    return this.makeRequest<CoinList>(`${API_CONFIG.ENDPOINTS.COINS.GET_ALL}?page=${page}&size=${size}`);
  }

  async discoverCoins(lat: number, lon: number, page: number = 1, size: number = 10): Promise<ApiResponse<CoinListWithDistance>> {
    return this.makeRequest<CoinListWithDistance>(`${API_CONFIG.ENDPOINTS.COINS.DISCOVER}?lat=${lat}&lon=${lon}&page=${page}&size=${size}`);
  }

  async collectCoin(coinId: number, lat: number, lon: number): Promise<ApiResponse<Coin>> {
    return this.makeRequest<Coin>(`${API_CONFIG.ENDPOINTS.COINS.COLLECT.replace('{id}', coinId.toString())}?lat=${lat}&lon=${lon}`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService(); 