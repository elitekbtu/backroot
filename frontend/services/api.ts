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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
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
}

// Export singleton instance
export const apiService = new ApiService(); 