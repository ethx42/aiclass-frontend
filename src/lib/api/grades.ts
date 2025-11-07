import { apiClient } from './client';
import { ApiResponse, GradeResponse, CreateGradeDto, UpdateGradeDto, GradeFilters, PaginatedResponse } from '@/src/types/api';

export const gradesApi = {
  // Get grades with filters (classId OR studentId required)
  getAll: async (filters: GradeFilters): Promise<ApiResponse<PaginatedResponse<GradeResponse>>> => {
    const params = new URLSearchParams();
    
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.studentId) params.append('studentId', filters.studentId);

    const response = await apiClient.get(`/grades?${params.toString()}`);
    return response.data;
  },

  // Get grade by ID
  getById: async (id: string): Promise<ApiResponse<GradeResponse>> => {
    const response = await apiClient.get(`/grades/${id}`);
    return response.data;
  },

  // Create grade
  create: async (data: CreateGradeDto): Promise<ApiResponse<GradeResponse>> => {
    const response = await apiClient.post('/grades', data);
    return response.data;
  },

  // Update grade
  update: async (id: string, data: UpdateGradeDto): Promise<ApiResponse<GradeResponse>> => {
    const response = await apiClient.put(`/grades/${id}`, data);
    return response.data;
  },

  // Delete grade
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/grades/${id}`);
    return response.data;
  },
};

