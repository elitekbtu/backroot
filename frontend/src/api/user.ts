import { apiClient } from './client';
import type { 
  User, 
  UserUpdateData, 
  UserCreateData, 
  PasswordChangeData
} from '../types/user';

class UserService {
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  }

  async getUserById(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users/');
  }

  // Update current user profile
  async updateCurrentUser(data: UserUpdateData): Promise<User> {
    return apiClient.put<User>('/users/me', data);
  }

  // Update user by ID (admin only)
  async updateUser(id: number, data: UserUpdateData): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  // Create new user (admin only)
  async createUser(data: UserCreateData): Promise<User> {
    return apiClient.post<User>('/users/', data);
  }

  // Delete user by ID (admin only)
  async deleteUser(id: number): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  }

  // Change password
  async changePassword(data: PasswordChangeData): Promise<User> {
    return apiClient.post<User>('/users/me/change-password', {
      current_password: data.current_password,
      new_password: data.new_password
    });
  }

  // Deactivate user account
  async deactivateUser(): Promise<void> {
    return apiClient.post<void>('/users/me/deactivate');
  }

  // Reactivate user account (admin only)
  async reactivateUser(userId: number): Promise<User> {
    return apiClient.post<User>(`/users/${userId}/reactivate`);
  }

  // Search users by username or email
  async searchUsers(query: string): Promise<User[]> {
    return apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const userService = new UserService();
export default userService;
