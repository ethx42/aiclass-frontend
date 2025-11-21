import { apiClient } from "./client";
import { ApiResponse, AiRecommendationResponse } from "@/src/types/api";

export const recommendationsApi = {
  // Generate teacher recommendation for class
  generateClassRecommendation: async (
    classId: string,
    forceRegenerate: boolean = false
  ): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(
      `/recommendations/classes/${classId}/generate-teacher-recommendation?forceRegenerate=${forceRegenerate}`
    );
    return response.data;
  },

  // Generate teacher recommendation for student in class
  generateStudentRecommendation: async (
    classId: string,
    studentId: string,
    forceRegenerate: boolean = false
  ): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(
      `/recommendations/classes/${classId}/students/${studentId}/generate-teacher-recommendation?forceRegenerate=${forceRegenerate}`
    );
    return response.data;
  },

  // Generate recommendation for a specific grade/assessment
  generateGradeRecommendation: async (
    gradeId: string
  ): Promise<ApiResponse<AiRecommendationResponse>> => {
    const response = await apiClient.post(
      `/grades/${gradeId}/generate-recommendation`
    );
    return response.data;
  },
};
