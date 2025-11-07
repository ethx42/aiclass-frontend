import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentsApi } from '../api/enrollments';
import { CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentFilters } from '@/src/types/api';

export const useEnrollments = (filters: EnrollmentFilters) => {
  return useQuery({
    queryKey: ['enrollments', filters],
    queryFn: () => enrollmentsApi.getAll(filters),
    enabled: !!(filters.classId || filters.studentId || filters.status),
  });
};

export const useEnrollment = (enrollmentId: string) => {
  return useQuery({
    queryKey: ['enrollments', enrollmentId],
    queryFn: () => enrollmentsApi.getById(enrollmentId),
    enabled: !!enrollmentId,
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnrollmentDto) => enrollmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateEnrollmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnrollmentDto }) =>
      enrollmentsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};

export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

