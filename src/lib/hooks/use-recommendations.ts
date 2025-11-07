import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsApi } from '../api/recommendations';
import { CreateRecommendationDto, RecommendationFilters } from '@/src/types/api';

export const useRecommendations = (filters: RecommendationFilters) => {
  return useQuery({
    queryKey: ['recommendations', filters],
    queryFn: () => recommendationsApi.getAll(filters),
    enabled: !!(filters.recipientId || filters.classId || filters.audience),
    refetchInterval: 30000, // Refetch every 30 seconds for new recommendations
  });
};

export const useRecommendation = (recommendationId: string) => {
  return useQuery({
    queryKey: ['recommendations', recommendationId],
    queryFn: () => recommendationsApi.getById(recommendationId),
    enabled: !!recommendationId,
  });
};

export const useCreateRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecommendationDto) => recommendationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useDeleteRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recommendationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

