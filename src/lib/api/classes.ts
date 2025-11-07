import { apiClient } from './client';
import { ApiResponse, ClassResponse, CreateClassDto, UpdateClassDto, ClassFilters, PaginatedResponse } from '@/src/types/api';

export const classesApi = {
  // Get all classes with optional filters
  getAll: async (filters?: ClassFilters): Promise<ApiResponse<PaginatedResponse<ClassResponse>>> => {
    const params = new URLSearchParams();
    
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.semester) params.append('semester', filters.semester);

    const response = await apiClient.get(`/classes?${params.toString()}`);
    return response.data;
  },

  // Get class by ID
  getById: async (id: string): Promise<ApiResponse<ClassResponse>> => {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
  },

  // Create class
  create: async (data: CreateClassDto): Promise<ApiResponse<ClassResponse>> => {
    const response = await apiClient.post('/classes', data);
    return response.data;
  },

  // Update class
  update: async (id: string, data: UpdateClassDto): Promise<ApiResponse<ClassResponse>> => {
    const response = await apiClient.put(`/classes/${id}`, data);
    return response.data;
  },

  // Delete class
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/classes/${id}`);
    return response.data;
  },
};

