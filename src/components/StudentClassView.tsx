'use client';

import {
  Box,
  Card,
  Flex,
  Table,
  Text,
  Badge,
  Spinner,
  Callout,
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useGrades } from '@/src/lib/hooks/use-grades';
import { AssessmentKind } from '@/src/types/api';

interface StudentClassViewProps {
  classId: string;
}

const getAssessmentColor = (kind: AssessmentKind) => {
  switch (kind) {
    case AssessmentKind.EXAM:
      return 'red';
    case AssessmentKind.QUIZ:
      return 'blue';
    case AssessmentKind.HOMEWORK:
      return 'green';
    case AssessmentKind.PROJECT:
      return 'purple';
    default:
      return 'gray';
  }
};

const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return 'green';
  if (percentage >= 80) return 'blue';
  if (percentage >= 70) return 'orange';
  return 'red';
};

export function StudentClassView({ classId }: StudentClassViewProps) {
  const user = useAuthStore((state) => state.user);
  const { data: gradesData, isLoading, error } = useGrades({
    classId,
    studentId: user?.id,
    page: 0,
    size: 100,
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
      <Box p="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Failed to load grades. Please try again.</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  const grades = gradesData?.data?.content || [];

  // Calculate overall average
  const overallAverage =
    grades.length > 0
      ? (
          grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
        ).toFixed(1)
      : null;

  // Group by assessment type
  const gradesByType = grades.reduce((acc, grade) => {
    if (!acc[grade.assessmentKind]) {
      acc[grade.assessmentKind] = [];
    }
    acc[grade.assessmentKind].push(grade);
    return acc;
  }, {} as Record<AssessmentKind, typeof grades>);

  return (
    <Box p="6">
      <Flex direction="column" gap="6">
        {/* Summary Card */}
        <Card>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              Performance Summary
            </Text>
            <Flex gap="6" wrap="wrap">
              <Box>
                <Text size="2" color="gray" mb="1">
                  Total Grades
                </Text>
                <Text size="6" weight="bold">
                  {grades.length}
                </Text>
              </Box>
              {overallAverage && (
                <Box>
                  <Text size="2" color="gray" mb="1">
                    Overall Average
                  </Text>
                  <Badge
                    size="3"
                    color={getGradeColor(parseFloat(overallAverage))}
                    style={{ fontSize: '20px', padding: '8px 16px' }}
                  >
                    {overallAverage}%
                  </Badge>
                </Box>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Grades Table */}
        <Card>
          <Flex direction="column" gap="4">
            <Text size="5" weight="bold">
              My Grades
            </Text>

            {grades.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="3"
                style={{ padding: '40px' }}
              >
                <Text color="gray">No grades recorded yet</Text>
                <Text size="2" color="gray">
                  Grades will appear here once your teacher adds them
                </Text>
              </Flex>
            ) : (
              <Box style={{ overflowX: 'auto' }}>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Percentage</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {grades
                      .sort(
                        (a, b) =>
                          new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
                      )
                      .map((grade) => {
                        const percentage = ((grade.score / grade.maxScore) * 100).toFixed(1);
                        return (
                          <Table.Row key={grade.id}>
                            <Table.Cell>
                              <Text weight="bold">{grade.assessmentName}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={getAssessmentColor(grade.assessmentKind)}>
                                {grade.assessmentKind}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Text>
                                {grade.score} / {grade.maxScore}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={getGradeColor(parseFloat(percentage))}>
                                {percentage}%
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2" color="gray">
                                {new Date(grade.gradedAt).toLocaleDateString()}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Flex>
        </Card>

        {/* Breakdown by Assessment Type */}
        {Object.keys(gradesByType).length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">
                Breakdown by Type
              </Text>

              <Flex gap="4" wrap="wrap">
                {Object.entries(gradesByType).map(([type, typeGrades]) => {
                  const avg = (
                    typeGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
                    typeGrades.length
                  ).toFixed(1);

                  return (
                    <Card key={type} style={{ minWidth: '150px' }}>
                      <Flex direction="column" gap="2">
                        <Badge color={getAssessmentColor(type as AssessmentKind)}>
                          {type}
                        </Badge>
                        <Text size="2" color="gray">
                          {typeGrades.length} grade{typeGrades.length !== 1 ? 's' : ''}
                        </Text>
                        <Text size="5" weight="bold">
                          {avg}%
                        </Text>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}

