"use client";

import {
  Box,
  Card,
  Flex,
  Table,
  Text,
  Badge,
  Spinner,
  Callout,
} from "@radix-ui/themes";
import {
  InfoCircledIcon,
  FileTextIcon,
  BookmarkIcon,
  StarIcon,
  BarChartIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { useGrades } from "@/src/lib/hooks/use-grades";
import { AssessmentKind } from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";

interface StudentClassViewProps {
  classId: string;
}

const getAssessmentColor = (kind: AssessmentKind) => {
  switch (kind) {
    case AssessmentKind.EXAM:
      return "red";
    case AssessmentKind.QUIZ:
      return "blue";
    case AssessmentKind.HOMEWORK:
      return "green";
    case AssessmentKind.PROJECT:
      return "purple";
    default:
      return "gray";
  }
};

const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return "green";
  if (percentage >= 80) return "blue";
  if (percentage >= 70) return "orange";
  return "red";
};

export function StudentClassView({ classId }: StudentClassViewProps) {
  const t = useT();
  const user = useAuthStore((state) => state.user);

  // Backend only allows filtering by studentId for students, not both
  const {
    data: gradesData,
    isLoading,
    error,
  } = useGrades({
    studentId: user?.id,
    page: 0,
    size: 1000, // Get all grades to filter by classId in frontend
  });

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "50vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={{ initial: "4", sm: "6" }}>
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>{t("class.failedToLoad")}</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  // Get all grades and filter by this specific class
  const allGrades = gradesData?.data?.content || [];
  const grades = allGrades.filter((grade) => grade.classId === classId);

  // Calculate overall average
  const overallAverage =
    grades.length > 0
      ? (
          grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
          grades.length
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
    <Box p={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap={{ initial: "4", sm: "6" }}>
        {/* Summary Card */}
        <Card size={{ initial: "2", sm: "4" }}>
          <Flex direction="column" gap="3">
            <Text size={{ initial: "4", sm: "5" }} weight="bold">
              {t("grades.performanceSummary")}
            </Text>
            <Flex gap={{ initial: "4", sm: "6" }} wrap="wrap">
              <Box>
                <Text size={{ initial: "2", sm: "2" }} color="gray" mb="1">
                  {t("grades.totalGrades")}&nbsp;
                </Text>
                <Text size={{ initial: "5", sm: "6" }} weight="bold">
                  {grades.length}
                </Text>
              </Box>
              {overallAverage && (
                <Box>
                  <Text size={{ initial: "2", sm: "2" }} color="gray" mb="1">
                    {t("grades.overallAverage")}&nbsp;
                  </Text>
                  <Badge
                    size={{ initial: "2", sm: "3" }}
                    color={getGradeColor(parseFloat(overallAverage))}
                    className="text-base sm:text-xl px-3 py-1.5 sm:px-4 sm:py-2"
                  >
                    {overallAverage}%
                  </Badge>
                </Box>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Grades Table */}
        <Card size={{ initial: "2", sm: "4" }}>
          <Flex direction="column" gap="4">
            <Text size={{ initial: "4", sm: "5" }} weight="bold">
              {t("grades.myGrades")}
            </Text>

            {grades.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="3"
                className="p-6 sm:p-10"
              >
                <Text color="gray" size={{ initial: "2", sm: "3" }}>
                  {t("grades.noGradesRecorded")}
                </Text>
                <Text size={{ initial: "2", sm: "2" }} color="gray">
                  {t("grades.gradesWillAppear")}
                </Text>
              </Flex>
            ) : (
              <Box style={{ overflowX: "auto" }}>
                <Table.Root className="premium-table">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <FileTextIcon width="14" height="14" />
                          {t("grades.assessment")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <BookmarkIcon width="14" height="14" />
                          {t("grades.type")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <StarIcon width="14" height="14" />
                          {t("grades.score")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <BarChartIcon width="14" height="14" />
                          {t("grades.percentage")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <CalendarIcon width="14" height="14" />
                          {t("grades.date")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {grades
                      .sort(
                        (a, b) =>
                          new Date(b.gradedAt).getTime() -
                          new Date(a.gradedAt).getTime()
                      )
                      .map((grade) => {
                        const percentage = (
                          (grade.score / grade.maxScore) *
                          100
                        ).toFixed(1);
                        return (
                          <Table.Row key={grade.id}>
                            <Table.Cell>
                              <Flex align="center" gap="2" className="table-cell-with-icon">
                                <Box className="table-cell-icon">
                                  <FileTextIcon width="12" height="12" />
                                </Box>
                                <Text weight="bold" style={{ fontWeight: 600 }}>
                                  {grade.assessmentName}
                                </Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                color={getAssessmentColor(grade.assessmentKind)}
                                style={{
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {t(
                                  `grades.${grade.assessmentKind.toLowerCase()}`
                                )}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Flex align="center" gap="2">
                                <Text weight="medium" style={{ fontWeight: 500 }}>
                                  {grade.score} / {grade.maxScore}
                                </Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                color={getGradeColor(parseFloat(percentage))}
                                style={{
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                {percentage}%
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Flex align="center" gap="2" className="table-cell-with-icon">
                                <Box className="table-cell-icon">
                                  <CalendarIcon width="12" height="12" />
                                </Box>
                                <Text size="2" color="gray">
                                  {new Date(grade.gradedAt).toLocaleDateString()}
                                </Text>
                              </Flex>
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
          <Card size={{ initial: "2", sm: "4" }}>
            <Flex direction="column" gap="4">
              <Text size={{ initial: "4", sm: "5" }} weight="bold">
                {t("grades.breakdownByType")}
              </Text>

              <Flex gap={{ initial: "3", sm: "4" }} wrap="wrap">
                {Object.entries(gradesByType).map(([type, typeGrades]) => {
                  const avg = (
                    typeGrades.reduce(
                      (sum, g) => sum + (g.score / g.maxScore) * 100,
                      0
                    ) / typeGrades.length
                  ).toFixed(1);

                  return (
                    <Card
                      key={type}
                      size={{ initial: "1", sm: "2" }}
                      className="min-w-[120px] sm:min-w-[150px]"
                    >
                      <Flex direction="column" gap="2">
                        <Badge
                          color={getAssessmentColor(type as AssessmentKind)}
                          size={{ initial: "1", sm: "2" }}
                        >
                          {t(`grades.${type.toLowerCase()}`)}
                        </Badge>
                        <Text size={{ initial: "2", sm: "2" }} color="gray">
                          {typeGrades.length}{" "}
                          {typeGrades.length !== 1
                            ? t("grades.grades")
                            : t("grades.grade")}
                        </Text>
                        <Text size={{ initial: "4", sm: "5" }} weight="bold">
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
