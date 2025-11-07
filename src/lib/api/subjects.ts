import { apiClient } from "./client";
import {
  ApiResponse,
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  PaginatedResponse,
} from "@/src/types/api";

export const subjectsApi = {
  // Get all subjects
  getAll: async (): Promise<ApiResponse<PaginatedResponse<Subject>>> => {
    const response = await apiClient.get("/subjects");
    return response.data;
  },

  // Get subject by ID
  getById: async (id: string): Promise<ApiResponse<Subject>> => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data;
  },

  // Get subject by code
  getByCode: async (code: string): Promise<ApiResponse<Subject>> => {
    const response = await apiClient.get(`/subjects/code/${code}`);
    return response.data;
  },

  // Create subject
  create: async (data: CreateSubjectDto): Promise<ApiResponse<Subject>> => {
    const response = await apiClient.post("/subjects", data);
    return response.data;
  },

  // Update subject
  update: async (
    id: string,
    data: UpdateSubjectDto
  ): Promise<ApiResponse<Subject>> => {
    const response = await apiClient.put(`/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/subjects/${id}`);
    return response.data;
  },
};
