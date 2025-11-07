'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Select,
  Button,
  Callout,
} from '@radix-ui/themes';
import { ArrowLeftIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useSubjects } from '@/src/lib/hooks/use-subjects';
import { useCreateClass } from '@/src/lib/hooks/use-classes';
import { Semester } from '@/src/types/api';

export default function CreateClassPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const createClass = useCreateClass();

  const [formData, setFormData] = useState({
    subjectId: '',
    year: new Date().getFullYear(),
    semester: Semester.SPRING,
    groupCode: '',
    schedule: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      await createClass.mutateAsync({
        ...formData,
        teacherId: user.id,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create class';
      setError(errorMessage);
    }
  };

  const subjects = subjectsData?.data?.content || [];

  return (
    <Box p="6">
      <Box mb="6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon /> Back
        </Button>
      </Box>

      <Box style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Card size="4">
          <Flex direction="column" gap="4">
            <Heading size="6">Create New Class</Heading>

            {error && (
              <Callout.Root color="red">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                {/* Subject Selection */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Subject *
                  </Text>
                  <Select.Root
                    value={formData.subjectId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subjectId: value })
                    }
                    required
                  >
                    <Select.Trigger
                      placeholder="Select a subject"
                      style={{ width: '100%' }}
                    />
                    <Select.Content>
                      {loadingSubjects ? (
                        <Select.Item value="loading">Loading...</Select.Item>
                      ) : (
                        subjects.map((subject) => (
                          <Select.Item key={subject.id} value={subject.id}>
                            {subject.code} - {subject.name}
                          </Select.Item>
                        ))
                      )}
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Year */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Year *
                  </Text>
                  <TextField.Root
                    type="number"
                    value={formData.year.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, year: parseInt(e.target.value) })
                    }
                    required
                    min="2020"
                    max="2030"
                  />
                </Box>

                {/* Semester */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Semester *
                  </Text>
                  <Select.Root
                    value={formData.semester}
                    onValueChange={(value) =>
                      setFormData({ ...formData, semester: value as Semester })
                    }
                    required
                  >
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value={Semester.SPRING}>Spring</Select.Item>
                      <Select.Item value={Semester.SUMMER}>Summer</Select.Item>
                      <Select.Item value={Semester.FALL}>Fall</Select.Item>
                      <Select.Item value={Semester.WINTER}>Winter</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Group Code */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Group Code *
                  </Text>
                  <TextField.Root
                    placeholder="e.g., A, B, 101"
                    value={formData.groupCode}
                    onChange={(e) =>
                      setFormData({ ...formData, groupCode: e.target.value })
                    }
                    required
                  />
                </Box>

                {/* Schedule */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Schedule (Optional)
                  </Text>
                  <TextField.Root
                    placeholder="e.g., Mon/Wed/Fri 10:00-11:30"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                  />
                </Box>

                <Flex gap="3" mt="2">
                  <Button
                    type="button"
                    variant="soft"
                    color="gray"
                    style={{ flex: 1 }}
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={{ flex: 1 }}
                    disabled={createClass.isPending}
                  >
                    {createClass.isPending ? 'Creating...' : 'Create Class'}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}

