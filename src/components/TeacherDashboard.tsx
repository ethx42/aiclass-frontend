'use client';

import { Box, Button, Flex, Grid, Heading, Text, Spinner, Callout } from '@radix-ui/themes';
import { PlusIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useClasses } from '@/src/lib/hooks/use-classes';
import { ClassCard } from './ClassCard';
import { useRouter } from 'next/navigation';
import { useT } from '@/src/lib/i18n/provider';

export function TeacherDashboard() {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useClasses({ teacherId: user?.id, page: 0, size: 50 });

  const handleCreateClass = () => {
    router.push('/class/new');
  };

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

  const classes = data?.data?.content || [];

  return (
    <Box p="6">
      <Flex direction="column" gap="6">
        <Flex justify="between" align="center">
          <Box>
            <Heading size="8" mb="2">
              {t('dashboard.myClasses')}
            </Heading>
            <Text size="3" color="gray">
              {t('dashboard.manageClasses')}
            </Text>
          </Box>
          <Flex gap="3">
            <Button size="3" variant="soft" onClick={() => router.push('/subjects')}>
              {t('dashboard.manageSubjects')}
            </Button>
            <Button size="3" onClick={handleCreateClass}>
              <PlusIcon /> {t('dashboard.createClass')}
            </Button>
          </Flex>
        </Flex>

        {classes.length === 0 ? (
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
              {t('dashboard.noClassesYet')}
            </Text>
            <Button size="2" variant="soft" onClick={handleCreateClass}>
              <PlusIcon /> {t('dashboard.createFirstClass')}
            </Button>
          </Flex>
        ) : (
          <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </Grid>
        )}
      </Flex>
    </Box>
  );
}

