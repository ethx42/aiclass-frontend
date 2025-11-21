import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsApi } from "../api/recommendations";

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
      // Invalidate grades query to refetch with updated recommendation
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
};
