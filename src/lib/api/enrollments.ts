import { apiClient } from './client';
import { ApiResponse, EnrollmentResponse, CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentFilters, PaginatedResponse } from '@/src/types/api';

export const enrollmentsApi = {
  // Get enrollments with filters (at least one filter required)
  getAll: async (filters: EnrollmentFilters): Promise<ApiResponse<PaginatedResponse<EnrollmentResponse>>> => {
    const params = new URLSearchParams();
    
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get(`/enrollments?${params.toString()}`);
    return response.data;
  },

  // Get enrollment by ID
  getById: async (id: string): Promise<ApiResponse<EnrollmentResponse>> => {
    const response = await apiClient.get(`/enrollments/${id}`);
    return response.data;
  },

  // Create enrollment
  create: async (data: CreateEnrollmentDto): Promise<ApiResponse<EnrollmentResponse>> => {
    const response = await apiClient.post('/enrollments', data);
    return response.data;
  },

  // Update enrollment status
  updateStatus: async (id: string, data: UpdateEnrollmentDto): Promise<ApiResponse<EnrollmentResponse>> => {
    const response = await apiClient.patch(`/enrollments/${id}`, data);
    return response.data;
  },

  // Delete enrollment
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/enrollments/${id}`);
    return response.data;
  },
};

