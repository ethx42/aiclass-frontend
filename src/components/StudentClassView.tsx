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
  EyeOpenIcon,
  FileTextIcon,
  BookmarkIcon,
  StarIcon,
  BarChartIcon,
  CalendarIcon,
  MagicWandIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { useGrades } from "@/src/lib/hooks/use-grades";
import { AssessmentKind, GradeResponse } from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";
import { useGenerateGradeRecommendation } from "@/src/lib/hooks/use-recommendations";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

interface StudentClassViewProps {
  classId: string;
  teacherName?: string;
  teacherEmail?: string;
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

export function StudentClassView({
  classId,
  teacherName,
  teacherEmail,
}: StudentClassViewProps) {
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

  // AI Recommendations - Use recommendation directly from grade response
  const generateGradeRecommendation = useGenerateGradeRecommendation();

  const [selectedGrade, setSelectedGrade] = useState<GradeResponse | null>(
    null
  );
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedGradeForFeedback, setSelectedGradeForFeedback] =
    useState<GradeResponse | null>(null);

  // Get recommendation for a specific assessment/grade - comes directly from the grade response
  const getAssessmentRecommendation = (grade: GradeResponse) => {
    return grade.recommendation || null;
  };

  const handleOpenAssessmentModal = (grade: GradeResponse) => {
    setSelectedGrade(grade);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenFeedbackModal = (grade: GradeResponse) => {
    setSelectedGradeForFeedback(grade);
    setIsFeedbackModalOpen(true);
  };

  const hasFeedback = (grade: GradeResponse) => {
    const metadata = grade.metadata;
    if (!metadata) return false;
    // Handle both object and string cases
    if (typeof metadata === "string") {
      try {
        const parsed = JSON.parse(metadata);
        return !!(parsed?.feedback || parsed?.teacherFeedback);
      } catch {
        return false;
      }
    }
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      return false;
    }
    const feedback = metadata.feedback;
    const teacherFeedback = metadata.teacherFeedback;
    return !!(feedback || teacherFeedback);
  };

