import { apiClient } from './apiClient';
import { LoginCredentials, LoginResponse, User } from '../../types/auth.types';

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Log out user from backend
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (e) {
      console.warn('Backend logout request failed (continuing local logout):', e);
    }
  },

  /**
   * Fetch connected user data by ID
   */
  async getUserById(userId: number, token?: string): Promise<User> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const response = await apiClient.get<User>(`/users/${userId}`, config);
    return response.data;
  },

  /**
   * Check if account is active
   */
  async checkAccountStatus(userId: number, token?: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId, token);
      return user.status === 'Active' || !user.status;
    } catch (e) {
      console.error('Failed to verify account status:', e);
      return false;
    }
  },
};
