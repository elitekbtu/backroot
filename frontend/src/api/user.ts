import { apiClient } from './client';
import type { 
  User, 
  UserUpdateData, 
  UserCreateData, 
  PasswordChangeData
} from '../types/user';

class UserService {
  // Get current user profile
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  }

  // Get user by ID
  async getUserById(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users/');
  }

  // Update current user profile
  async updateCurrentUser(data: UserUpdateData): Promise<User> {
    // First get the current user to get their ID
    const currentUser = await this.getCurrentUser();
    return apiClient.put<User>(`/users/${currentUser.id}`, data);
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

  // Change password - not implemented in backend
  async changePassword(_data: PasswordChangeData): Promise<void> {
    throw new Error('Password change is not implemented in the backend');
  }

  // Deactivate user account - not implemented in backend
  async deactivateUser(): Promise<void> {
    throw new Error('Account deactivation is not implemented in the backend');
  }

  // Reactivate user account - not implemented in backend
  async reactivateUser(): Promise<void> {
    throw new Error('Account reactivation is not implemented in the backend');
  }

  // Search users by username or email
  async searchUsers(query: string): Promise<User[]> {
    return apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const userService = new UserService();
export default userService;
