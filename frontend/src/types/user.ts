// User profile and management types (matches backend UserResponse schema)
export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// User profile update form data (matches backend UserUpdate schema)
export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

// User profile creation data (matches backend UserCreate schema)
export interface UserCreateData {
  username: string;
  first_name?: string;
  last_name?: string;
  password: string;
}

// Password change data
export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// API response types
export interface UserResponse {
  success: boolean;
  data?: User;
  error?: {
    detail: string;
  };
}

export interface UsersListResponse {
  success: boolean;
  data?: User[];
  error?: {
    detail: string;
  };
}

// User form validation
export interface UserFormErrors {
  first_name?: string;
  last_name?: string;
  password?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}
