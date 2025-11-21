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
  CheckIcon,
  Cross2Icon,
  PersonIcon,
  FileTextIcon,
  BarChartIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { useEnrollments } from "@/src/lib/hooks/use-enrollments";
import {
  useGrades,
  useCreateGrade,
  useUpdateGrade,
} from "@/src/lib/hooks/use-grades";
import {
  AssessmentKind,
  EnrollmentStatus,
  GradeResponse,
  CreateGradeDto,
} from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";
import toast from "react-hot-toast";

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

  const [isAddAssessmentDialogOpen, setIsAddAssessmentDialogOpen] =
    useState(false);
  const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeResponse | null>(null);
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    assessment: string;
  } | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [error, setError] = useState("");

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
      setError("Assessment name is required");
      return;
    }

    // Create the assessment by adding a grade for the first student with score 0
    // This creates the column in the gradebook
    const firstStudent = enrollments[0];
    if (!firstStudent) {
      setError("No students enrolled");
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
    setEditFeedback(grade.metadata?.feedback || grade.metadata?.teacherFeedback || "");
    setIsEditGradeDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGrade) return;

    try {
      const updateData: any = {
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
        const { feedback, teacherFeedback, ...restMetadata } = editingGrade.metadata;
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
                <Button size={{ initial: "2", sm: "3" }} className="w-full sm:w-auto">
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
                  {editingGrade && `${t("grades.student")}: ${enrollments.find(e => e.studentId === editingGrade.studentId)?.studentName || ""}`}
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
                      type="number"
                      value={editScore}
                      onChange={(e) => setEditScore(e.target.value)}
                      min="0"
                      step="0.1"
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
                  {editingCell && `${t("grades.student")}: ${enrollments.find(e => e.studentId === editingCell.studentId)?.studentName || ""}`}
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
                      type="number"
                      value={newScore}
                      onChange={(e) => setNewScore(e.target.value)}
                      min="0"
                      step="0.1"
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
                      const assessmentContent = getAssessmentContent(assessment);
                      const assessmentName = assessment.split(":")[1];
                      
                      return (
                        <Table.ColumnHeaderCell key={assessment}>
                          {assessmentContent ? (
                            <Tooltip content={assessmentContent}>
                              <Flex align="center" gap="2" style={{ cursor: "help" }}>
                                <FileTextIcon width="14" height="14" />
                                {assessmentName}
                              </Flex>
                            </Tooltip>
                          ) : (
                            <Flex align="center" gap="2">
                              <FileTextIcon width="14" height="14" />
                              {assessmentName}
                            </Flex>
                          )}
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
                          <Flex align="center" gap="2" className="table-cell-with-icon">
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
                                  {grade.metadata?.feedback || grade.metadata?.teacherFeedback ? (
                                    <Tooltip content={grade.metadata.feedback || grade.metadata.teacherFeedback}>
                                      <ChatBubbleIcon 
                                        width="14" 
                                        height="14" 
                                        style={{ 
                                          color: "var(--accent-9)", 
                                          cursor: "help",
                                          flexShrink: 0 
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
    </Box>
  );
}
