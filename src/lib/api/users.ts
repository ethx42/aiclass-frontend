import { apiClient } from './client';
import { ApiResponse, User, CreateUserDto, UpdateUserDto, PaginatedResponse } from '@/src/types/api';

export const usersApi = {
  // Get all users (with optional search and role filter)
  getAll: async (query?: string, role?: string): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (role) params.append('role', role);
    const queryString = params.toString();
    const response = await apiClient.get(`/users${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  // Search users by query (name, email, etc.) - alias for getAll with search
  search: async (query: string, role?: string): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return usersApi.getAll(query, role);
  },

  // Get user by ID
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Get user by Auth User ID
  getByAuthUserId: async (authUserId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/auth/${authUserId}`);
    return response.data;
  },

  // Get user by email
  getByEmail: async (email: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/email/${email}`);
    return response.data;
  },

  // Create user
  create: async (data: CreateUserDto): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UpdateUserDto): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

