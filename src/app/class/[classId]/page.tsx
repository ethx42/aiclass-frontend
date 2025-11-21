"use client";

import { useState, useMemo } from "react";
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
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import {
  useClass,
  useUpdateClass,
  useDeleteClass,
} from "@/src/lib/hooks/use-classes";
import { useSubjects } from "@/src/lib/hooks/use-subjects";
import { useEnrollments } from "@/src/lib/hooks/use-enrollments";
import { UserRole, Semester, ClassResponse, getSemesterDisplay } from "@/src/types/api";
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

  const currentYear = new Date().getFullYear();

  // Determine loading and error states
  const isLoading = isTeacher ? loadingClass : loadingEnrollments;
  const error = isTeacher ? classError : enrollmentError;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [isSubjectSelectOpen, setIsSubjectSelectOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: "",
    year: 0,
    semester: Semester.SUMMER,
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
        teacherEmail: enrollment.teacherEmail,
        year: enrollment.year || new Date().getFullYear(),
        semester: enrollment.semester || Semester.SUMMER,
        groupCode: enrollment.groupCode || "",
        schedule: enrollment.schedule,
        metadata: undefined,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      };
    }
  }

  // Filter subjects based on search query
  const filteredSubjects = useMemo(() => {
    const subjects = subjectsData?.data?.content || [];
    if (!subjectSearchQuery.trim()) {
      return subjects;
    }
    const query = subjectSearchQuery.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.code.toLowerCase().includes(query) ||
        subject.name.toLowerCase().includes(query)
    );
  }, [subjectsData?.data?.content, subjectSearchQuery]);

  const handleEditClick = () => {
    if (classData) {
      setFormData({
        subjectId: classData.subjectId,
        year: classData.year,
        semester: classData.semester as Semester,
        groupCode: classData.groupCode,
        schedule: classData.schedule || "",
      });
      setSubjectSearchQuery("");
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    setEditError("");

    // Validate year is not less than current year
    if (formData.year < currentYear) {
      setEditError(
        t("class.yearCannotBeLessThanCurrent") ||
          "Year cannot be less than the current year"
      );
      return;
    }

    // Validate year is not more than 2 years from current year
    if (formData.year > currentYear + 2) {
      setEditError(
        t("class.yearCannotBeMoreThanTwoYears") ||
          "Year cannot be more than 2 years from the current year"
      );
      return;
    }

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
      <Box p={{ initial: "4", sm: "6" }}>
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
      <Box p={{ initial: "4", sm: "6" }}>
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
        <Flex
          direction="column"
          gap="3"
          px={{ initial: "4", sm: "6" }}
          py={{ initial: "3", sm: "4" }}
        >
          <Button
            variant="ghost"
            style={{ width: "fit-content" }}
            onClick={() => router.push("/dashboard")}
            size={{ initial: "2", sm: "3" }}
          >
            <ArrowLeftIcon /> {t("navigation.backToDashboard")}
          </Button>

          <Flex
            direction={{ initial: "column", sm: "row" }}
            justify="between"
            align={{ initial: "start", sm: "center" }}
            gap={{ initial: "3", sm: "0" }}
          >
            <Box>
              <Heading size={{ initial: "5", sm: "7" }} mb="1">
                {classData.subjectCode} - {classData.subjectName}
              </Heading>
              <Flex
                direction={{ initial: "column", sm: "row" }}
                gap={{ initial: "1", sm: "2" }}
                wrap="wrap"
                style={{ fontSize: "14px", color: "var(--gray-11)" }}
              >
                <span>
                  {getSemesterDisplay(classData.semester || Semester.SUMMER)}{" "}
                  {classData.year}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  {t("class.group")} {classData.groupCode}
                </span>
                {classData.schedule && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{classData.schedule}</span>
                  </>
                )}
              </Flex>
            </Box>

            {user?.role === UserRole.TEACHER && (
              <Flex
                direction={{ initial: "column", sm: "row" }}
                gap={{ initial: "2", sm: "2" }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="soft"
                  onClick={() => router.push(`/class/${classId}/roster`)}
                  size={{ initial: "2", sm: "3" }}
                  className="w-full sm:w-auto"
                >
                  {t("class.manageRoster")}
                </Button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button
                      variant="soft"
                      color="gray"
                      size={{ initial: "2", sm: "3" }}
                    >
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
        <StudentClassView
          classId={classId}
          teacherName={classData.teacherName}
          teacherEmail={classData.teacherEmail}
        />
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
                onValueChange={(value) => {
                  setFormData({ ...formData, subjectId: value });
                  setIsSubjectSelectOpen(false);
                  setSubjectSearchQuery("");
                }}
                open={isSubjectSelectOpen}
                onOpenChange={setIsSubjectSelectOpen}
                required
              >
                <Select.Trigger
                  placeholder={t("class.selectSubject")}
                  style={{ width: "100%" }}
                />
                <Select.Content
                  style={{
                    width: "var(--radix-select-trigger-width)",
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  position="popper"
                >
                  {/* Search field - Fixed at top */}
                  <Box
                    p="2"
                    style={{
                      borderBottom: "1px solid var(--gray-6)",
                      flexShrink: 0,
                      backgroundColor: "var(--color-background)",
                    }}
                  >
                    <TextField.Root
                      placeholder={t("class.searchSubject")}
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        // Prevent closing the select when typing
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        // Prevent closing the select when clicking
                        e.stopPropagation();
                      }}
                      autoFocus={false}
                    >
                      <TextField.Slot>
                        <MagnifyingGlassIcon />
                      </TextField.Slot>
                    </TextField.Root>
                  </Box>

                  {/* Filtered results - Scrollable area */}
                  <Box style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                    {loadingSubjects ? (
                      <Box p="3" style={{ textAlign: "center" }}>
                        <Text size="2" color="gray">
                          {t("common.loading")}
                        </Text>
                      </Box>
                    ) : filteredSubjects.length === 0 ? (
                      <Box p="3" style={{ textAlign: "center" }}>
                        <Text size="2" color="gray">
                          {subjectSearchQuery
                            ? t("class.noSubjectsFound")
                            : t("class.noSubjectsAvailable")}
                        </Text>
                      </Box>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <Select.Item key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </Select.Item>
                      ))
                    )}
                  </Box>
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
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty or valid number input, max 4 digits
                  if (value === "" || /^\d+$/.test(value)) {
                    // Limit to 4 digits only
                    if (value.length <= 4) {
                      const yearValue = value === "" ? currentYear : parseInt(value);
                      setFormData({ ...formData, year: yearValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  const yearValue = parseInt(e.target.value) || currentYear;
                  const maxYear = currentYear + 2;
                  // If the value is less than current year, set it to current year
                  if (yearValue < currentYear) {
                    setFormData({
                      ...formData,
                      year: currentYear,
                    });
                  } else if (yearValue > maxYear) {
                    // If the value is more than 2 years from current, set it to max
                    setFormData({
                      ...formData,
                      year: maxYear,
                    });
                  }
                }}
                required
                min={currentYear.toString()}
                max={(currentYear + 2).toString()}
                maxLength={4}
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
                  <Select.Item value={Semester.SUMMER}>
                    A
                  </Select.Item>
                  <Select.Item value={Semester.WINTER}>
                    B
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
                placeholder={t("class.groupCodePlaceholder")}
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
                placeholder={t("class.schedulePlaceholder")}
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
              />
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
                  className="w-full sm:w-auto"
                >
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
                className="w-full sm:w-auto"
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

          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            mt="4"
            justify="end"
          >
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDelete}
                disabled={deleteClass.isPending}
                className="w-full sm:w-auto"
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
