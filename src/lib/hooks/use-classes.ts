import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../api/classes';
import { CreateClassDto, UpdateClassDto, ClassFilters } from '@/src/types/api';

export const useClasses = (filters?: ClassFilters) => {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesApi.getAll(filters),
  });
};

export const useClass = (classId: string) => {
  return useQuery({
    queryKey: ['classes', classId],
    queryFn: () => classesApi.getById(classId),
    enabled: !!classId,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClassDto) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassDto }) =>
      classesApi.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes', variables.id] });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

