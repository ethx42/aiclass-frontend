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
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    assessment: string;
  } | null>(null);
  const [editScore, setEditScore] = useState("");
  const [newScore, setNewScore] = useState("");
  const [error, setError] = useState("");

  const [assessmentFormData, setAssessmentFormData] =
    useState<AssessmentFormData>({
      assessmentKind: AssessmentKind.EXAM,
      assessmentName: "",
      maxScore: 100,
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
      await createGrade.mutateAsync({
        classId,
        studentId: firstStudent.studentId,
        assessmentKind: assessmentFormData.assessmentKind,
        assessmentName: assessmentFormData.assessmentName,
        score: 0,
        maxScore: assessmentFormData.maxScore,
        gradedAt: new Date().toISOString(),
      });
      setIsAddAssessmentDialogOpen(false);
      setAssessmentFormData({
        assessmentKind: AssessmentKind.EXAM,
        assessmentName: "",
        maxScore: 100,
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
    setEditingGradeId(grade.id);
    setEditScore(grade.score.toString());
  };

  const handleSaveEdit = async (gradeId: string) => {
    try {
      await updateGrade.mutateAsync({
        id: gradeId,
        data: {
          score: parseFloat(editScore),
        },
      });
      setEditingGradeId(null);
      setEditScore("");
      toast.success(t("grades.gradeUpdated"));
    } catch (err) {
      console.error("Failed to update grade:", err);
      toast.error(t("grades.failedToUpdate"));
    }
  };

  const handleCancelEdit = () => {
    setEditingGradeId(null);
    setEditScore("");
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
      await createGrade.mutateAsync({
        classId,
        studentId: editingCell.studentId,
        assessmentKind: kind as AssessmentKind,
        assessmentName: name,
        score: parseFloat(newScore),
        maxScore,
        gradedAt: new Date().toISOString(),
      });
      setEditingCell(null);
      setNewScore("");
      toast.success(t("grades.gradeAdded"));
    } catch (err) {
      console.error("Failed to add grade:", err);
      toast.error(t("grades.failedToAdd"));
    }
  };

  const handleCancelNewGrade = () => {
    setEditingCell(null);
    setNewScore("");
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
                    {assessments.map((assessment) => (
                      <Table.ColumnHeaderCell key={assessment}>
                        <Flex align="center" gap="2">
                          <FileTextIcon width="14" height="14" />
                          {assessment.split(":")[1]}
                        </Flex>
                      </Table.ColumnHeaderCell>
                    ))}
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
                                  {editingGradeId === grade.id ? (
                                    <>
                                      <TextField.Root
                                        size="1"
                                        type="number"
                                        value={editScore}
                                        onChange={(e) =>
                                          setEditScore(e.target.value)
                                        }
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSaveEdit(grade.id);
                                          } else if (e.key === "Escape") {
                                            e.preventDefault();
                                            handleCancelEdit();
                                          }
                                        }}
                                        style={{ width: "60px" }}
                                        step="0.1"
                                        autoFocus
                                      />
                                      <IconButton
                                        size="1"
                                        variant="soft"
                                        color="green"
                                        onClick={() => handleSaveEdit(grade.id)}
                                      >
                                        <CheckIcon />
                                      </IconButton>
                                      <IconButton
                                        size="1"
                                        variant="soft"
                                        color="red"
                                        onClick={handleCancelEdit}
                                      >
                                        <Cross2Icon />
                                      </IconButton>
                                    </>
                                  ) : (
                                    <>
                                      <Text>{grade.score}</Text>
                                      <IconButton
                                        size="1"
                                        variant="ghost"
                                        onClick={() => handleEditGrade(grade)}
                                      >
                                        <Pencil1Icon />
                                      </IconButton>
                                    </>
                                  )}
                                </Flex>
                              ) : isEditingThisCell ? (
                                <Flex align="center" gap="2">
                                  <TextField.Root
                                    size="1"
                                    type="number"
                                    value={newScore}
                                    onChange={(e) =>
                                      setNewScore(e.target.value)
                                    }
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newScore) {
                                        e.preventDefault();
                                        handleSaveNewGrade();
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        handleCancelNewGrade();
                                      }
                                    }}
                                    placeholder="Score"
                                    style={{ width: "60px" }}
                                    step="0.1"
                                    autoFocus
                                  />
                                  <IconButton
                                    size="1"
                                    variant="soft"
                                    color="green"
                                    onClick={handleSaveNewGrade}
                                    disabled={!newScore}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                  <IconButton
                                    size="1"
                                    variant="soft"
                                    color="red"
                                    onClick={handleCancelNewGrade}
                                  >
                                    <Cross2Icon />
                                  </IconButton>
                                </Flex>
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
