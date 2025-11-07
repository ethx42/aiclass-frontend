import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjects';
import { CreateSubjectDto, UpdateSubjectDto } from '@/src/types/api';

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll(),
    staleTime: 5 * 60 * 1000, // Subjects don't change often, cache for 5 minutes
  });
};

export const useSubject = (subjectId: string) => {
  return useQuery({
    queryKey: ['subjects', subjectId],
    queryFn: () => subjectsApi.getById(subjectId),
    enabled: !!subjectId,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubjectDto) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectDto }) =>
      subjectsApi.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects', variables.id] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

