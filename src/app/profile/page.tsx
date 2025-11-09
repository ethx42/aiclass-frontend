"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Callout,
  Badge,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  InfoCircledIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { usersApi } from "@/src/lib/api/users";
import { UserRole, UpdateUserDto } from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";

export default function ProfilePage() {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.metadata?.phone || "",
    office: user?.metadata?.office || "",
    department: user?.metadata?.department || "",
  });

  const handleSave = async () => {
    if (!user?.id) return;

    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const updateData: UpdateUserDto = {
        fullName: formData.fullName,
        email: formData.email,
      };

      // Add metadata only if user is teacher
      if (user.role === UserRole.TEACHER) {
        updateData.metadata = {
          phone: formData.phone,
          office: formData.office,
          department: formData.department,
        };
      }

      const response = await usersApi.update(user.id, updateData);

      if (response.success && response.data) {
        setUser(response.data);
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.metadata?.phone || "",
      office: user?.metadata?.office || "",
      department: user?.metadata?.department || "",
    });
    setIsEditing(false);
    setError("");
  };

  if (!user) {
    return null;
  }

  return (
    <Box p="6">
      <Box mb="6">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeftIcon /> {t("navigation.backToDashboard")}
        </Button>
      </Box>

      <Box style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Card size="4">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Heading size="6">{t("profile.profile")}</Heading>
              <Badge color="blue" size="2">
                {user.role === UserRole.TEACHER
                  ? t("auth.teacher")
                  : t("auth.student")}
              </Badge>
            </Flex>

            {success && (
              <Callout.Root color="green">
                <Callout.Icon>
                  <CheckIcon />
                </Callout.Icon>
                <Callout.Text>{t("profile.profileUpdated")}</Callout.Text>
              </Callout.Root>
            )}

            {error && (
              <Callout.Root color="red">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <Flex direction="column" gap="4">
              {/* Full Name */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  {t("auth.fullName")}:
                </Text>
                {isEditing ? (
                  <TextField.Root
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                ) : (
                  <Text size="3"> {user.fullName}</Text>
                )}
              </Box>

              {/* Email */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  {t("auth.email")}:
                </Text>
                {isEditing ? (
                  <TextField.Root
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                ) : (
                  <Text size="3"> {user.email}</Text>
                )}
              </Box>

              {/* Role (read-only) */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  {t("auth.role")}:
                </Text>
                <Text size="3" color="gray">
                  &nbsp;
                  {user.role === UserRole.TEACHER
                    ? t("auth.teacher")
                    : t("auth.student")}
                </Text>
              </Box>

              {/* Teacher-specific metadata fields */}
              {user.role === UserRole.TEACHER && (
                <>
                  {/* Phone */}
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      {t("profile.phone")}:
                    </Text>
                    {isEditing ? (
                      <TextField.Root
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+1-555-0123"
                      />
                    ) : (
                      <Text size="3">
                        &nbsp;{user.metadata?.phone || t("profile.notProvided")}
                      </Text>
                    )}
                  </Box>

                  {/* Office */}
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      {t("profile.office")}:
                    </Text>
                    {isEditing ? (
                      <TextField.Root
                        value={formData.office}
                        onChange={(e) =>
                          setFormData({ ...formData, office: e.target.value })
                        }
                        placeholder="Building A, Room 101"
                      />
                    ) : (
                      <Text size="3">
                        &nbsp;
                        {user.metadata?.office || t("profile.notProvided")}
                      </Text>
                    )}
                  </Box>

                  {/* Department */}
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1">
                      {t("profile.department")}:
                    </Text>
                    {isEditing ? (
                      <TextField.Root
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        placeholder="Computer Science"
                      />
                    ) : (
                      <Text size="3">
                        &nbsp;
                        {user.metadata?.department || t("profile.notProvided")}
                      </Text>
                    )}
                  </Box>
                </>
              )}

              {/* Account Details */}
              <Box pt="3" style={{ borderTop: "1px solid var(--gray-6)" }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" color="gray">
                      {t("profile.accountCreated")}:
                    </Text>
                    <Text size="2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2" color="gray">
                      {t("profile.lastUpdated")}:
                    </Text>
                    <Text size="2">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Flex>
              </Box>

              {/* Actions */}
              <Flex gap="3" mt="2">
                {isEditing ? (
                  <>
                    <Button
                      variant="soft"
                      color="gray"
                      style={{ flex: 1 }}
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      style={{ flex: 1 }}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? t("class.saving") : t("profile.saveChanges")}
                    </Button>
                  </>
                ) : (
                  <Button
                    style={{ flex: 1 }}
                    onClick={() => setIsEditing(true)}
                  >
                    {t("profile.editProfile")}
                  </Button>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
