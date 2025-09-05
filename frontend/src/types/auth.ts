// Basic auth types for structure
export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Backend response types
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

// Auth response wrapper
export interface AuthResponse {
  success: boolean;
  data?: TokenResponse | UserInfo;
  error?: {
    detail: string;
  };
}

// Auth context types
export interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
