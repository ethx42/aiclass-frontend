'use client';

import { Box, Flex, Grid, Heading, Text, Spinner, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useEnrollments } from '@/src/lib/hooks/use-enrollments';
import { EnrollmentCard } from './EnrollmentCard';
import { EnrollmentStatus } from '@/src/types/api';
import { useT } from '@/src/lib/i18n/provider';

export function StudentDashboard() {
  const t = useT();
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
          <Callout.Text>{t('class.failedToLoad')}</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  const enrollments = data?.data?.content || [];

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap={{ initial: "4", sm: "6" }}>
        <Box>
          <Heading size={{ initial: "6", sm: "8" }} mb="2">
            {t('dashboard.myClasses')}
          </Heading>
          <Text size={{ initial: "2", sm: "3" }} color="gray">
            {t('dashboard.viewClasses')}
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
            }}
            className="p-6 sm:p-10"
          >
            <Text size={{ initial: "3", sm: "4" }} color="gray">
              {t('dashboard.notEnrolled')}
            </Text>
            <Text size={{ initial: "2", sm: "2" }} color="gray">
              {t('dashboard.contactTeacher')}
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

