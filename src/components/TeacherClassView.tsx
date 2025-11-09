'use client';

import { useState } from 'react';
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
} from '@radix-ui/themes';
import { PlusIcon, InfoCircledIcon, Pencil1Icon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useEnrollments } from '@/src/lib/hooks/use-enrollments';
import { useGrades, useCreateGrade, useUpdateGrade } from '@/src/lib/hooks/use-grades';
import { AssessmentKind, EnrollmentStatus, GradeResponse } from '@/src/types/api';

interface TeacherClassViewProps {
  classId: string;
}

interface GradeFormData {
  studentId: string;
  assessmentKind: AssessmentKind;
  assessmentName: string;
  score: number;
  maxScore: number;
}

export function TeacherClassView({ classId }: TeacherClassViewProps) {
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useEnrollments({
    classId,
    status: EnrollmentStatus.ACTIVE,
    page: 0,
    size: 100,
  });

  const { data: gradesData, isLoading: loadingGrades } = useGrades({ classId, page: 0, size: 1000 });

  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();

  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);
  const [isAddAssessmentDialogOpen, setIsAddAssessmentDialogOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ studentId: string; assessment: string } | null>(null);
  const [editScore, setEditScore] = useState('');
  const [newScore, setNewScore] = useState('');
  const [error, setError] = useState('');

  const [gradeFormData, setGradeFormData] = useState<GradeFormData>({
    studentId: '',
    assessmentKind: AssessmentKind.EXAM,
    assessmentName: '',
    score: 0,
    maxScore: 100,
  });

  const [assessmentFormData, setAssessmentFormData] = useState({
    assessmentKind: AssessmentKind.EXAM,
    assessmentName: '',
    maxScore: 100,
  });

  const enrollments = enrollmentsData?.data?.content || [];
  const grades = gradesData?.data?.content || [];

  const handleAddGrade = async () => {
    setError('');
    try {
      await createGrade.mutateAsync({
        classId,
        ...gradeFormData,
        gradedAt: new Date().toISOString(),
      });
      setIsAddGradeDialogOpen(false);
      setGradeFormData({
        studentId: '',
        assessmentKind: AssessmentKind.EXAM,
        assessmentName: '',
        score: 0,
        maxScore: 100,
      });
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to add grade';
      setError(errorMessage);
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
      setEditScore('');
    } catch (err) {
      console.error('Failed to update grade:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingGradeId(null);
    setEditScore('');
  };

  const handleAddAssessment = async () => {
    setError('');
    // This creates the assessment column (will show as "-" for all students initially)
    // The assessment will appear once any student has a grade for it
    setIsAddAssessmentDialogOpen(false);
    setAssessmentFormData({
      assessmentKind: AssessmentKind.EXAM,
      assessmentName: '',
      maxScore: 100,
    });
  };

  const handleCellClick = (studentId: string, assessment: string) => {
    setEditingCell({ studentId, assessment });
    setNewScore('');
  };

  const handleSaveNewGrade = async () => {
    if (!editingCell) return;

    const [kind, name] = editingCell.assessment.split(':');
    const assessment = assessments.find((a) => a === editingCell.assessment);
    
    // Get maxScore from existing grade with this assessment or use default
    const existingGrade = grades.find((g) => `${g.assessmentKind}:${g.assessmentName}` === assessment);
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
      setNewScore('');
    } catch (err) {
      console.error('Failed to add grade:', err);
    }
  };

  const handleCancelNewGrade = () => {
    setEditingCell(null);
    setNewScore('');
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
      <Flex align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Box p="6">
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Box>
              <Text size="5" weight="bold">
                Gradebook
              </Text>
              <Text size="2" color="gray">
                {enrollments.length} students enrolled · Click on empty cells (-) to add grades
              </Text>
            </Box>
            <Dialog.Root open={isAddGradeDialogOpen} onOpenChange={setIsAddGradeDialogOpen}>
              <Dialog.Trigger>
                <Button>
                  <PlusIcon /> Add Grade
                </Button>
              </Dialog.Trigger>

              <Dialog.Content style={{ maxWidth: 500 }}>
                <Dialog.Title>Add Grade</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  Enter grade information for a student
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
                      Student
                    </Text>
                    <Select.Root
                      value={gradeFormData.studentId}
                      onValueChange={(value) =>
                        setGradeFormData({ ...gradeFormData, studentId: value })
                      }
                    >
                      <Select.Trigger placeholder="Select student" style={{ width: '100%' }} />
                      <Select.Content>
                        {enrollments.map((enrollment) => (
                          <Select.Item key={enrollment.studentId} value={enrollment.studentId}>
                            {enrollment.studentName}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      Assessment Type
                    </Text>
                    <Select.Root
                      value={gradeFormData.assessmentKind}
                      onValueChange={(value) =>
                        setGradeFormData({
                          ...gradeFormData,
                          assessmentKind: value as AssessmentKind,
                        })
                      }
                    >
                      <Select.Trigger style={{ width: '100%' }} />
                      <Select.Content>
                        <Select.Item value={AssessmentKind.EXAM}>Exam</Select.Item>
                        <Select.Item value={AssessmentKind.QUIZ}>Quiz</Select.Item>
                        <Select.Item value={AssessmentKind.HOMEWORK}>Homework</Select.Item>
                        <Select.Item value={AssessmentKind.PROJECT}>Project</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      Assessment Name
                    </Text>
                    <TextField.Root
                      placeholder="e.g., Midterm Exam"
                      value={gradeFormData.assessmentName}
                      onChange={(e) =>
                        setGradeFormData({ ...gradeFormData, assessmentName: e.target.value })
                      }
                    />
                  </Box>

                  <Flex gap="3">
                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" weight="bold" mb="1">
                        Score
                      </Text>
                      <TextField.Root
                        type="number"
                        value={gradeFormData.score.toString()}
                        onChange={(e) =>
                          setGradeFormData({
                            ...gradeFormData,
                            score: parseFloat(e.target.value),
                          })
                        }
                        min="0"
                        step="0.1"
                      />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" weight="bold" mb="1">
                        Max Score
                      </Text>
                      <TextField.Root
                        type="number"
                        value={gradeFormData.maxScore.toString()}
                        onChange={(e) =>
                          setGradeFormData({
                            ...gradeFormData,
                            maxScore: parseFloat(e.target.value),
                          })
                        }
                        min="1"
                        step="0.1"
                      />
                    </Box>
                  </Flex>

                  <Flex gap="3" justify="end" mt="2">
                    <Dialog.Close>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={handleAddGrade}
                      disabled={
                        createGrade.isPending ||
                        !gradeFormData.studentId ||
                        !gradeFormData.assessmentName
                      }
                    >
                      {createGrade.isPending ? 'Adding...' : 'Add Grade'}
                    </Button>
                  </Flex>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          {enrollments.length === 0 ? (
            <Text color="gray" style={{ textAlign: 'center', padding: '40px' }}>
              No students enrolled. Add students from the roster page.
            </Text>
          ) : grades.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              style={{ padding: '40px' }}
            >
              <Text color="gray">No grades yet</Text>
              <Button variant="soft" onClick={() => setIsAddGradeDialogOpen(true)}>
                <PlusIcon /> Add First Grade
              </Button>
            </Flex>
          ) : (
            <Box style={{ overflowX: 'auto' }}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Student</Table.ColumnHeaderCell>
                    {assessments.map((assessment) => (
                      <Table.ColumnHeaderCell key={assessment}>
                        {assessment.split(':')[1]}
                      </Table.ColumnHeaderCell>
                    ))}
                    <Table.ColumnHeaderCell>Average</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {enrollments.map((enrollment) => {
                    const studentGrades = gradesByStudent[enrollment.studentId] || [];
                    const average =
                      studentGrades.length > 0
                        ? (
                            studentGrades.reduce(
                              (sum, g) => sum + (g.score / g.maxScore) * 100,
                              0
                            ) / studentGrades.length
                          ).toFixed(1)
                        : '-';

                    return (
                      <Table.Row key={enrollment.id}>
                        <Table.Cell>
                          <Text weight="bold">{enrollment.studentName}</Text>
                        </Table.Cell>
                        {assessments.map((assessment) => {
                          const grade = studentGrades.find(
                            (g) => `${g.assessmentKind}:${g.assessmentName}` === assessment
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
                                        onChange={(e) => setEditScore(e.target.value)}
                                        style={{ width: '60px' }}
                                        step="0.1"
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
                                      <Text>
                                        {grade.score}/{grade.maxScore}
                                      </Text>
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
                                    onChange={(e) => setNewScore(e.target.value)}
                                    placeholder="Score"
                                    style={{ width: '60px' }}
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
                                  onClick={() => handleCellClick(enrollment.studentId, assessment)}
                                  style={{
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
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
                          <Text weight="bold">{average}%</Text>
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

