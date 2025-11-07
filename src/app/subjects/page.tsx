"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  IconButton,
  AlertDialog,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/src/lib/hooks/use-subjects";
import { UserRole, Subject } from "@/src/types/api";

export default function SubjectsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: subjectsData, isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const [createFormData, setCreateFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    code: "",
    name: "",
    description: "",
  });

  const [deleteSubjectId, setDeleteSubjectId] = useState("");

  const subjects = subjectsData?.data?.content || [];

  // Redirect if not a teacher
  if (user?.role !== UserRole.TEACHER) {
    router.push("/dashboard");
    return null;
  }

  const handleCreateClick = () => {
    setCreateFormData({ code: "", name: "", description: "" });
    setError("");
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (subject: Subject) => {
    setEditFormData({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
    });
    setError("");
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (subjectId: string) => {
    setDeleteSubjectId(subjectId);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    setError("");

    try {
      await createSubject.mutateAsync(createFormData);
      setIsCreateDialogOpen(false);
      setCreateFormData({ code: "", name: "", description: "" });
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create subject";
      setError(errorMessage);
    }
  };

  const handleEditSubmit = async () => {
    setError("");

    try {
      await updateSubject.mutateAsync({
        id: editFormData.id,
        data: {
          name: editFormData.name,
          description: editFormData.description,
        },
      });
      setIsEditDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update subject";
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubject.mutateAsync(deleteSubjectId);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete subject:", err);
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
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeftIcon /> Back to Dashboard
        </Button>
      </Box>

      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Box>
              <Heading size="6" mb="1">
                Manage Subjects
              </Heading>
              <Text size="2" color="gray">
                Create and manage course subjects
              </Text>
            </Box>
            <Button onClick={handleCreateClick}>
              <PlusIcon /> Create Subject
            </Button>
          </Flex>

          {subjects.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              style={{ padding: "40px" }}
            >
              <Text color="gray">No subjects yet</Text>
              <Button variant="soft" onClick={handleCreateClick}>
                <PlusIcon /> Create First Subject
              </Button>
            </Flex>
          ) : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {subjects.map((subject) => (
                  <Table.Row key={subject.id}>
                    <Table.Cell>
                      <Text weight="bold">{subject.code}</Text>
                    </Table.Cell>
                    <Table.Cell>{subject.name}</Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {subject.description || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <IconButton
                          size="1"
                          variant="soft"
                          onClick={() => handleEditClick(subject)}
                        >
                          <Pencil1Icon />
                        </IconButton>
                        <IconButton
                          size="1"
                          variant="soft"
                          color="red"
                          onClick={() => handleDeleteClick(subject.id)}
                        >
                          <TrashIcon />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>

      {/* Create Subject Dialog */}
      <Dialog.Root
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Create Subject</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Add a new course subject
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
                Subject Code *
              </Text>
              <TextField.Root
                placeholder="e.g., CS101"
                value={createFormData.code}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, code: e.target.value })
                }
                required
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Subject Name *
              </Text>
              <TextField.Root
                placeholder="e.g., Introduction to Computer Science"
                value={createFormData.name}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, name: e.target.value })
                }
                required
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Description (Optional)
              </Text>
              <TextField.Root
                placeholder="Brief description of the subject"
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    description: e.target.value,
                  })
                }
              />
            </Box>

            <Flex gap="3" justify="end" mt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleCreateSubmit}
                disabled={
                  createSubject.isPending ||
                  !createFormData.code ||
                  !createFormData.name
                }
              >
                {createSubject.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Edit Subject Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Edit Subject</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Update subject details
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
                Subject Code
              </Text>
              <TextField.Root value={editFormData.code} disabled />
              <Text size="1" color="gray" mt="1">
                Code cannot be changed
              </Text>
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Subject Name *
              </Text>
              <TextField.Root
                placeholder="e.g., Introduction to Computer Science"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                Description (Optional)
              </Text>
              <TextField.Root
                placeholder="Brief description of the subject"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
              />
            </Box>

            <Flex gap="3" justify="end" mt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleEditSubmit}
                disabled={updateSubject.isPending || !editFormData.name}
              >
                {updateSubject.isPending ? "Saving..." : "Save Changes"}
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
          <AlertDialog.Title>Delete Subject</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to delete this subject? This action cannot be
            undone. All classes using this subject may be affected.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDelete}
                disabled={deleteSubject.isPending}
              >
                {deleteSubject.isPending ? "Deleting..." : "Delete Subject"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
