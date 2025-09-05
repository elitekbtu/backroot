// Auth Types based on backend schema

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

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInfo {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

// Frontend form types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

// Auth context types
export interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loading: boolean;
}

// API response types
export interface ApiError {
  detail: string;
  status_code: number;
}

export interface AuthApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}