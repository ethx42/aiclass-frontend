'use client';

import { Box, Flex, Grid, Heading, Text, Spinner, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useEnrollments } from '@/src/lib/hooks/use-enrollments';
import { EnrollmentCard } from './EnrollmentCard';
import { EnrollmentStatus } from '@/src/types/api';

export function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useEnrollments({
    studentId: user?.id,
    status: EnrollmentStatus.ACTIVE,
    page: 0,
    size: 50,
  });

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p="4">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Failed to load enrollments. Please try again.</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  const enrollments = data?.data?.content || [];

  return (
    <Box p="6">
      <Flex direction="column" gap="6">
        <Box>
          <Heading size="8" mb="2">
            My Classes
          </Heading>
          <Text size="3" color="gray">
            View your enrolled classes and track your progress
          </Text>
        </Box>

        {enrollments.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="4"
            style={{
              minHeight: '300px',
              border: '2px dashed var(--gray-6)',
              borderRadius: 'var(--radius-3)',
              padding: '40px',
            }}
          >
            <Text size="4" color="gray">
              You are not enrolled in any classes yet
            </Text>
            <Text size="2" color="gray">
              Contact your teacher to be added to a class
            </Text>
          </Flex>
        ) : (
          <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
            {enrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </Grid>
        )}
      </Flex>
    </Box>
  );
}