  const handleGenerateAssessmentRecommendation = async (
    grade: GradeResponse
  ) => {
    if (!user?.id) return;

    try {
      // Use the grade-specific endpoint to generate recommendation for this assessment
      // The recommendation will be included in the grade response when we refetch
      await generateGradeRecommendation.mutateAsync(grade.id);
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

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap={{ initial: "4", sm: "6" }}>
        {/* Summary Card - Minimalist & Compact */}
        <Card size="2">
          <Flex direction="column" gap="4">
            <Text size="4" weight="bold">
              {t("grades.performanceSummary")}
            </Text>

            {/* Teacher */}
            {teacherName && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  {t("class.teacher")}
                </Text>
                <Text size="3" weight="medium">
                  {teacherName}
                </Text>
                {teacherEmail && (
                  <Text size="1" color="gray" style={{ marginTop: "2px" }}>
                    {teacherEmail}
                  </Text>
                )}
              </Flex>
            )}

            {/* Metrics */}
            <Flex gap="6" wrap="wrap">
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  {t("grades.totalGrades")}
                </Text>
                <Text size="5" weight="bold">
                  {grades.length}
                </Text>
              </Flex>

              {overallAverage && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray">
                    {t("grades.overallAverage")}
                  </Text>
                  <Badge
                    size="2"
                    color={getGradeColor(parseFloat(overallAverage))}
                    style={{ width: "fit-content" }}
                  >
                    {overallAverage}%
                  </Badge>
                </Flex>
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
                          <ChatBubbleIcon width="14" height="14" />
                          {t("grades.feedback")}
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
                            <Table.Cell style={{ textAlign: "center" }}>
                              {(() => {
                                const feedbackExists = hasFeedback(grade);
                                return feedbackExists ? (
                                  <Flex justify="center">
                                    <Tooltip content={t("grades.viewFeedback")}>
                                      <IconButton
                                        size="1"
                                        variant="ghost"
                                        onClick={() =>
                                          handleOpenFeedbackModal(grade)
                                        }
                                        style={{
                                          color: "var(--blue-9)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <ChatBubbleIcon
                                          width="14"
                                          height="14"
                                        />
                                      </IconButton>
                                    </Tooltip>
                                  </Flex>
                                ) : (
                                  <Text
                                    size="1"
                                    color="gray"
                                    style={{ textAlign: "center" }}
                                  >
                                    -
                                  </Text>
                                );
                              })()}
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: "center" }}>
                              {(() => {
                                const hasRecommendation =
                                  getAssessmentRecommendation(grade);
                                return (
                                  <Flex justify="center">
                                    <Tooltip
                                      content={
                                        hasRecommendation
                                          ? t(
                                              "recommendations.viewRecommendation"
                                            )
                                          : t(
                                              "recommendations.generateAssessmentRecommendation"
                                            )
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
                                          <EyeOpenIcon width="14" height="14" />
                                        ) : (
                                          <MagicWandIcon
                                            width="14"
                                            height="14"
                                          />
                                        )}
                                      </IconButton>
                                    </Tooltip>
                                  </Flex>
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
                          {t("grades.type")}:{" "}
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
                          {t("grades.date")}:{" "}
                        </Text>
                        <Text size="2" weight="medium">
                          {new Date(
                            selectedGrade.gradedAt
                          ).toLocaleDateString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.score")}:{" "}
                        </Text>
                        <Text size="2" weight="bold">
                          {selectedGrade.score} / {selectedGrade.maxScore}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.percentage")}:{" "}
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

        {/* Teacher Feedback Modal */}
        <Dialog.Root
          open={isFeedbackModalOpen}
          onOpenChange={setIsFeedbackModalOpen}
        >
          <Dialog.Content style={{ maxWidth: 650 }}>
            {selectedGradeForFeedback && (
              <>
                <Dialog.Title>
                  {selectedGradeForFeedback.assessmentName}
                </Dialog.Title>
                <Dialog.Description size="2" mb="3">
                  {t("grades.assessmentDetails") ||
                    "Assessment details and teacher feedback"}
                </Dialog.Description>

                <Flex direction="column" gap="4">
                  {/* Assessment Information */}
                  <Card size="2" style={{ padding: "12px" }}>
                    <Grid columns="2" gap="3">
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.type")}:{" "}
                        </Text>
                        <Badge
                          color={getAssessmentColor(
                            selectedGradeForFeedback.assessmentKind
                          )}
                          style={{
                            fontWeight: 600,
                            fontSize: "10px",
                            padding: "3px 8px",
                          }}
                        >
                          {t(
                            `grades.${selectedGradeForFeedback.assessmentKind.toLowerCase()}`
                          )}
                        </Badge>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.date")}:{" "}
                        </Text>
                        <Text size="2" weight="medium">
                          {new Date(
                            selectedGradeForFeedback.gradedAt
                          ).toLocaleDateString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.score")}:{" "}
                        </Text>
                        <Text size="2" weight="bold">
                          {selectedGradeForFeedback.score} /{" "}
                          {selectedGradeForFeedback.maxScore}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" mb="1">
                          {t("grades.percentage")}:{" "}
                        </Text>
                        <Badge
                          color={getGradeColor(
                            parseFloat(
                              (
                                (selectedGradeForFeedback.score /
                                  selectedGradeForFeedback.maxScore) *
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
                            (selectedGradeForFeedback.score /
                              selectedGradeForFeedback.maxScore) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </Box>
                    </Grid>
                  </Card>

                  {/* Assessment Content */}
                  {selectedGradeForFeedback.metadata?.assessmentContent && (
                    <Box>
                      <Text size="2" weight="bold" mb="2">
                        {t("grades.assessmentContent")}
                      </Text>
                      <Text
                        size="2"
                        color="gray"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {selectedGradeForFeedback.metadata.assessmentContent}
                      </Text>
                    </Box>
                  )}

                  {/* Teacher Feedback */}
                  <Box>
                    <Flex align="center" gap="2" mb="2">
                      <ChatBubbleIcon
                        width="16"
                        height="16"
                        style={{ color: "var(--blue-11)" }}
                      />
                      <Text size="3" weight="bold">
                        {t("grades.teacherFeedback")}
                      </Text>
                    </Flex>
                    <Card
                      size="2"
                      style={{ padding: "16px", background: "var(--blue-2)" }}
                    >
                      <Text
                        size="2"
                        style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                      >
                        {selectedGradeForFeedback.metadata?.teacherFeedback ||
                          selectedGradeForFeedback.metadata?.feedback ||
                          t("grades.noFeedback")}
                      </Text>
                    </Card>
                  </Box>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
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
      </Flex>
    </Box>
  );
}
