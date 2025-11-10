"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Table,
  Text,
  TextField,
  Spinner,
  Callout,
  Badge,
  Dialog,
  AlertDialog,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useClass } from "@/src/lib/hooks/use-classes";
import {
  useEnrollments,
  useCreateEnrollment,
  useDeleteEnrollment,
} from "@/src/lib/hooks/use-enrollments";
import { usersApi } from "@/src/lib/api/users";
import {
  EnrollmentStatus,
  User,
  UserRole,
  roleToApiFormat,
} from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";

export default function RosterPage() {
  const params = useParams();
  const router = useRouter();
  const t = useT();
  const classId = params.classId as string;

  const { data: classData } = useClass(classId);
  const {
    data: enrollmentsData,
    isLoading,
    isFetching,
  } = useEnrollments({
    classId,
    page: 0,
    size: 100,
  });
  const createEnrollment = useCreateEnrollment();
  const deleteEnrollment = useDeleteEnrollment();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<string | null>(
    null
  );
  const [studentNameToDelete, setStudentNameToDelete] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const enrollments = enrollmentsData?.data?.content || [];

  // Open select and focus input when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      // Open the select automatically when dialog opens
      setIsStudentSelectOpen(true);
      // Focus the input after a short delay to ensure everything is rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 150);
    }
  }, [isAddDialogOpen]);

  // Focus the search input when the select opens
  useEffect(() => {
    if (isStudentSelectOpen && searchInputRef.current && isAddDialogOpen) {
      // Small delay to ensure the Select.Content is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isStudentSelectOpen, isAddDialogOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isStudentSelectOpen &&
        dropdownRef.current &&
        searchInputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsStudentSelectOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isStudentSelectOpen) {
        setIsStudentSelectOpen(false);
        searchInputRef.current?.blur();
      }
    };

    if (isStudentSelectOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isStudentSelectOpen]);

  // Debug: Log search results changes
  useEffect(() => {
    console.log("searchResults updated:", searchResults);
  }, [searchResults]);

  // Debounce search function
  const debounceSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(async () => {
        if (query.trim().length < 2) {
          setSearchResults([]);
          return;
        }

        setIsSearching(true);
        try {
          const roleParam = roleToApiFormat(UserRole.STUDENT);
          console.log("Searching for:", query, "role:", roleParam);
          const response = await usersApi.search(query, roleParam);
          console.log("Search response:", response);

          if (response.success && response.data?.content) {
            // Filter out already enrolled students
            const enrolledIds = enrollments.map((e) => e.studentId);
            console.log("Enrolled IDs:", enrolledIds);
            const filteredResults = response.data.content.filter(
              (user) => !enrolledIds.includes(user.id)
            );
            console.log("Filtered results:", filteredResults);
            console.log(
              "Setting search results, count:",
              filteredResults.length
            );
            setSearchResults(filteredResults);
          } else {
            console.log("No data in response or response not successful");
          }
        } catch (err) {
          console.error("Search failed:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    },
    [enrollments]
  );

  useEffect(() => {
    const cleanup = debounceSearch(searchQuery);
    return cleanup;
  }, [searchQuery, debounceSearch]);

  const handleSelectStudent = (e: React.MouseEvent, student: User) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle selection: if already selected, remove it; otherwise add it
    const isAlreadySelected = selectedStudents.some((s) => s.id === student.id);

    if (isAlreadySelected) {
      setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const handleRemoveSelectedStudent = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== studentId));
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      setError(t("roster.selectStudentError"));
      return;
    }

    setError("");

    try {
      // Add all selected students
      await Promise.all(
        selectedStudents.map((student) =>
          createEnrollment.mutateAsync({
            classId,
            studentId: student.id,
            enrollmentStatus: EnrollmentStatus.ACTIVE,
          })
        )
      );

      setSearchQuery("");
      setSelectedStudents([]);
      setSearchResults([]);
      setIsAddDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add students";
      setError(errorMessage);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSearchQuery("");
      setSelectedStudents([]);
      setSearchResults([]);
      setError("");
      setIsStudentSelectOpen(false);
    }
  };

  const handleRemoveStudent = (enrollmentId: string, studentName: string) => {
    setEnrollmentToDelete(enrollmentId);
    setStudentNameToDelete(studentName);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!enrollmentToDelete) return;

    try {
      await deleteEnrollment.mutateAsync(enrollmentToDelete);
      setIsDeleteDialogOpen(false);
      // Don't clear enrollmentToDelete yet - wait for the list to update
      // It will be cleared when the enrollment is no longer in the list
    } catch (err) {
      console.error("Failed to remove student:", err);
      // Only clear on error
      setEnrollmentToDelete(null);
      setStudentNameToDelete(null);
    }
  };

  // Clear enrollmentToDelete when it's no longer in the list
  useEffect(() => {
    if (enrollmentToDelete && enrollmentsData?.data?.content) {
      const enrollmentExists = enrollmentsData.data.content.some(
        (e) => e.id === enrollmentToDelete
      );
      if (!enrollmentExists && !isFetching) {
        // Enrollment has been removed from the list and we're not fetching anymore
        setEnrollmentToDelete(null);
        setStudentNameToDelete(null);
      }
    }
  }, [enrollmentToDelete, enrollmentsData?.data?.content, isFetching]);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Box mb={{ initial: "4", sm: "6" }}>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          size={{ initial: "2", sm: "3" }}
        >
          <ArrowLeftIcon /> {t("navigation.backToClass")}
        </Button>
      </Box>

      <Card size={{ initial: "2", sm: "4" }}>
        <Flex direction="column" gap="4">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            justify="between"
            align={{ initial: "start", sm: "center" }}
            gap={{ initial: "3", sm: "0" }}
          >
            <Box>
              <Heading size={{ initial: "5", sm: "6" }} mb="1">
                {t("roster.classRoster")}
              </Heading>
              <Text size={{ initial: "2", sm: "2" }} color="gray">
                {classData?.data?.subjectCode} - {classData?.data?.subjectName}
              </Text>
            </Box>
            <Dialog.Root
              open={isAddDialogOpen}
              onOpenChange={handleDialogOpenChange}
            >
              <Dialog.Trigger>
                <Button
                  size={{ initial: "2", sm: "3" }}
                  className="w-full sm:w-auto"
                >
                  <PlusIcon /> {t("roster.addStudent")}
                </Button>
              </Dialog.Trigger>

              <Dialog.Content style={{ maxWidth: 500, overflow: "visible" }}>
                <Dialog.Title>{t("roster.addStudent")}</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  {t("roster.searchByNameOrEmail")}
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

                  {/* Student Selection */}
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      {t("roster.searchStudent")}
                    </Text>
                    <Box style={{ position: "relative", width: "100%" }}>
                      {/* Use TextField directly as the input */}
                      <TextField.Root
                        ref={searchInputRef}
                        placeholder={t("roster.typeNameOrEmail")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsStudentSelectOpen(true)}
                        onClick={() => setIsStudentSelectOpen(true)}
                        style={{ width: "100%" }}
                      >
                        <TextField.Slot>
                          <MagnifyingGlassIcon />
                        </TextField.Slot>
                      </TextField.Root>

                      {/* Results dropdown positioned relative to the TextField */}
                      {isStudentSelectOpen && (
                        <Box
                          ref={dropdownRef}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            width: "100%",
                            marginTop: "4px",
                            backgroundColor: "var(--color-background)",
                            border: "1px solid var(--gray-6)",
                            borderRadius: "var(--radius-3)",
                            boxShadow: "var(--shadow-4)",
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Filtered results - Auto height area */}
                          <Box
                            style={{
                              maxHeight: "400px",
                              overflowY: "auto",
                              minHeight: 0,
                            }}
                          >
                            {isSearching ? (
                              <Box p="3" style={{ textAlign: "center" }}>
                                <Spinner size="1" />
                                <Text
                                  size="2"
                                  color="gray"
                                  style={{ display: "block", marginTop: "8px" }}
                                >
                                  {t("roster.searching")}
                                </Text>
                              </Box>
                            ) : searchQuery.length > 0 &&
                              searchQuery.length < 2 ? (
                              <Box p="3" style={{ textAlign: "center" }}>
                                <Text size="2" color="gray">
                                  {t("roster.typeAtLeast2")}
                                </Text>
                              </Box>
                            ) : searchQuery.length >= 2 &&
                              searchResults.length === 0 ? (
                              <Box p="3" style={{ textAlign: "center" }}>
                                <Text size="2" color="gray">
                                  {t("roster.noStudentsFound")}
                                </Text>
                              </Box>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((student) => {
                                const isSelected = selectedStudents.some(
                                  (s) => s.id === student.id
                                );
                                return (
                                  <Box
                                    key={student.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectStudent(e, student);
                                    }}
                                    style={{
                                      padding: "12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid var(--gray-4)",
                                      backgroundColor: isSelected
                                        ? "var(--accent-3)"
                                        : "transparent",
                                    }}
                                    className="hover:bg-gray-2"
                                  >
                                    <Flex justify="between" align="center">
                                      <Box>
                                        <Text size="2" weight="bold">
                                          {student.fullName}
                                        </Text>
                                        <Text
                                          size="1"
                                          color="gray"
                                          style={{ display: "block" }}
                                        >
                                          {student.email}
                                        </Text>
                                      </Box>
                                      {isSelected && (
                                        <Badge color="blue">✓</Badge>
                                      )}
                                    </Flex>
                                  </Box>
                                );
                              })
                            ) : (
                              <Box p="3" style={{ textAlign: "center" }}>
                                <Text size="2" color="gray">
                                  {t("roster.typeAtLeast2")}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {selectedStudents.length > 0 && (
                    <Box>
                      <Flex justify="between" align="center" mb="2">
                        <Text size="2" weight="bold">
                          {t("roster.selected")} ({selectedStudents.length})
                        </Text>
                        <Button
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={() => setSelectedStudents([])}
                        >
                          {t("roster.clearSelection")}
                        </Button>
                      </Flex>
                      <Flex direction="column" gap="2">
                        {selectedStudents.map((student) => (
                          <Card
                            key={student.id}
                            style={{ backgroundColor: "var(--accent-2)" }}
                          >
                            <Flex justify="between" align="center">
                              <Flex direction="column" gap="1">
                                <Text size="2" weight="bold">
                                  {student.fullName}
                                </Text>
                                <Text size="1" color="gray">
                                  {student.email}
                                </Text>
                              </Flex>
                              <Button
                                size="1"
                                variant="ghost"
                                color="red"
                                onClick={() =>
                                  handleRemoveSelectedStudent(student.id)
                                }
                              >
                                ✕
                              </Button>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    </Box>
                  )}

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
                      onClick={handleAddStudents}
                      disabled={
                        createEnrollment.isPending ||
                        selectedStudents.length === 0
                      }
                      className="w-full sm:w-auto"
                    >
                      {createEnrollment.isPending
                        ? t("roster.adding")
                        : `${t("roster.addStudent")} (${
                            selectedStudents.length
                          })`}
                    </Button>
                  </Flex>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          {enrollments.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              className="p-6 sm:p-10"
            >
              <Text color="gray" size={{ initial: "2", sm: "3" }}>
                {t("roster.noStudentsEnrolled")}
              </Text>
              <Button
                variant="soft"
                onClick={() => setIsAddDialogOpen(true)}
                size={{ initial: "2", sm: "3" }}
              >
                <PlusIcon /> {t("roster.addFirstStudent")}
              </Button>
            </Flex>
          ) : (
            <Box style={{ overflowX: "auto" }}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>
                      {t("roster.name")}
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {t("roster.email")}
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {t("roster.status")}
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {t("roster.enrolledDate")}
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {t("roster.actions")}
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {enrollments.map((enrollment) => (
                    <Table.Row key={enrollment.id}>
                      <Table.Cell>
                        <Text weight="bold">{enrollment.studentName}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text color="gray">
                          {enrollment.studentEmail || "-"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={
                            enrollment.status === EnrollmentStatus.ACTIVE
                              ? "green"
                              : "gray"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="1"
                          variant="soft"
                          color="red"
                          onClick={() =>
                            handleRemoveStudent(
                              enrollment.id,
                              enrollment.studentName
                            )
                          }
                          disabled={
                            deleteEnrollment.isPending ||
                            (enrollmentToDelete === enrollment.id && isFetching)
                          }
                        >
                          {(deleteEnrollment.isPending ||
                            (enrollmentToDelete === enrollment.id &&
                              isFetching)) &&
                          enrollmentToDelete === enrollment.id ? (
                            <Spinner size="1" />
                          ) : (
                            <TrashIcon />
                          )}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Flex>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          // Prevent closing the dialog while deletion is in progress or list is updating
          if (
            !open &&
            (deleteEnrollment.isPending || (enrollmentToDelete && isFetching))
          ) {
            return;
          }
          setIsDeleteDialogOpen(open);
        }}
      >
        <AlertDialog.Content style={{ maxWidth: 500 }}>
          <AlertDialog.Title>{t("roster.removeStudent")}</AlertDialog.Title>
          <Box mb="3">
            {studentNameToDelete ? (
              <Flex direction="column" gap="2">
                <AlertDialog.Description size="2">
                  {t("roster.removeStudentConfirmMessage")}
                </AlertDialog.Description>
                <Box
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--red-3)",
                    borderRadius: "var(--radius-3)",
                    border: "1px solid var(--red-6)",
                  }}
                >
                  <Flex align="center" gap="2">
                    <Text size="3" weight="bold" color="red">
                      {studentNameToDelete}
                    </Text>
                  </Flex>
                </Box>
                <Text size="1" color="gray">
                  {t("roster.removeStudentWarning")}
                </Text>
              </Flex>
            ) : (
              <AlertDialog.Description size="2">
                {t("roster.removeStudentConfirm")}
              </AlertDialog.Description>
            )}
          </Box>

          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            mt="4"
            justify="end"
          >
            <AlertDialog.Cancel>
              <Button
                variant="soft"
                color="gray"
                className="w-full sm:w-auto"
                disabled={
                  deleteEnrollment.isPending ||
                  (!!enrollmentToDelete && isFetching)
                }
              >
                {t("common.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleConfirmDelete}
                disabled={
                  deleteEnrollment.isPending ||
                  (!!enrollmentToDelete && isFetching)
                }
                className="w-full sm:w-auto"
              >
                {deleteEnrollment.isPending ||
                (enrollmentToDelete && isFetching) ? (
                  <Flex align="center" gap="2">
                    <Spinner size="1" />
                    {t("roster.removing")}
                  </Flex>
                ) : (
                  t("roster.removeStudent")
                )}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
