import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsApi } from "../api/recommendations";
import { RecommendationFilters } from "@/src/types/api";

export const useRecommendations = (filters: RecommendationFilters) => {
  return useQuery({
    queryKey: ["recommendations", filters],
    queryFn: () => recommendationsApi.getAll(filters),
    enabled: !!(filters.recipientId || filters.classId || filters.audience),
    refetchInterval: 30000, // Refetch every 30 seconds for new recommendations
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
