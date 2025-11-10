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
  Badge,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  PersonIcon,
  EnvelopeClosedIcon,
  MobileIcon,
  HomeIcon,
  BackpackIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { usersApi } from "@/src/lib/api/users";
import { UserRole, UpdateUserDto } from "@/src/types/api";
import { useT } from "@/src/lib/i18n/provider";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.metadata?.phone || "",
    office: user?.metadata?.office || "",
    department: user?.metadata?.department || "",
  });

  const handleSave = async () => {
    if (!user?.id) return;

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
        setIsEditing(false);
        toast.success(t("profile.profileUpdated"));
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("profile.failedToUpdate");
      toast.error(errorMessage);
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
  };

  if (!user) {
    return null;
  }

  return (
    <Box p={{ initial: "4", sm: "6" }}>
      <Box mb={{ initial: "4", sm: "6" }}>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeftIcon /> {t("navigation.backToDashboard")}
        </Button>
      </Box>

      <Box style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header with Avatar */}
        <Card size={{ initial: "2", sm: "4" }} mb="4">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            align={{ initial: "center", sm: "center" }}
            gap="4"
          >
            {/* Avatar with Initials */}
            <Box
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--accent-9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                color: "white",
                flexShrink: 0,
              }}
            >
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </Box>
            <Flex
              direction="column"
              align="center"
              gap="2"
              style={{ flex: 1, width: "100%" }}
            >
              <Flex
                direction={{ initial: "column", sm: "row" }}
                align={{ initial: "center", sm: "center" }}
                gap="3"
                wrap="wrap"
              >
                <Heading size={{ initial: "5", sm: "7" }}>
                  {user.fullName}
                </Heading>
                <Badge color="blue" size="2">
                  {user.role === UserRole.TEACHER
                    ? t("auth.teacher")
                    : t("auth.student")}
                </Badge>
              </Flex>
              <Text size={{ initial: "2", sm: "3" }} color="gray">
                {user.email}
              </Text>
            </Flex>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                size={{ initial: "2", sm: "3" }}
                className="w-full sm:w-auto"
              >
                {t("profile.editProfile")}
              </Button>
            )}
          </Flex>
        </Card>

        {/* Basic Information Card */}
        <Card size={{ initial: "2", sm: "4" }} mb="4">
          <Flex direction="column" gap="4">
            <Heading size={{ initial: "4", sm: "5" }} mb="2">
              {t("profile.profile")}
            </Heading>

            <Flex direction="column" gap="4">
              {/* Full Name */}
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <PersonIcon />
                  <Text size="2" weight="bold" color="gray">
                    {t("auth.fullName")}
                  </Text>
                </Flex>
                {isEditing ? (
                  <TextField.Root
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    size="3"
                  />
                ) : (
                  <Text size="4">{user.fullName}</Text>
                )}
              </Box>

              {/* Email */}
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <EnvelopeClosedIcon />
                  <Text size="2" weight="bold" color="gray">
                    {t("auth.email")}
                  </Text>
                </Flex>
                {isEditing ? (
                  <TextField.Root
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    size="3"
                  />
                ) : (
                  <Text size="4">{user.email}</Text>
                )}
              </Box>
            </Flex>
          </Flex>
        </Card>

        {/* Teacher Professional Information Card */}
        {user.role === UserRole.TEACHER && (
          <Card size={{ initial: "2", sm: "4" }} mb="4">
            <Flex direction="column" gap="4">
              <Heading size={{ initial: "4", sm: "5" }} mb="2">
                {t("profile.professionalInfo")}
              </Heading>

              <Flex direction="column" gap="4">
                {/* Phone */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <MobileIcon />
                    <Text size="2" weight="bold" color="gray">
                      {t("profile.phone")}
                    </Text>
                  </Flex>
                  {isEditing ? (
                    <TextField.Root
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1-555-0123"
                      size="3"
                    />
                  ) : (
                    <Text size="4">
                      {user.metadata?.phone || (
                        <Text color="gray">{t("profile.notProvided")}</Text>
                      )}
                    </Text>
                  )}
                </Box>

                {/* Office */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <HomeIcon />
                    <Text size="2" weight="bold" color="gray">
                      {t("profile.office")}
                    </Text>
                  </Flex>
                  {isEditing ? (
                    <TextField.Root
                      value={formData.office}
                      onChange={(e) =>
                        setFormData({ ...formData, office: e.target.value })
                      }
                      placeholder="Building A, Room 101"
                      size="3"
                    />
                  ) : (
                    <Text size="4">
                      {user.metadata?.office || (
                        <Text color="gray">{t("profile.notProvided")}</Text>
                      )}
                    </Text>
                  )}
                </Box>

                {/* Department */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <BackpackIcon />
                    <Text size="2" weight="bold" color="gray">
                      {t("profile.department")}
                    </Text>
                  </Flex>
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
                      size="3"
                    />
                  ) : (
                    <Text size="4">
                      {user.metadata?.department || (
                        <Text color="gray">{t("profile.notProvided")}</Text>
                      )}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Account Details Card */}
        <Card size={{ initial: "2", sm: "4" }} mb="4">
          <Flex direction="column" gap="4">
            <Heading size={{ initial: "4", sm: "5" }} mb="2">
              {t("profile.accountDetails")}
            </Heading>
            <Flex direction="column" gap="3">
              <Flex
                direction={{ initial: "column", sm: "row" }}
                justify={{ initial: "start", sm: "between" }}
                align={{ initial: "start", sm: "center" }}
                gap={{ initial: "1", sm: "0" }}
                p="3"
              >
                <Text size="2" weight="medium" color="gray">
                  {t("profile.accountCreated")}
                </Text>
                <Text size="3" weight="bold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </Flex>
              <Flex
                direction={{ initial: "column", sm: "row" }}
                justify={{ initial: "start", sm: "between" }}
                align={{ initial: "start", sm: "center" }}
                gap={{ initial: "1", sm: "0" }}
                p="3"
              >
                <Text size="2" weight="medium" color="gray">
                  {t("profile.lastUpdated")}
                </Text>
                <Text size="3" weight="bold">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            justify="end"
          >
            <Button
              variant="soft"
              color="gray"
              size={{ initial: "2", sm: "3" }}
              onClick={handleCancel}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              size={{ initial: "2", sm: "3" }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? t("class.saving") : t("profile.saveChanges")}
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
