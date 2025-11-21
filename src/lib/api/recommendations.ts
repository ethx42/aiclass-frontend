import { apiClient } from './client';
import { ApiResponse, AiRecommendationResponse, CreateRecommendationDto, RecommendationFilters, PaginatedResponse } from '@/src/types/api';

export const recommendationsApi = {
  // Get recommendations with filters (at least one filter required)
  getAll: async (filters: RecommendationFilters): Promise<ApiResponse<PaginatedResponse<AiRecommendationResponse>>> => {
    const params = new URLSearchParams();
    
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.recipientId) params.append('recipientId', filters.recipientId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.audience) params.append('audience', filters.audience);

    const response = await apiClient.get(`/recommendations?${params.toString()}`);
    return response.data;
  },

  // Get recommendation by ID
  getById: async (id: string): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.get(`/recommendations/${id}`);
    return response.data;
  },

  // Create recommendation
  create: async (data: CreateRecommendationDto): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post('/recommendations', data);
    return response.data;
  },

  // Delete recommendation
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/recommendations/${id}`);
    return response.data;
  },

  // Generate teacher recommendation for class
  generateClassRecommendation: async (classId: string, forceRegenerate: boolean = false): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(`/recommendations/classes/${classId}/generate-teacher-recommendation?forceRegenerate=${forceRegenerate}`);
    return response.data;
  },

  // Generate teacher recommendation for student in class
  generateStudentRecommendation: async (classId: string, studentId: string, forceRegenerate: boolean = false): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(`/recommendations/classes/${classId}/students/${studentId}/generate-teacher-recommendation?forceRegenerate=${forceRegenerate}`);
    return response.data;
  },

  // Generate AI recommendation for grade
  generateGradeRecommendation: async (gradeId: string): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(`/grades/${gradeId}/generate-recommendation`);
    return response.data;
  },
};

