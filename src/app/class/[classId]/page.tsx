"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Callout,
  Dialog,
  Text,
  TextField,
  Select,
  DropdownMenu,
  AlertDialog,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import {
  useClass,
  useUpdateClass,
  useDeleteClass,
} from "@/src/lib/hooks/use-classes";
import { useSubjects } from "@/src/lib/hooks/use-subjects";
import { useEnrollments } from "@/src/lib/hooks/use-enrollments";
import { UserRole, Semester, ClassResponse } from "@/src/types/api";
import { TeacherClassView } from "@/src/components/TeacherClassView";
import { StudentClassView } from "@/src/components/StudentClassView";
import { useT } from "@/src/lib/i18n/provider";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useT();
  const classId = params.classId as string;
  const user = useAuthStore((state) => state.user);

  // Teachers fetch class directly, students get it through enrollments
  const isTeacher = user?.role === UserRole.TEACHER;

  // Only teachers can fetch class directly
  const shouldFetchClass = isTeacher && !!classId;
  const {
    data: classDataTeacher,
    isLoading: loadingClass,
    error: classError,
  } = useClass(shouldFetchClass ? classId : "");

  // Students get ALL their enrollments (backend doesn't allow filtering by classId for students)
  const shouldFetchEnrollments = !isTeacher && !!user?.id;
  const {
    data: enrollmentsData,
    isLoading: loadingEnrollments,
    error: enrollmentError,
  } = useEnrollments({
    studentId: shouldFetchEnrollments ? user?.id : undefined,
    page: 0,
    size: 100, // Get all enrollments to find the one for this class
  });

  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  // Determine loading and error states
  const isLoading = isTeacher ? loadingClass : loadingEnrollments;
  const error = isTeacher ? classError : enrollmentError;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [formData, setFormData] = useState({
    subjectId: "",
    year: 0,
    semester: Semester.SPRING,
    groupCode: "",
    schedule: "",
  });

  // Get class data based on role
  let classData: ClassResponse | undefined;

  if (isTeacher) {
    classData = classDataTeacher?.data;
  } else {
    // For students, find the enrollment for this specific class
    const enrollments = enrollmentsData?.data?.content || [];
    const enrollment = enrollments.find((e) => e.classId === classId);

    if (enrollment) {
      classData = {
        id: enrollment.classId,
        subjectId: enrollment.subjectId || "",
        subjectCode: enrollment.subjectCode || "N/A",
        subjectName: enrollment.subjectName || enrollment.className,
        teacherId: enrollment.teacherId || "",
        teacherName: enrollment.teacherName || "",
        year: enrollment.year || new Date().getFullYear(),
        semester: enrollment.semester || Semester.FALL,
        groupCode: enrollment.groupCode || "",
        schedule: enrollment.schedule,
        metadata: undefined,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      };
    }
  }

  const subjects = subjectsData?.data?.content || [];

  const handleEditClick = () => {
    if (classData) {
      setFormData({
        subjectId: classData.subjectId,
        year: classData.year,
        semester: classData.semester as Semester,
        groupCode: classData.groupCode,
        schedule: classData.schedule || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    setEditError("");
    try {
      await updateClass.mutateAsync({
        id: classId,
        data: formData,
      });
      setIsEditDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("class.failedToLoad");
      setEditError(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClass.mutateAsync(classId);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete class:", err);
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
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
          <Callout.Text>
            {isTeacher
              ? t("class.failedToLoad")
              : t("class.notEnrolledInClass")}
          </Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  if (!classData) {
    return (
      <Box p="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>{t("class.classNotFound")}</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        style={{
          borderBottom: "1px solid var(--gray-6)",
          background: "var(--color-background)",
        }}
      >
        <Flex direction="column" gap="3" px="6" py="4">
          <Button
            variant="ghost"
            style={{ width: "fit-content" }}
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeftIcon /> {t("navigation.backToDashboard")}
          </Button>

          <Flex justify="between" align="center">
            <Box>
              <Heading size="7" mb="1">
                {classData.subjectCode} - {classData.subjectName}
              </Heading>
              <Flex
                gap="2"
                style={{ fontSize: "14px", color: "var(--gray-11)" }}
              >
                <span>
                  {t(`class.${classData.semester?.toLowerCase() || "fall"}`)}{" "}
                  {classData.year}
                </span>
                <span>•</span>
                <span>
                  {t("class.group")} {classData.groupCode}
                </span>
                {classData.schedule && (
                  <>
                    <span>•</span>
                    <span>{classData.schedule}</span>
                  </>
                )}
              </Flex>
            </Box>

            {user?.role === UserRole.TEACHER && (
              <Flex gap="2">
                <Button
                  variant="soft"
                  onClick={() => router.push(`/class/${classId}/roster`)}
                >
                  {t("class.manageRoster")}
                </Button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button variant="soft" color="gray">
                      <DotsVerticalIcon />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={handleEditClick}>
                      <Pencil1Icon /> {t("class.editClass")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      color="red"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <TrashIcon /> {t("class.deleteClass")}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      {user?.role === UserRole.TEACHER ? (
        <TeacherClassView classId={classId} />
      ) : (
        <StudentClassView classId={classId} />
      )}

      {/* Edit Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>{t("class.editClass")}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {t("class.updateClassDetails")}
          </Dialog.Description>

          <Flex direction="column" gap="3">
            {editError && (
              <Callout.Root color="red" size="1">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{editError}</Callout.Text>
              </Callout.Root>
            )}

            {/* Subject Selection */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("class.subject")} *
              </Text>
              <Select.Root
                value={formData.subjectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subjectId: value })
                }
                required
              >
                <Select.Trigger
                  placeholder={t("class.selectSubject")}
                  style={{ width: "100%" }}
                />
                <Select.Content>
                  {loadingSubjects ? (
                    <Select.Item value="loading" disabled>
                      {t("common.loading")}
                    </Select.Item>
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
                {t("class.year")} *
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
                {t("class.semester")} *
              </Text>
              <Select.Root
                value={formData.semester}
                onValueChange={(value) =>
                  setFormData({ ...formData, semester: value as Semester })
                }
                required
              >
                <Select.Trigger style={{ width: "100%" }} />
                <Select.Content>
                  <Select.Item value={Semester.SPRING}>
                    {t("class.spring")}
                  </Select.Item>
                  <Select.Item value={Semester.SUMMER}>
                    {t("class.summer")}
                  </Select.Item>
                  <Select.Item value={Semester.FALL}>
                    {t("class.fall")}
                  </Select.Item>
                  <Select.Item value={Semester.WINTER}>
                    {t("class.winter")}
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Group Code */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("class.groupCode")} *
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
                {t("class.schedule")} ({t("class.optional")})
              </Text>
              <TextField.Root
                placeholder="e.g., Mon/Wed/Fri 10:00-11:30"
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
              />
            </Box>

            <Flex gap="3" justify="end" mt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  {t("common.cancel")}
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleEditSubmit}
                disabled={
                  updateClass.isPending ||
                  !formData.subjectId ||
                  !formData.groupCode ||
                  !formData.year
                }
              >
                {updateClass.isPending
                  ? t("class.saving")
                  : t("common.save") + " " + t("class.class")}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialog.Content style={{ maxWidth: 450 }}>
          <AlertDialog.Title>{t("class.deleteClass")}</AlertDialog.Title>
          <AlertDialog.Description size="2">
            {t("class.deleteConfirm")}
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {t("common.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDelete}
                disabled={deleteClass.isPending}
              >
                {deleteClass.isPending
                  ? t("class.deleting")
                  : t("class.deleteClass")}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
