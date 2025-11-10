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
import { useT } from "@/src/lib/i18n/provider";

export default function SubjectsPage() {
  const router = useRouter();
  const t = useT();
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
    <Box p={{ initial: "4", sm: "6" }}>
      <Box mb={{ initial: "4", sm: "6" }}>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          size={{ initial: "2", sm: "3" }}
        >
          <ArrowLeftIcon /> {t("navigation.backToDashboard")}
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
                {t("subjects.manageSubjects")}
              </Heading>
              <Text size={{ initial: "2", sm: "2" }} color="gray">
                {t("subjects.createAndManage")}
              </Text>
            </Box>
            <Button
              onClick={handleCreateClick}
              size={{ initial: "2", sm: "3" }}
              className="w-full sm:w-auto"
            >
              <PlusIcon /> {t("subjects.createSubject")}
            </Button>
          </Flex>

          {subjects.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              className="p-6 sm:p-10"
            >
              <Text color="gray" size={{ initial: "2", sm: "3" }}>
                {t("subjects.noSubjects")}
              </Text>
              <Button
                variant="soft"
                onClick={handleCreateClick}
                size={{ initial: "2", sm: "3" }}
              >
                <PlusIcon /> {t("subjects.createFirstSubject")}
              </Button>
            </Flex>
          ) : (
            <Box style={{ overflowX: "auto" }}>
              <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>
                    {t("subjects.code")}
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    {t("roster.name")}
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    {t("subjects.description")}
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    {t("roster.actions")}
                  </Table.ColumnHeaderCell>
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
            </Box>
          )}
        </Flex>
      </Card>

      {/* Create Subject Dialog */}
      <Dialog.Root
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>{t("subjects.createSubject")}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {t("subjects.addNewSubject")}
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
                {t("subjects.subjectCode")} *
              </Text>
              <TextField.Root
                placeholder={t("subjects.subjectCodePlaceholder")}
                value={createFormData.code}
                onChange={(e) => {
                  // Convert to uppercase and remove spaces
                  const value = e.target.value.toUpperCase().replace(/\s/g, "");
                  setCreateFormData({ ...createFormData, code: value });
                }}
                required
                style={{ textTransform: "uppercase" }}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("subjects.subjectName")} *
              </Text>
              <TextField.Root
                placeholder={t("subjects.subjectNamePlaceholder")}
                value={createFormData.name}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, name: e.target.value })
                }
                required
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("subjects.description")} ({t("class.optional")})
              </Text>
              <TextField.Root
                placeholder={t("subjects.descriptionPlaceholder")}
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    description: e.target.value,
                  })
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
                onClick={handleCreateSubmit}
                disabled={
                  createSubject.isPending ||
                  !createFormData.code ||
                  !createFormData.name
                }
                className="w-full sm:w-auto"
              >
                {createSubject.isPending
                  ? t("subjects.creating")
                  : t("subjects.createSubject")}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Edit Subject Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>
            {t("common.edit")} {t("class.subject")}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {t("subjects.updateSubjectDetails")}
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
                {t("subjects.subjectCode")}
              </Text>
              <TextField.Root value={editFormData.code} disabled />
              <Text size="1" color="gray" mt="1">
                {t("subjects.codeCannotChange")}
              </Text>
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("subjects.subjectName")} *
              </Text>
              <TextField.Root
                placeholder={t("subjects.subjectNamePlaceholder")}
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="1">
                {t("subjects.description")} ({t("class.optional")})
              </Text>
              <TextField.Root
                placeholder={t("subjects.descriptionPlaceholder")}
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
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
                disabled={updateSubject.isPending || !editFormData.name}
                className="w-full sm:w-auto"
              >
                {updateSubject.isPending
                  ? t("subjects.saving")
                  : t("common.save")}
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
          <AlertDialog.Title>{t("subjects.deleteSubject")}</AlertDialog.Title>
          <AlertDialog.Description size="2">
            {t("subjects.deleteSubjectConfirm")}
          </AlertDialog.Description>

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
              >
                {t("common.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDelete}
                disabled={deleteSubject.isPending}
                className="w-full sm:w-auto"
              >
                {deleteSubject.isPending
                  ? t("class.deleting")
                  : t("subjects.deleteSubject")}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
