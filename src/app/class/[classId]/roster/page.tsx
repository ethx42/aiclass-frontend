"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  PlusIcon,
  TrashIcon,
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

export default function RosterPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { data: classData } = useClass(classId);
  const { data: enrollmentsData, isLoading } = useEnrollments({
    classId,
    page: 0,
    size: 100,
  });
  const createEnrollment = useCreateEnrollment();
  const deleteEnrollment = useDeleteEnrollment();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [error, setError] = useState("");

  const enrollments = enrollmentsData?.data?.content || [];

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

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setSearchQuery(student.fullName || student.email || "");
    setSearchResults([]);
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      setError("Please select a student");
      return;
    }

    setError("");

    try {
      await createEnrollment.mutateAsync({
        classId,
        studentId: selectedStudent.id,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      });

      setSearchQuery("");
      setSelectedStudent(null);
      setSearchResults([]);
      setIsAddDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add student";
      setError(errorMessage);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSearchQuery("");
      setSelectedStudent(null);
      setSearchResults([]);
      setError("");
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      try {
        await deleteEnrollment.mutateAsync(enrollmentId);
      } catch (err) {
        console.error("Failed to remove student:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Box p="6">
      <Box mb="6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon /> Back to Class
        </Button>
      </Box>

      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Box>
              <Heading size="6" mb="1">
                Class Roster
              </Heading>
              <Text size="2" color="gray">
                {classData?.data?.subjectCode} - {classData?.data?.subjectName}
              </Text>
            </Box>
            <Dialog.Root
              open={isAddDialogOpen}
              onOpenChange={handleDialogOpenChange}
            >
              <Dialog.Trigger>
                <Button>
                  <PlusIcon /> Add Student
                </Button>
              </Dialog.Trigger>

              <Dialog.Content style={{ maxWidth: 500, overflow: "visible" }}>
                <Dialog.Title>Add Student</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  Search for a student by name or email to add them to this
                  class.
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
                      Search Student
                    </Text>
                    <TextField.Root
                      placeholder="Type name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Flex align="center" gap="2" mt="1">
                      {isSearching && (
                        <>
                          <Spinner size="1" />
                          <Text size="1" color="gray">
                            Searching...
                          </Text>
                        </>
                      )}
                      {searchQuery.length > 0 && searchQuery.length < 2 && (
                        <Text size="1" color="gray">
                          Type at least 2 characters
                        </Text>
                      )}
                      {searchQuery.length >= 2 &&
                        !isSearching &&
                        searchResults.length === 0 && (
                          <Text size="1" color="gray">
                            No students found
                          </Text>
                        )}
                    </Flex>
                  </Box>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <Box>
                      <Text size="2" weight="bold" mb="2">
                        Select a student:
                      </Text>
                      <Box
                        style={{
                          border: "1px solid var(--gray-6)",
                          borderRadius: "var(--radius-3)",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {searchResults.map((student) => (
                          <Box
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            style={{
                              padding: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--gray-4)",
                              backgroundColor:
                                selectedStudent?.id === student.id
                                  ? "var(--accent-3)"
                                  : "transparent",
                            }}
                            className="hover:bg-gray-2"
                          >
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
                        ))}
                      </Box>
                    </Box>
                  )}

                  {selectedStudent && (
                    <Card style={{ backgroundColor: "var(--accent-2)" }}>
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">
                          Selected: {selectedStudent.fullName}
                        </Text>
                        <Text size="1" color="gray">
                          {selectedStudent.email}
                        </Text>
                      </Flex>
                    </Card>
                  )}

                  <Flex gap="3" justify="end" mt="2">
                    <Dialog.Close>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={handleAddStudent}
                      disabled={createEnrollment.isPending || !selectedStudent}
                    >
                      {createEnrollment.isPending ? "Adding..." : "Add Student"}
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
              style={{ padding: "40px" }}
            >
              <Text color="gray">No students enrolled yet</Text>
              <Button variant="soft" onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon /> Add First Student
              </Button>
            </Flex>
          ) : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Enrolled Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {enrollments.map((enrollment) => (
                  <Table.Row key={enrollment.id}>
                    <Table.Cell>
                      <Text weight="bold">{enrollment.studentName}</Text>
                    </Table.Cell>
                    <Table.Cell>{enrollment.studentEmail}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          enrollment.enrollmentStatus ===
                          EnrollmentStatus.ACTIVE
                            ? "green"
                            : "gray"
                        }
                      >
                        {enrollment.enrollmentStatus}
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
                        onClick={() => handleRemoveStudent(enrollment.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>
    </Box>
  );
}
