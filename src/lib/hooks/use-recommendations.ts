import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsApi } from "../api/recommendations";
import { RecommendationFilters } from "@/src/types/api";

export const useRecommendations = (filters: RecommendationFilters) => {
  // Create a stable query key from filters to avoid unnecessary re-renders
  const queryKey = [
    "recommendations",
    filters.recipientId,
    filters.classId,
    filters.audience,
    filters.page,
    filters.size,
  ];

  return useQuery({
    queryKey,
    queryFn: () => recommendationsApi.getAll(filters),
    enabled: !!(filters.recipientId || filters.classId || filters.audience),
    // Removed refetchInterval to prevent excessive API calls
    // If needed, can be re-enabled with a longer interval or made configurable
  });
};

export const useGenerateClassRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      forceRegenerate,
    }: {
      classId: string;
      forceRegenerate?: boolean;
    }) =>
      recommendationsApi.generateClassRecommendation(
        classId,
        forceRegenerate || false
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
};

export const useGenerateStudentRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
      forceRegenerate,
    }: {
      classId: string;
      studentId: string;
      forceRegenerate?: boolean;
    }) =>
      recommendationsApi.generateStudentRecommendation(
        classId,
        studentId,
        forceRegenerate || false
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
};

export const useGenerateGradeRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gradeId: string) =>
      recommendationsApi.generateGradeRecommendation(gradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
};
