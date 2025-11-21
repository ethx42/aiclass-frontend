"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Select,
  Button,
  Callout,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { useSubjects } from "@/src/lib/hooks/use-subjects";
import { useCreateClass } from "@/src/lib/hooks/use-classes";
import { Semester } from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";

export default function CreateClassPage() {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const createClass = useCreateClass();

  const [formData, setFormData] = useState({
    subjectId: "",
    year: new Date().getFullYear(),
    semester: Semester.SUMMER,
    groupCode: "",
    schedule: "",
  });

  const [error, setError] = useState("");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [isSubjectSelectOpen, setIsSubjectSelectOpen] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      await createClass.mutateAsync({
        ...formData,
        teacherId: user.id,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create class";
      setError(errorMessage);
    }
  };

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Box mb={{ initial: "4", sm: "6" }}>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          size={{ initial: "2", sm: "3" }}
        >
          <ArrowLeftIcon /> {t("common.back")}
        </Button>
      </Box>

      <Box style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Card size={{ initial: "2", sm: "4" }}>
          <Flex direction="column" gap="4">
            <Heading size={{ initial: "5", sm: "6" }}>
              {t("class.createNewClass")}
            </Heading>

            {error && (
              <Callout.Root color="red">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
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
                          onChange={(e) =>
                            setSubjectSearchQuery(e.target.value)
                          }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
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
                      <Select.Item value={Semester.SUMMER}>A</Select.Item>
                      <Select.Item value={Semester.WINTER}>B</Select.Item>
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
                    {t("class.schedule")}*
                  </Text>
                  <TextField.Root
                    placeholder={t("class.schedulePlaceholder")}
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    required
                  />
                </Box>

                <Flex
                  direction={{ initial: "column", sm: "row" }}
                  gap="3"
                  mt="2"
                >
                  <Button
                    type="button"
                    variant="soft"
                    color="gray"
                    className="w-full sm:flex-1"
                    onClick={() => router.back()}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={createClass.isPending}
                  >
                    {createClass.isPending
                      ? t("class.creating")
                      : t("dashboard.createClass")}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
