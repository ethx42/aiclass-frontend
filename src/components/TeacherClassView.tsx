"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Table,
  Text,
  TextField,
  Select,
  Dialog,
  Spinner,
  Callout,
  IconButton,
  Badge,
  Tooltip,
} from "@radix-ui/themes";
import {
  PlusIcon,
  InfoCircledIcon,
  Pencil1Icon,
  PersonIcon,
  FileTextIcon,
  BarChartIcon,
  ChatBubbleIcon,
  MagicWandIcon,
  ChevronDownIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useEnrollments } from "@/src/lib/hooks/use-enrollments";
import {
  useGrades,
  useCreateGrade,
  useUpdateGrade,
} from "@/src/lib/hooks/use-grades";
import {
  useRecommendations,
  useGenerateClassRecommendation,
  useGenerateStudentRecommendation,
} from "@/src/lib/hooks/use-recommendations";
import {
  AssessmentKind,
  EnrollmentStatus,
  GradeResponse,
  CreateGradeDto,
  UpdateGradeDto,
  RecommendationAudience,
} from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface TeacherClassViewProps {
  classId: string;
}

interface AssessmentFormData {
  assessmentKind: AssessmentKind;
  assessmentName: string;
  maxScore: number;
  assessmentContent?: string;
}

export function TeacherClassView({ classId }: TeacherClassViewProps) {
  const t = useT();
  const { data: enrollmentsData, isLoading: loadingEnrollments } =
    useEnrollments({
      classId,
      status: EnrollmentStatus.ACTIVE,
      page: 0,
      size: 100,
    });

  const { data: gradesData, isLoading: loadingGrades } = useGrades({
    classId,
    page: 0,
    size: 1000,
  });

  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();

  // AI Recommendations
  const { data: recommendationsData, refetch: refetchRecommendations } =
    useRecommendations({
      classId,
      page: 0,
      size: 10,
    });
  const generateClassRecommendation = useGenerateClassRecommendation();
  const generateStudentRecommendation = useGenerateStudentRecommendation();

  // Filter for teacher recommendations for this class (audience TEACHER)
  // Backend returns "teacher" in lowercase, so we compare case-insensitively
  const classRecommendations =
    recommendationsData?.data?.content?.filter((r) => {
      const audienceMatch =
        r.audience?.toUpperCase() ===
        RecommendationAudience.TEACHER.toUpperCase();
      const classMatch = r.classId === classId;
      return audienceMatch && classMatch;
    }) || [];

  const [isAddAssessmentDialogOpen, setIsAddAssessmentDialogOpen] =
    useState(false);
  const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false);
  const [isEditAssessmentDialogOpen, setIsEditAssessmentDialogOpen] =
    useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeResponse | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<{
    originalAssessmentKind: AssessmentKind;
    originalAssessmentName: string;
    assessmentKind: AssessmentKind;
    assessmentName: string;
    maxScore: number;
    assessmentContent?: string;
  } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    assessment: string;
  } | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [error, setError] = useState("");
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] =
    useState(false);
  const [showRegenerateConfirmDialog, setShowRegenerateConfirmDialog] =
    useState(false);

  const [assessmentFormData, setAssessmentFormData] =
    useState<AssessmentFormData>({
      assessmentKind: AssessmentKind.EXAM,
      assessmentName: "",
      maxScore: 100,
      assessmentContent: "",
    });

  const enrollments = enrollmentsData?.data?.content || [];
  const grades = gradesData?.data?.content || [];

  const handleAddAssessment = async () => {
    setError("");

    if (!assessmentFormData.assessmentName.trim()) {
      setError(t("grades.assessmentNameRequired"));
      return;
    }

    // Create the assessment by adding a grade for the first student with score 0
    // This creates the column in the gradebook
    const firstStudent = enrollments[0];
    if (!firstStudent) {
      setError(t("grades.noStudentsEnrolledError"));
      return;
    }

    try {
      const gradeData: CreateGradeDto = {
        classId,
        studentId: firstStudent.studentId,
        assessmentKind: assessmentFormData.assessmentKind,
        assessmentName: assessmentFormData.assessmentName,
        score: 0,
        maxScore: assessmentFormData.maxScore,
        gradedAt: new Date().toISOString(),
        ...(assessmentFormData.assessmentContent?.trim() && {
          metadata: {
            assessmentContent: assessmentFormData.assessmentContent.trim(),
          },
        }),
      };

      await createGrade.mutateAsync(gradeData);
      setIsAddAssessmentDialogOpen(false);
      setAssessmentFormData({
        assessmentKind: AssessmentKind.EXAM,
        assessmentName: "",
        maxScore: 100,
        assessmentContent: "",
      });
      toast.success(t("grades.assessmentCreated"));
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("grades.failedToCreate");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditGrade = (grade: GradeResponse) => {
    setEditingGrade(grade);
    setEditScore(grade.score.toString());
    setEditFeedback(
      grade.metadata?.feedback || grade.metadata?.teacherFeedback || ""
    );
    setIsEditGradeDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGrade) return;

    try {
      const updateData: Partial<UpdateGradeDto> = {
        score: parseFloat(editScore),
      };

      // Include feedback in metadata if provided
      if (editFeedback.trim()) {
        updateData.metadata = {
          ...editingGrade.metadata,
          feedback: editFeedback.trim(),
          teacherFeedback: editFeedback.trim(),
        };
      } else if (editingGrade.metadata) {
        // Preserve existing metadata but remove feedback if empty
        const { feedback, teacherFeedback, ...restMetadata } =
          editingGrade.metadata;
        if (Object.keys(restMetadata).length > 0) {
          updateData.metadata = restMetadata;
        }
      }

      await updateGrade.mutateAsync({
        id: editingGrade.id,
        data: updateData,
      });
      setIsEditGradeDialogOpen(false);
      setEditingGrade(null);
      setEditScore("");
      setEditFeedback("");
      toast.success(t("grades.gradeUpdated"));
    } catch (err) {
      console.error("Failed to update grade:", err);
      toast.error(t("grades.failedToUpdate"));
    }
  };

  const handleCancelEdit = () => {
    setIsEditGradeDialogOpen(false);
    setEditingGrade(null);
    setEditScore("");
    setEditFeedback("");
  };

  const handleCellClick = (studentId: string, assessment: string) => {
    setEditingCell({ studentId, assessment });
    setNewScore("");
  };

  const handleSaveNewGrade = async () => {
    if (!editingCell) return;

    const [kind, name] = editingCell.assessment.split(":");
    const assessment = assessments.find((a) => a === editingCell.assessment);

    // Get maxScore from existing grade with this assessment or use default
    const existingGrade = grades.find(
      (g) => `${g.assessmentKind}:${g.assessmentName}` === assessment
    );
    const maxScore = existingGrade?.maxScore || 100;

    try {
      const gradeData: CreateGradeDto = {
        classId,
        studentId: editingCell.studentId,
        assessmentKind: kind as AssessmentKind,
        assessmentName: name,
        score: parseFloat(newScore),
        maxScore,
        gradedAt: new Date().toISOString(),
        ...(newFeedback.trim() && {
          metadata: {
            feedback: newFeedback.trim(),
            teacherFeedback: newFeedback.trim(),
          },
        }),
      };

      await createGrade.mutateAsync(gradeData);
      setEditingCell(null);
      setNewScore("");
      setNewFeedback("");
      toast.success(t("grades.gradeAdded"));
    } catch (err) {
      console.error("Failed to add grade:", err);
      toast.error(t("grades.failedToAdd"));
    }
  };

  const handleCancelNewGrade = () => {
    setEditingCell(null);
    setNewScore("");
    setNewFeedback("");
  };

  const handleEditAssessment = (assessment: string) => {
    const [kind, name] = assessment.split(":");
    const assessmentGrades = grades.filter(
      (g) => g.assessmentKind === kind && g.assessmentName === name
    );

    if (assessmentGrades.length === 0) return;

    const firstGrade = assessmentGrades[0];
    setEditingAssessment({
      originalAssessmentKind: firstGrade.assessmentKind,
      originalAssessmentName: firstGrade.assessmentName,
      assessmentKind: firstGrade.assessmentKind,
      assessmentName: firstGrade.assessmentName,
      maxScore: firstGrade.maxScore,
      assessmentContent: firstGrade.metadata?.assessmentContent || "",
    });
    setIsEditAssessmentDialogOpen(true);
  };

  const handleSaveAssessment = async () => {
    if (!editingAssessment) return;
    setError("");

    if (!editingAssessment.assessmentName.trim()) {
      setError(t("grades.assessmentNameRequired"));
      return;
    }

    try {
      // Find all grades for this assessment using ORIGINAL name/kind
      // This is important because the user might have changed the name
      const assessmentGrades = grades.filter(
        (g) =>
          g.assessmentKind === editingAssessment.originalAssessmentKind &&
          g.assessmentName === editingAssessment.originalAssessmentName
      );

      // Update all grades for this assessment
      const updatePromises = assessmentGrades.map((grade) => {
        const updateData: Partial<UpdateGradeDto> = {
          assessmentKind: editingAssessment.assessmentKind,
          assessmentName: editingAssessment.assessmentName,
          maxScore: editingAssessment.maxScore,
        };

        // Always update metadata with assessmentContent
        // Preserve existing metadata (like feedback) and update/remove assessmentContent
        if (editingAssessment.assessmentContent?.trim()) {
          updateData.metadata = {
            ...grade.metadata,
            assessmentContent: editingAssessment.assessmentContent.trim(),
          };
        } else {
          // If assessmentContent is empty, remove it but keep other metadata
          if (grade.metadata) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { assessmentContent, ...restMetadata } = grade.metadata;
            updateData.metadata =
              Object.keys(restMetadata).length > 0 ? restMetadata : undefined;
          }
        }

        return updateGrade.mutateAsync({
          id: grade.id,
          data: updateData,
        });
      });

      await Promise.all(updatePromises);
      setIsEditAssessmentDialogOpen(false);
      setEditingAssessment(null);
      toast.success(t("grades.assessmentUpdated"));
    } catch (err) {
      console.error("Failed to update assessment:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("grades.failedToUpdateAssessment");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCancelEditAssessment = () => {
    setIsEditAssessmentDialogOpen(false);
    setEditingAssessment(null);
    setError("");
  };

  // Group grades by student
  const gradesByStudent = grades.reduce((acc, grade) => {
    const studentId = grade.studentId;
    if (!acc[studentId]) {
      acc[studentId] = [];
    }
    acc[studentId].push(grade);
    return acc;
  }, {} as Record<string, GradeResponse[]>);

  // Get unique assessment names
  const assessments = Array.from(
    new Set(grades.map((g) => `${g.assessmentKind}:${g.assessmentName}`))
  );

  // Calculate overall class average
  const calculateClassAverage = (): number | null => {
    if (grades.length === 0 || enrollments.length === 0) return null;

    const studentAverages: number[] = [];

    enrollments.forEach((enrollment) => {
      const studentGrades = gradesByStudent[enrollment.studentId] || [];
      if (studentGrades.length > 0) {
        const average =
          studentGrades.reduce(
            (sum, g) => sum + (g.score / g.maxScore) * 100,
            0
          ) / studentGrades.length;
        studentAverages.push(average);
      }
    });

    if (studentAverages.length === 0) return null;

    const classAverage =
      studentAverages.reduce((sum, avg) => sum + avg, 0) /
      studentAverages.length;
    return classAverage;
  };

  const classAverage = calculateClassAverage();

  // Helper function to get assessment content for a given assessment
  const getAssessmentContent = (assessment: string): string | null => {
    const [kind, name] = assessment.split(":");
    const gradeWithContent = grades.find(
      (g) =>
        g.assessmentKind === kind &&
        g.assessmentName === name &&
        g.metadata?.assessmentContent
    );
    return gradeWithContent?.metadata?.assessmentContent || null;
  };

  if (loadingEnrollments || loadingGrades) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "50vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  const handleGenerateClassRecommendation = async (
    forceRegenerate: boolean = false
  ) => {
    // If force regenerate, show confirmation dialog first
    if (forceRegenerate) {
      setShowRegenerateConfirmDialog(true);
      return;
    }

    // Regular generation (no confirmation needed)
    try {
      await generateClassRecommendation.mutateAsync({
        classId,
        forceRegenerate: false,
      });
      // Refetch recommendations to show the newly generated one
      await refetchRecommendations();
      toast.success(t("recommendations.classRecommendationGenerated"));
    } catch (err) {
      console.error("Failed to generate recommendation:", err);
      toast.error(t("recommendations.failedToGenerate"));
    }
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenerateConfirmDialog(false);
    try {
      await generateClassRecommendation.mutateAsync({
        classId,
        forceRegenerate: true,
      });
      // Refetch recommendations to show the newly generated one
      await refetchRecommendations();
      toast.success(t("recommendations.classRecommendationRegenerated"));
    } catch (err) {
      console.error("Failed to regenerate recommendation:", err);
      toast.error(t("recommendations.failedToGenerate"));
    }
  };

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Card size={{ initial: "2", sm: "4" }}>
        <Flex direction="column" gap="4">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            justify="between"
            align={{ initial: "start", sm: "center" }}
            gap={{ initial: "3", sm: "0" }}
          >
            <Box>
              <Text size={{ initial: "4", sm: "5" }} weight="bold">
                {t("grades.gradebook")}
              </Text>
              <br />
              <Text size={{ initial: "2", sm: "2" }} color="gray">
                {enrollments.length} {t("grades.studentsEnrolled")} ·{" "}
              </Text>
            </Box>
            <Dialog.Root
              open={isAddAssessmentDialogOpen}
              onOpenChange={setIsAddAssessmentDialogOpen}
            >
              <Dialog.Trigger>
                <Button
                  size={{ initial: "2", sm: "3" }}
                  className="w-full sm:w-auto"
                >
                  <PlusIcon /> {t("grades.addGrade")}
                </Button>
              </Dialog.Trigger>

                <Dialog.Content style={{ maxWidth: 500 }}>
                  <Dialog.Title>{t("grades.addGrade")}</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    {t("grades.createAssessment")}
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    {error && (
                      <Callout.Root color="red" size="1">
                        <Callout.Icon>
                          <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                      </Callout.Root>
                    )}

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentType")} *
                      </Text>
                      <Select.Root
                        value={assessmentFormData.assessmentKind}
                        onValueChange={(value) =>
                          setAssessmentFormData({
                            ...assessmentFormData,
                            assessmentKind: value as AssessmentKind,
                          })
                        }
                      >
                        <Select.Trigger style={{ width: "100%" }} />
                        <Select.Content>
                          <Select.Item value={AssessmentKind.EXAM}>
                            {t("grades.exam")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.QUIZ}>
                            {t("grades.quiz")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.HOMEWORK}>
                            {t("grades.homework")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.PROJECT}>
                            {t("grades.project")}
                          </Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentName")} *
                      </Text>
                      <TextField.Root
                        placeholder="e.g., Midterm Exam"
                        value={assessmentFormData.assessmentName}
                        onChange={(e) =>
                          setAssessmentFormData({
                            ...assessmentFormData,
                            assessmentName: e.target.value,
                          })
                        }
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.maxScore")} *
                      </Text>
                      <TextField.Root
                        type="number"
                        value={assessmentFormData.maxScore.toString()}
                        onChange={(e) =>
                          setAssessmentFormData({
                            ...assessmentFormData,
                            maxScore: parseFloat(e.target.value),
                          })
                        }
                        min="1"
                        step="0.1"
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentContent")}
                      </Text>
                      <textarea
                        placeholder={t("grades.assessmentContentPlaceholder")}
                        value={assessmentFormData.assessmentContent || ""}
                        onChange={(e) =>
                          setAssessmentFormData({
                            ...assessmentFormData,
                            assessmentContent: e.target.value,
                          })
                        }
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--gray-6)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          minHeight: "80px",
                        }}
                      />
                      <Text size="1" color="gray" mt="1">
                        {t("grades.assessmentContentHint")}
                      </Text>
                    </Box>

                    <Callout.Root color="blue" size="1">
                      <Callout.Icon>
                        <InfoCircledIcon />
                      </Callout.Icon>
                      <Callout.Text>
                        {t("grades.createAssessmentHint")}
                      </Callout.Text>
                    </Callout.Root>

                    <Flex
                      direction={{ initial: "column", sm: "row" }}
                      gap="3"
                      justify="end"
                      mt="2"
                    >
                      <Dialog.Close>
                        <Button
                          variant="soft"
                          color="gray"
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleAddAssessment}
                        disabled={
                          createGrade.isPending ||
                          !assessmentFormData.assessmentName.trim()
                        }
                        className="w-full sm:w-auto"
                      >
                        {createGrade.isPending
                          ? t("class.creating")
                          : t("common.create") + " " + t("grades.assessment")}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              {/* Edit Grade Dialog */}
              <Dialog.Root
                open={isEditGradeDialogOpen}
                onOpenChange={setIsEditGradeDialogOpen}
              >
                <Dialog.Content style={{ maxWidth: 500 }}>
                  <Dialog.Title>{t("grades.editGrade")}</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    {editingGrade &&
                      `${t("grades.student")}: ${
                        enrollments.find(
                          (e) => e.studentId === editingGrade.studentId
                        )?.studentName || ""
                      }`}
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    {error && (
                      <Callout.Root color="red" size="1">
                        <Callout.Icon>
                          <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                      </Callout.Root>
                    )}

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.score")} *
                      </Text>
                      <TextField.Root
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={4}
                        value={editScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            const digitCount = value.replace(/\./g, "").length;
                            if (digitCount <= 3) {
                              setEditScore(value);
                            }
                          }
                        }}
                        required
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.feedback")}
                      </Text>
                      <textarea
                        placeholder={t("grades.feedbackPlaceholder")}
                        value={editFeedback}
                        onChange={(e) => setEditFeedback(e.target.value)}
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--gray-6)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          minHeight: "80px",
                        }}
                      />
                      <Text size="1" color="gray" mt="1">
                        {t("grades.feedbackHint")}
                      </Text>
                    </Box>

                    <Flex
                      direction={{ initial: "column", sm: "row" }}
                      gap="3"
                      justify="end"
                      mt="2"
                    >
                      <Dialog.Close>
                        <Button
                          variant="soft"
                          color="gray"
                          onClick={handleCancelEdit}
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleSaveEdit}
                        disabled={updateGrade.isPending || !editScore}
                        className="w-full sm:w-auto"
                      >
                        {updateGrade.isPending
                          ? t("common.saving")
                          : t("common.save")}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              {/* Edit Assessment Dialog */}
              <Dialog.Root
                open={isEditAssessmentDialogOpen}
                onOpenChange={setIsEditAssessmentDialogOpen}
              >
                <Dialog.Content style={{ maxWidth: 500 }}>
                  <Dialog.Title>{t("grades.editAssessment")}</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    {t("grades.editAssessmentDescription")}
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    {error && (
                      <Callout.Root color="red" size="1">
                        <Callout.Icon>
                          <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                      </Callout.Root>
                    )}

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentType")} *
                      </Text>
                      <Select.Root
                        value={editingAssessment?.assessmentKind}
                        onValueChange={(value) =>
                          setEditingAssessment({
                            ...editingAssessment!,
                            assessmentKind: value as AssessmentKind,
                          })
                        }
                      >
                        <Select.Trigger style={{ width: "100%" }} />
                        <Select.Content>
                          <Select.Item value={AssessmentKind.EXAM}>
                            {t("grades.exam")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.QUIZ}>
                            {t("grades.quiz")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.HOMEWORK}>
                            {t("grades.homework")}
                          </Select.Item>
                          <Select.Item value={AssessmentKind.PROJECT}>
                            {t("grades.project")}
                          </Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentName")} *
                      </Text>
                      <TextField.Root
                        placeholder="e.g., Midterm Exam"
                        value={editingAssessment?.assessmentName || ""}
                        onChange={(e) =>
                          setEditingAssessment({
                            ...editingAssessment!,
                            assessmentName: e.target.value,
                          })
                        }
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.maxScore")} *
                      </Text>
                      <TextField.Root
                        type="number"
                        value={editingAssessment?.maxScore?.toString() || "100"}
                        onChange={(e) =>
                          setEditingAssessment({
                            ...editingAssessment!,
                            maxScore: parseFloat(e.target.value) || 100,
                          })
                        }
                        min="1"
                        step="0.1"
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.assessmentContent")}
                      </Text>
                      <textarea
                        placeholder={t("grades.assessmentContentPlaceholder")}
                        value={editingAssessment?.assessmentContent || ""}
                        onChange={(e) =>
                          setEditingAssessment({
                            ...editingAssessment!,
                            assessmentContent: e.target.value,
                          })
                        }
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--gray-6)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          minHeight: "80px",
                        }}
                      />
                      <Text size="1" color="gray" mt="1">
                        {t("grades.assessmentContentHint")}
                      </Text>
                    </Box>

                    <Callout.Root color="blue" size="1">
                      <Callout.Icon>
                        <InfoCircledIcon />
                      </Callout.Icon>
                      <Callout.Text>
                        {t("grades.editAssessmentHint")}
                      </Callout.Text>
                    </Callout.Root>

                    <Flex
                      direction={{ initial: "column", sm: "row" }}
                      gap="3"
                      justify="end"
                      mt="2"
                    >
                      <Dialog.Close>
                        <Button
                          variant="soft"
                          color="gray"
                          onClick={handleCancelEditAssessment}
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleSaveAssessment}
                        disabled={
                          updateGrade.isPending ||
                          !editingAssessment?.assessmentName?.trim()
                        }
                        className="w-full sm:w-auto"
                      >
                        {updateGrade.isPending
                          ? t("common.saving")
                          : t("common.save")}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              {/* Regenerate Recommendation Confirmation Dialog */}
              <Dialog.Root
                open={showRegenerateConfirmDialog}
                onOpenChange={setShowRegenerateConfirmDialog}
              >
                <Dialog.Content style={{ maxWidth: 500 }}>
                  <Dialog.Title>
                    {t("recommendations.confirmRegenerate")}
                  </Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    {t("recommendations.regenerateDisclaimer")}
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    <Callout.Root color="amber" size="2">
                      <Callout.Icon>
                        <InfoCircledIcon />
                      </Callout.Icon>
                      <Callout.Text>
                        <Text weight="bold" mb="1" style={{ display: "block" }}>
                          {t("recommendations.regenerateWarning")}
                        </Text>
                        <Text size="2">
                          {t("recommendations.regenerateWarningDescription")}
                        </Text>
                      </Callout.Text>
                    </Callout.Root>

                    <Flex
                      direction={{ initial: "column", sm: "row" }}
                      gap="3"
                      justify="end"
                      mt="2"
                    >
                      <Dialog.Close>
                        <Button
                          variant="soft"
                          color="gray"
                          onClick={() => setShowRegenerateConfirmDialog(false)}
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleConfirmRegenerate}
                        disabled={generateClassRecommendation.isPending}
                        color="amber"
                        className="w-full sm:w-auto"
                      >
                        {generateClassRecommendation.isPending ? (
                          <>
                            <Spinner size="1" />{" "}
                            {t("recommendations.generating")}
                          </>
                        ) : (
                          <>
                            <ReloadIcon />{" "}
                            {t("recommendations.confirmRegenerate")}
                          </>
                        )}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              {/* Add Grade Dialog */}
              <Dialog.Root
                open={editingCell !== null}
                onOpenChange={(open) => {
                  if (!open) handleCancelNewGrade();
                }}
              >
                <Dialog.Content style={{ maxWidth: 500 }}>
                  <Dialog.Title>{t("grades.enterGradeInfo")}</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    {editingCell &&
                      `${t("grades.student")}: ${
                        enrollments.find(
                          (e) => e.studentId === editingCell.studentId
                        )?.studentName || ""
                      }`}
                  </Dialog.Description>

                  <Flex direction="column" gap="3">
                    {error && (
                      <Callout.Root color="red" size="1">
                        <Callout.Icon>
                          <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                      </Callout.Root>
                    )}

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.score")} *
                      </Text>
                      <TextField.Root
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={4}
                        value={newScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            const digitCount = value.replace(/\./g, "").length;
                            if (digitCount <= 3) {
                              setNewScore(value);
                            }
                          }
                        }}
                        required
                      />
                    </Box>

                    <Box>
                      <Text as="label" size="2" weight="bold" mb="1">
                        {t("grades.feedback")}
                      </Text>
                      <textarea
                        placeholder={t("grades.feedbackPlaceholder")}
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--gray-6)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          minHeight: "80px",
                        }}
                      />
                      <Text size="1" color="gray" mt="1">
                        {t("grades.feedbackHint")}
                      </Text>
                    </Box>

                    <Flex
                      direction={{ initial: "column", sm: "row" }}
                      gap="3"
                      justify="end"
                      mt="2"
                    >
                      <Dialog.Close>
                        <Button
                          variant="soft"
                          color="gray"
                          onClick={handleCancelNewGrade}
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleSaveNewGrade}
                        disabled={createGrade.isPending || !newScore}
                        className="w-full sm:w-auto"
                      >
                        {createGrade.isPending
                          ? t("common.saving")
                          : t("common.save")}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            </Flex>

            {enrollments.length === 0 ? (
              <Text
                color="gray"
                size={{ initial: "2", sm: "3" }}
                style={{ textAlign: "center" }}
                className="p-6 sm:p-10"
              >
                {t("roster.noStudentsEnrolled")}
              </Text>
            ) : grades.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="3"
                className="p-6 sm:p-10"
              >
                <Text color="gray" size={{ initial: "2", sm: "3" }}>
                  {t("grades.noGrades")}
                </Text>
                <Button
                  variant="soft"
                  onClick={() => setIsAddAssessmentDialogOpen(true)}
                  size={{ initial: "2", sm: "3" }}
                >
                  <PlusIcon /> {t("grades.addFirstGrade")}
                </Button>
              </Flex>
            ) : (
              <Box style={{ overflowX: "auto" }}>
                <Table.Root className="premium-table">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <PersonIcon width="14" height="14" />
                          {t("grades.student")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                      {assessments.map((assessment) => {
                        const assessmentContent =
                          getAssessmentContent(assessment);
                        const assessmentName = assessment.split(":")[1];

                        return (
                          <Table.ColumnHeaderCell key={assessment}>
                            <Flex
                              align="center"
                              justify="between"
                              gap="2"
                              style={{ width: "100%" }}
                            >
                              {assessmentContent ? (
                                <Tooltip content={assessmentContent}>
                                  <Flex
                                    align="center"
                                    gap="2"
                                    style={{ cursor: "help", flex: 1 }}
                                  >
                                    <FileTextIcon width="14" height="14" />
                                    <Text>{assessmentName}</Text>
                                  </Flex>
                                </Tooltip>
                              ) : (
                                <Flex
                                  align="center"
                                  gap="2"
                                  style={{ flex: 1 }}
                                >
                                  <FileTextIcon width="14" height="14" />
                                  <Text>{assessmentName}</Text>
                                </Flex>
                              )}
                              <IconButton
                                size="1"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAssessment(assessment);
                                }}
                                style={{ flexShrink: 0 }}
                                title={t("grades.editAssessment")}
                              >
                                <Pencil1Icon width="12" height="12" />
                              </IconButton>
                            </Flex>
                          </Table.ColumnHeaderCell>
                        );
                      })}
                      <Table.ColumnHeaderCell>
                        <Flex align="center" gap="2">
                          <BarChartIcon width="14" height="14" />
                          {t("grades.average")}
                        </Flex>
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {enrollments.map((enrollment) => {
                      const studentGrades =
                        gradesByStudent[enrollment.studentId] || [];
                      const average =
                        studentGrades.length > 0
                          ? (
                              studentGrades.reduce(
                                (sum, g) => sum + (g.score / g.maxScore) * 100,
                                0
                              ) / studentGrades.length
                            ).toFixed(1)
                          : "-";

                    return (
                      <Table.Row key={enrollment.id}>
                        <Table.Cell>
                          <Flex
                            align="center"
                            gap="2"
                            className="table-cell-with-icon"
                          >
                            <Box className="table-cell-icon">
                              <PersonIcon width="12" height="12" />
                            </Box>
                            <Text weight="bold" style={{ fontWeight: 600 }}>
                              {enrollment.studentName}
                            </Text>
                          </Flex>
                        </Table.Cell>
                        {assessments.map((assessment) => {
                          const grade = studentGrades.find(
                            (g) =>
                              `${g.assessmentKind}:${g.assessmentName}` ===
                              assessment
                          );

                            const isEditingThisCell =
                              editingCell?.studentId === enrollment.studentId &&
                              editingCell?.assessment === assessment;

                            return (
                              <Table.Cell key={assessment}>
                                {grade ? (
                                  <Flex align="center" gap="2">
                                    <Text>{grade.score}</Text>
                                    {grade.metadata?.feedback ||
                                    grade.metadata?.teacherFeedback ? (
                                      <Tooltip
                                        content={
                                          grade.metadata.feedback ||
                                          grade.metadata.teacherFeedback
                                        }
                                      >
                                        <ChatBubbleIcon
                                          width="14"
                                          height="14"
                                          style={{
                                            color: "var(--accent-9)",
                                            cursor: "help",
                                            flexShrink: 0,
                                          }}
                                        />
                                      </Tooltip>
                                    ) : null}
                                    <IconButton
                                      size="1"
                                      variant="ghost"
                                      onClick={() => handleEditGrade(grade)}
                                    >
                                      <Pencil1Icon />
                                    </IconButton>
                                  </Flex>
                                ) : isEditingThisCell ? (
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={handleSaveNewGrade}
                                    disabled={!newScore}
                                  >
                                    {t("grades.enterGradeInfo")}
                                  </Button>
                                ) : (
                                  <Box
                                    onClick={() =>
                                      handleCellClick(
                                        enrollment.studentId,
                                        assessment
                                      )
                                    }
                                    style={{
                                      cursor: "pointer",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    className="hover:bg-gray-3"
                                  >
                                    <Text color="gray">-</Text>
                                  </Box>
                                )}
                              </Table.Cell>
                            );
                          })}
                          <Table.Cell>
                            <Flex align="center" gap="2">
                              {average !== "-" ? (
                                <Badge
                                  color={
                                    parseFloat(average) >= 90
                                      ? "green"
                                      : parseFloat(average) >= 80
                                      ? "blue"
                                      : parseFloat(average) >= 70
                                      ? "orange"
                                      : "red"
                                  }
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                  {average}%
                                </Badge>
                              ) : (
                                <Text color="gray" size="2">
                                  {average}
                                </Text>
                              )}
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

        {/* Recommendations */}
        {/* AI Recommendations Section - Only show if there are students and grades */}
        {enrollments.length > 0 && grades.length > 0 && (
          <>
            {classRecommendations.length > 0 ? (
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
                            {classRecommendations.length}{" "}
                            {classRecommendations.length === 1
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
                              handleGenerateClassRecommendation(true);
                            }}
                            disabled={generateClassRecommendation.isPending}
                            style={{
                              color: "var(--accent-9)",
                            }}
                            title={t("recommendations.regenerate")}
                          >
                            <ReloadIcon
                              width="16"
                              height="16"
                              style={{
                                transform: generateClassRecommendation.isPending
                                  ? "rotate(360deg)"
                                  : "rotate(0deg)",
                                transition:
                                  generateClassRecommendation.isPending
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
                      {generateClassRecommendation.isPending ? (
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
                              {/* Header skeleton */}
                              <Flex align="center" justify="between" gap="2">
                                <Flex align="center" gap="2">
                                  <Box
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      background: "var(--gray-4)",
                                      width: "40px",
                                      height: "26px",
                                      animation:
                                        "pulse 1.5s ease-in-out infinite",
                                    }}
                                  />
                                  <Box
                                    style={{
                                      width: "200px",
                                      height: "20px",
                                      background: "var(--gray-4)",
                                      borderRadius: "4px",
                                      animation:
                                        "pulse 1.5s ease-in-out infinite",
                                    }}
                                  />
                                </Flex>
                                <Box
                                  style={{
                                    width: "80px",
                                    height: "16px",
                                    background: "var(--gray-4)",
                                    borderRadius: "4px",
                                    animation:
                                      "pulse 1.5s ease-in-out infinite",
                                  }}
                                />
                              </Flex>
                              {/* Content skeleton */}
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
                                <Box
                                  style={{
                                    width: "90%",
                                    height: "16px",
                                    background: "var(--gray-4)",
                                    borderRadius: "4px",
                                    animation:
                                      "pulse 1.5s ease-in-out infinite",
                                  }}
                                />
                                <Box
                                  style={{
                                    width: "85%",
                                    height: "16px",
                                    background: "var(--gray-4)",
                                    borderRadius: "4px",
                                    animation:
                                      "pulse 1.5s ease-in-out infinite",
                                  }}
                                />
                                <Box
                                  style={{
                                    width: "75%",
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
                          {classRecommendations.map((recommendation) => (
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
                                      {t("recommendations.classPerformance")}
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
                      {t("recommendations.noClassRecommendations")}
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
                    onClick={() => handleGenerateClassRecommendation(false)}
                    disabled={generateClassRecommendation.isPending}
                    style={{
                      background: "var(--accent-9)",
                      fontWeight: 600,
                      padding: "12px 24px",
                    }}
                  >
                    {generateClassRecommendation.isPending ? (
                      <>
                        <Spinner size="1" /> {t("recommendations.generating")}
                      </>
                    ) : (
                      <>
                        <MagicWandIcon />{" "}
                        {t("recommendations.generateClassRecommendation")}
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
