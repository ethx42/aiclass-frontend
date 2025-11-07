import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi } from '../api/grades';
import { CreateGradeDto, UpdateGradeDto, GradeFilters } from '@/src/types/api';

export const useGrades = (filters: GradeFilters) => {
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: () => gradesApi.getAll(filters),
    enabled: !!(filters.classId || filters.studentId),
  });
};

export const useGrade = (gradeId: string) => {
  return useQuery({
    queryKey: ['grades', gradeId],
    queryFn: () => gradesApi.getById(gradeId),
    enabled: !!gradeId,
  });
};

export const useCreateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradeDto) => gradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeDto }) =>
      gradesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
};

