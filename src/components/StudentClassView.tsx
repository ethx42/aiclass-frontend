"use client";

import { useState } from "react";
import {
  Box,
  Card,
  Flex,
  Grid,
  Table,
  Text,
  Badge,
  Spinner,
  Callout,
  Tooltip,
  Button,
  IconButton,
  Dialog,
} from "@radix-ui/themes";
import {
  InfoCircledIcon,
  FileTextIcon,
  BookmarkIcon,
  StarIcon,
  BarChartIcon,
  CalendarIcon,
  MagicWandIcon,
  ChevronDownIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { useGrades } from "@/src/lib/hooks/use-grades";
import {
  AssessmentKind,
  RecommendationAudience,
  GradeResponse,
} from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";
import {
  useRecommendations,
  useGenerateStudentRecommendation,
  useGenerateGradeRecommendation,
} from "@/src/lib/hooks/use-recommendations";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

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

  // AI Recommendations
  const { data: recommendationsData, refetch: refetchRecommendations } =
    useRecommendations({
      classId,
      recipientId: user?.id,
      page: 0,
      size: 100,
    });
  const generateStudentRecommendation = useGenerateStudentRecommendation();
  const generateGradeRecommendation = useGenerateGradeRecommendation();

  // Filter for student recommendations for this class (audience STUDENT)
  const studentRecommendations =
    recommendationsData?.data?.content?.filter((r) => {
      const audienceMatch =
        r.audience?.toUpperCase() ===
        RecommendationAudience.STUDENT.toUpperCase();
      const classMatch = r.classId === classId;
      const recipientMatch = r.recipientId === user?.id;
      return audienceMatch && classMatch && recipientMatch;
    }) || [];

  const [isRecommendationsExpanded, setIsRecommendationsExpanded] =
    useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeResponse | null>(
    null
  );
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  // Get recommendation for a specific assessment/grade
  const getAssessmentRecommendation = (grade: GradeResponse) => {
    return studentRecommendations.find((r) => {
      // Check if recommendation is for this specific grade by gradeId (directly in response or in metadata)
      const gradeIdMatch =
        r.gradeId === grade.id || r.metadata?.gradeId === grade.id;
      // Fallback: check by assessment kind and name in metadata
      const assessmentMatch =
        r.metadata?.assessmentKind === grade.assessmentKind &&
        r.metadata?.assessmentName === grade.assessmentName;
      return gradeIdMatch || assessmentMatch;
    });
  };

  const handleOpenAssessmentModal = (grade: GradeResponse) => {
    setSelectedGrade(grade);
    setIsAssessmentModalOpen(true);
  };

  const handleGenerateAssessmentRecommendation = async (
    grade: GradeResponse
  ) => {
    if (!user?.id) return;

    try {
      // Use the grade-specific endpoint to generate recommendation for this assessment
      await generateGradeRecommendation.mutateAsync(grade.id);
      // React Query will automatically refetch after invalidation
      // But we'll also manually refetch to ensure immediate update
      await refetchRecommendations();
      toast.success(t("recommendations.studentRecommendationGenerated"));
    } catch (err) {
      console.error("Failed to generate recommendation:", err);
      toast.error(t("recommendations.failedToGenerate"));
    }
  };

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

  const handleGenerateStudentRecommendation = async () => {
    if (!user?.id) return;

    try {
      await generateStudentRecommendation.mutateAsync({
        classId,
        studentId: user.id,
        forceRegenerate: false,
      });
      // Refetch recommendations to show the newly generated one
      await refetchRecommendations();
      toast.success(t("recommendations.studentRecommendationGenerated"));
    } catch (err) {
      console.error("Failed to generate recommendation:", err);
      toast.error(t("recommendations.failedToGenerate"));
    }
  };

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
                      <Table.ColumnHeaderCell style={{ width: "80px" }}>
                        <Flex align="center" gap="2">
                          <MagicWandIcon width="14" height="14" />
                          {t("recommendations.aiRecommendations")}
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
                              {grade.metadata?.assessmentContent ? (
                                <Tooltip
                                  content={grade.metadata.assessmentContent}
                                >
                                  <Flex
                                    align="center"
                                    gap="2"
                                    className="table-cell-with-icon"
                                    style={{ cursor: "help" }}
                                  >
                                    <Box className="table-cell-icon">
                                      <FileTextIcon width="12" height="12" />
                                    </Box>
                                    <Text
                                      weight="bold"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {grade.assessmentName}
                                    </Text>
                                  </Flex>
                                </Tooltip>
                              ) : (
                                <Flex
                                  align="center"
                                  gap="2"
                                  className="table-cell-with-icon"
                                >
                                  <Box className="table-cell-icon">
                                    <FileTextIcon width="12" height="12" />
                                  </Box>
                                  <Text
                                    weight="bold"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {grade.assessmentName}
                                  </Text>
                                </Flex>
                              )}
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
                                <Text
                                  weight="medium"
                                  style={{ fontWeight: 500 }}
                                >
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
                              <Flex
                                align="center"
                                gap="2"
                                className="table-cell-with-icon"
                              >
                                <Box className="table-cell-icon">
                                  <CalendarIcon width="12" height="12" />
                                </Box>
                                <Text size="2" color="gray">
                                  {new Date(
                                    grade.gradedAt
                                  ).toLocaleDateString()}
                                </Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              {(() => {
                                const hasRecommendation =
                                  getAssessmentRecommendation(grade);
                                return (
                                  <Tooltip
                                    content={
                                      hasRecommendation
                                        ? t(
                                            "recommendations.viewRecommendation"
                                          ) ||
                                          "View AI recommendation for this assessment"
                                        : t(
                                            "recommendations.generateAssessmentRecommendation"
                                          ) ||
                                          "Generate AI recommendation for this assessment"
                                    }
                                  >
                                    <IconButton
                                      size="1"
                                      variant="ghost"
                                      onClick={() =>
                                        handleOpenAssessmentModal(grade)
                                      }
                                      style={{
                                        color: hasRecommendation
                                          ? "var(--blue-9)"
                                          : "var(--accent-9)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {hasRecommendation ? (
                                        <InfoCircledIcon
                                          width="14"
                                          height="14"
                                        />
                                      ) : (
                                        <MagicWandIcon width="14" height="14" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                );
                              })()}
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

        {/* Assessment Recommendation Modal */}
        <Dialog.Root
          open={isAssessmentModalOpen}
          onOpenChange={setIsAssessmentModalOpen}
        >
          <Dialog.Content style={{ maxWidth: 650 }}>
            {selectedGrade && (
              <>
                <Dialog.Title>{selectedGrade.assessmentName}</Dialog.Title>
                <Dialog.Description size="2" mb="3">
                  {t("recommendations.assessmentRecommendationDescription") ||
                    "Assessment details and AI recommendations"}
                </Dialog.Description>

                <Flex direction="column" gap="3">
                  {/* Assessment Information - Compact Grid */}
                  <Card size="2" style={{ padding: "12px" }}>
                    <Grid columns="2" gap="3">
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.type")}
                        </Text>
                        <Badge
                          color={getAssessmentColor(
                            selectedGrade.assessmentKind
                          )}
                          style={{
                            fontWeight: 600,
                            fontSize: "10px",
                            padding: "3px 8px",
                          }}
                        >
                          {t(
                            `grades.${selectedGrade.assessmentKind.toLowerCase()}`
                          )}
                        </Badge>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.date")}
                        </Text>
                        <Text size="2" weight="medium">
                          {new Date(
                            selectedGrade.gradedAt
                          ).toLocaleDateString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.score")}
                        </Text>
                        <Text size="2" weight="bold">
                          {selectedGrade.score} / {selectedGrade.maxScore}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.percentage")}
                        </Text>
                        <Badge
                          color={getGradeColor(
                            parseFloat(
                              (
                                (selectedGrade.score / selectedGrade.maxScore) *
                                100
                              ).toFixed(1)
                            )
                          )}
                          style={{
                            fontWeight: 600,
                            fontSize: "10px",
                            padding: "3px 8px",
                          }}
                        >
                          {(
                            (selectedGrade.score / selectedGrade.maxScore) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </Box>
                    </Grid>
                    {(selectedGrade.metadata?.assessmentContent ||
                      selectedGrade.metadata?.feedback ||
                      selectedGrade.metadata?.teacherFeedback) && (
                      <Box
                        mt="3"
                        pt="3"
                        style={{ borderTop: "1px solid var(--gray-4)" }}
                      >
                        {selectedGrade.metadata?.assessmentContent && (
                          <Box mb="2">
                            <Text size="1" color="gray" mb="1" weight="medium">
                              {t("grades.assessmentContent")}:&nbsp;
                            </Text>
                            <Text size="2" style={{ lineHeight: "1.5" }}>
                              {selectedGrade.metadata.assessmentContent}
                            </Text>
                          </Box>
                        )}
                        {(selectedGrade.metadata?.feedback ||
                          selectedGrade.metadata?.teacherFeedback) && (
                          <Box>
                            <Text size="1" color="gray" mb="1" weight="medium">
                              {t("grades.feedback")}:&nbsp;
                            </Text>
                            <Text size="2" style={{ lineHeight: "1.5" }}>
                              {selectedGrade.metadata.feedback ||
                                selectedGrade.metadata.teacherFeedback}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Card>

                  {/* AI Recommendation */}
                  <Card size="2" style={{ padding: "12px" }}>
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <MagicWandIcon
                          width="16"
                          height="16"
                          style={{ color: "var(--accent-9)" }}
                        />
                        <Text size="3" weight="bold">
                          {t("recommendations.aiRecommendations")}
                        </Text>
                      </Flex>

                      {generateGradeRecommendation.isPending ? (
                        <Flex align="center" justify="center" py="3">
                          <Spinner size="2" />
                          <Text size="2" color="gray" ml="2">
                            {t("recommendations.generating")}
                          </Text>
                        </Flex>
                      ) : getAssessmentRecommendation(selectedGrade) ? (
                        <Box
                          style={{
                            fontSize: "var(--font-size-2)",
                            lineHeight: "1.6",
                            color: "var(--gray-11)",
                          }}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <Text
                                  as="p"
                                  size="2"
                                  mb="2"
                                  style={{
                                    display: "block",
                                    color: "var(--gray-11)",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  {children}
                                </Text>
                              ),
                              strong: ({ children }) => (
                                <Text
                                  weight="bold"
                                  style={{ color: "var(--gray-12)" }}
                                >
                                  {children}
                                </Text>
                              ),
                              ul: ({ children }) => (
                                <ul
                                  style={{
                                    marginBottom: "10px",
                                    paddingLeft: "18px",
                                    listStyle: "disc",
                                    display: "block",
                                    color: "var(--gray-11)",
                                  }}
                                >
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol
                                  style={{
                                    marginBottom: "10px",
                                    paddingLeft: "18px",
                                    listStyle: "decimal",
                                    display: "block",
                                    color: "var(--gray-11)",
                                  }}
                                >
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li
                                  style={{
                                    marginBottom: "6px",
                                    lineHeight: "1.6",
                                    fontSize: "var(--font-size-2)",
                                    color: "var(--gray-11)",
                                  }}
                                >
                                  {children}
                                </li>
                              ),
                            }}
                          >
                            {
                              getAssessmentRecommendation(selectedGrade)
                                ?.message
                            }
                          </ReactMarkdown>
                        </Box>
                      ) : (
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          gap="2"
                          py="3"
                        >
                          <Text
                            size="2"
                            color="gray"
                            style={{ textAlign: "center" }}
                          >
                            {t("recommendations.noAssessmentRecommendation") ||
                              "No recommendation generated yet for this assessment."}
                          </Text>
                          <Button
                            size="2"
                            onClick={() =>
                              handleGenerateAssessmentRecommendation(
                                selectedGrade
                              )
                            }
                            disabled={generateGradeRecommendation.isPending}
                            style={{
                              background: "var(--accent-9)",
                              fontWeight: 600,
                            }}
                          >
                            {generateGradeRecommendation.isPending ? (
                              <>
                                <Spinner size="1" />{" "}
                                {t("recommendations.generating")}
                              </>
                            ) : (
                              <>
                                <MagicWandIcon />{" "}
                                {t(
                                  "recommendations.generateAssessmentRecommendation"
                                ) || "Generate Recommendation"}
                              </>
                            )}
                          </Button>
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                </Flex>

                <Flex justify="end" mt="3">
                  <Dialog.Close>
                    <Button variant="soft" color="gray" size="2">
                      {t("common.close") || "Close"}
                    </Button>
                  </Dialog.Close>
                </Flex>
              </>
            )}
          </Dialog.Content>
        </Dialog.Root>

        {/* AI Recommendations Section - Only show if there are grades */}
        {grades.length > 0 && (
          <>
            {studentRecommendations.length > 0 ? (
              <Card
                size={{ initial: "2", sm: "4" }}
                style={{
                  border: "1px solid var(--gray-4)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  overflow: "hidden",
                }}
              >
                <Flex direction="column" gap="0">
                  {/* Header - Clickable */}
                  <Box
                    onClick={() =>
                      setIsRecommendationsExpanded(!isRecommendationsExpanded)
                    }
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      background: isRecommendationsExpanded
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(96, 165, 250, 0.04))"
                        : "transparent",
                      borderBottom: isRecommendationsExpanded
                        ? "1px solid var(--gray-4)"
                        : "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(96, 165, 250, 0.06))";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        isRecommendationsExpanded
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(96, 165, 250, 0.04))"
                          : "transparent";
                    }}
                  >
                    <Flex align="center" justify="between" gap="3">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            padding: "8px",
                            borderRadius: "10px",
                            background:
                              "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.08))",
                            border: "1px solid rgba(59, 130, 246, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MagicWandIcon
                            width="22"
                            height="22"
                            style={{ color: "var(--accent-9)" }}
                          />
                        </Box>
                        <Flex direction="column" gap="1">
                          <Text
                            size={{ initial: "4", sm: "5" }}
                            weight="bold"
                            style={{ color: "var(--gray-12)" }}
                          >
                            {t("recommendations.aiRecommendations")}
                          </Text>
                          <Text
                            size="1"
                            color="gray"
                            style={{ fontWeight: 400 }}
                          >
                            {studentRecommendations.length}{" "}
                            {studentRecommendations.length === 1
                              ? "recomendación"
                              : "recomendaciones"}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex align="center" gap="2">
                        {isRecommendationsExpanded && (
                          <IconButton
                            variant="ghost"
                            size="2"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleGenerateStudentRecommendation();
                            }}
                            disabled={generateStudentRecommendation.isPending}
                            style={{
                              color: "var(--accent-9)",
                            }}
                            title={t("recommendations.regenerate")}
                          >
                            <ReloadIcon
                              width="16"
                              height="16"
                              style={{
                                transform:
                                  generateStudentRecommendation.isPending
                                    ? "rotate(360deg)"
                                    : "rotate(0deg)",
                                transition:
                                  generateStudentRecommendation.isPending
                                    ? "transform 1s linear infinite"
                                    : "transform 0.3s ease",
                              }}
                            />
                          </IconButton>
                        )}
                        <ChevronDownIcon
                          style={{
                            transform: isRecommendationsExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition:
                              "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            color: "var(--gray-11)",
                            flexShrink: 0,
                          }}
                        />
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Content - Animated */}
                  <Box
                    style={{
                      maxHeight: isRecommendationsExpanded ? "2000px" : "0",
                      overflow: "hidden",
                      transition:
                        "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
                      opacity: isRecommendationsExpanded ? 1 : 0,
                    }}
                  >
                    <Box pt="4" px="4" pb="4">
                      {generateStudentRecommendation.isPending ? (
                        <Flex direction="column" gap="4">
                          {/* Skeleton Loading State */}
                          <Card
                            size="2"
                            style={{
                              background: "var(--gray-2)",
                              border: "1px solid var(--gray-4)",
                              borderRadius: "12px",
                              padding: "20px",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            <Flex direction="column" gap="3">
                              <Box
                                style={{
                                  width: "200px",
                                  height: "20px",
                                  background: "var(--gray-4)",
                                  borderRadius: "4px",
                                  animation: "pulse 1.5s ease-in-out infinite",
                                }}
                              />
                              <Flex direction="column" gap="2">
                                <Box
                                  style={{
                                    width: "100%",
                                    height: "16px",
                                    background: "var(--gray-4)",
                                    borderRadius: "4px",
                                    animation:
                                      "pulse 1.5s ease-in-out infinite",
                                  }}
                                />
                                <Box
                                  style={{
                                    width: "95%",
                                    height: "16px",
                                    background: "var(--gray-4)",
                                    borderRadius: "4px",
                                    animation:
                                      "pulse 1.5s ease-in-out infinite",
                                  }}
                                />
                              </Flex>
                            </Flex>
                          </Card>
                        </Flex>
                      ) : (
                        <Flex direction="column" gap="4">
                          {studentRecommendations.map((recommendation) => (
                            <Card
                              key={recommendation.id}
                              size="2"
                              style={{
                                background: "var(--gray-2)",
                                border: "1px solid var(--gray-4)",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <Flex direction="column" gap="3">
                                {/* Header with badge */}
                                <Flex align="center" justify="between" gap="2">
                                  <Flex align="center" gap="2">
                                    <Box
                                      style={{
                                        padding: "6px 10px",
                                        borderRadius: "6px",
                                        background: "var(--blue-3)",
                                        border: "1px solid var(--blue-5)",
                                      }}
                                    >
                                      <InfoCircledIcon
                                        width="14"
                                        height="14"
                                        style={{ color: "var(--blue-11)" }}
                                      />
                                    </Box>
                                    <Text
                                      size="3"
                                      weight="bold"
                                      style={{ color: "var(--gray-12)" }}
                                    >
                                      {t("recommendations.studentPerformance")}
                                    </Text>
                                  </Flex>
                                  {recommendation.createdAt && (
                                    <Text
                                      size="1"
                                      color="gray"
                                      style={{ fontWeight: 500 }}
                                    >
                                      {new Date(
                                        recommendation.createdAt
                                      ).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </Text>
                                  )}
                                </Flex>

                                {/* Markdown Content */}
                                <Box
                                  style={{
                                    fontSize: "var(--font-size-2)",
                                    lineHeight: "1.7",
                                    color: "var(--gray-11)",
                                  }}
                                >
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => (
                                        <Text
                                          as="p"
                                          size="2"
                                          mb="3"
                                          style={{
                                            display: "block",
                                            color: "var(--gray-11)",
                                            lineHeight: "1.7",
                                          }}
                                        >
                                          {children}
                                        </Text>
                                      ),
                                      strong: ({ children }) => (
                                        <Text
                                          weight="bold"
                                          style={{ color: "var(--gray-12)" }}
                                        >
                                          {children}
                                        </Text>
                                      ),
                                      ul: ({ children }) => (
                                        <ul
                                          style={{
                                            marginBottom: "12px",
                                            paddingLeft: "20px",
                                            listStyle: "disc",
                                            display: "block",
                                            color: "var(--gray-11)",
                                          }}
                                        >
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol
                                          style={{
                                            marginBottom: "12px",
                                            paddingLeft: "20px",
                                            listStyle: "decimal",
                                            display: "block",
                                            color: "var(--gray-11)",
                                          }}
                                        >
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li
                                          style={{
                                            marginBottom: "8px",
                                            lineHeight: "1.7",
                                            fontSize: "var(--font-size-2)",
                                            color: "var(--gray-11)",
                                          }}
                                        >
                                          {children}
                                        </li>
                                      ),
                                      h1: ({ children }) => (
                                        <Text
                                          as="div"
                                          size="5"
                                          weight="bold"
                                          mb="3"
                                          mt="4"
                                          style={{
                                            display: "block",
                                            color: "var(--gray-12)",
                                          }}
                                        >
                                          {children}
                                        </Text>
                                      ),
                                      h2: ({ children }) => (
                                        <Text
                                          as="div"
                                          size="4"
                                          weight="bold"
                                          mb="2"
                                          mt="3"
                                          style={{
                                            display: "block",
                                            color: "var(--gray-12)",
                                          }}
                                        >
                                          {children}
                                        </Text>
                                      ),
                                      h3: ({ children }) => (
                                        <Text
                                          as="div"
                                          size="3"
                                          weight="bold"
                                          mb="2"
                                          mt="3"
                                          style={{
                                            display: "block",
                                            color: "var(--gray-12)",
                                          }}
                                        >
                                          {children}
                                        </Text>
                                      ),
                                    }}
                                  >
                                    {recommendation.message}
                                  </ReactMarkdown>
                                </Box>
                              </Flex>
                            </Card>
                          ))}
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </Flex>
              </Card>
            ) : (
              <Card
                size={{ initial: "2", sm: "4" }}
                style={{
                  border: "2px dashed var(--gray-5)",
                  background: "var(--gray-2)",
                  borderRadius: "12px",
                }}
              >
                <Flex
                  direction="column"
                  justify="center"
                  align="center"
                  gap="4"
                  py="6"
                >
                  <Box
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05))",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MagicWandIcon
                      width="32"
                      height="32"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Flex direction="column" align="center" gap="2">
                    <Text
                      size="4"
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {t("recommendations.noStudentRecommendations")}
                    </Text>
                    <Text
                      size="2"
                      color="gray"
                      style={{ textAlign: "center", maxWidth: "400px" }}
                    >
                      {t("recommendations.generateDescription")}
                    </Text>
                  </Flex>
                  <Button
                    size={{ initial: "2", sm: "3" }}
                    onClick={handleGenerateStudentRecommendation}
                    disabled={generateStudentRecommendation.isPending}
                    style={{
                      background: "var(--accent-9)",
                      fontWeight: 600,
                      padding: "12px 24px",
                    }}
                  >
                    {generateStudentRecommendation.isPending ? (
                      <>
                        <Spinner size="1" /> {t("recommendations.generating")}
                      </>
                    ) : (
                      <>
                        <MagicWandIcon />{" "}
                        {t("recommendations.generateStudentRecommendation")}
                      </>
                    )}
                  </Button>
                </Flex>
              </Card>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
}
