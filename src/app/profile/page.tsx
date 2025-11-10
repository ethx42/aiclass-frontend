"use client";

import { useState, useEffect } from "react";
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
  CalendarIcon,
  Pencil1Icon,
  CheckIcon,
  Cross2Icon,
  ClockIcon,
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
    fullName: "",
    email: "",
    phone: "",
    office: "",
    department: "",
  });

  // Sync formData with user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.metadata?.phone || "",
        office: user.metadata?.office || "",
        department: user.metadata?.department || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;

    // Basic validation
    if (!formData.fullName.trim()) {
      toast.error(`${t("auth.fullName")} ${t("common.error")}`);
      return;
    }

    if (!formData.email.trim()) {
      toast.error(`${t("auth.email")} ${t("common.error")}`);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t("auth.invalidCredentials"));
      return;
    }

    setIsSaving(true);

    try {
      const updateData: UpdateUserDto = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };

      if (user.role === UserRole.TEACHER) {
        updateData.metadata = {
          phone: formData.phone.trim(),
          office: formData.office.trim(),
          department: formData.department.trim(),
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

  // Constants
  const roleColor = user.role === UserRole.TEACHER ? "blue" : "green";
  const roleGradient =
    user.role === UserRole.TEACHER
      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)"
      : "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)";

  const roleBorderColor =
    user.role === UserRole.TEACHER
      ? "rgba(59, 130, 246, 0.2)"
      : "rgba(34, 197, 94, 0.2)";

  const avatarGradient =
    user.role === UserRole.TEACHER
      ? "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)"
      : "linear-gradient(135deg, rgba(34, 197, 94, 1) 0%, rgba(16, 185, 129, 1) 100%)";

  const buttonBackground =
    user.role === UserRole.TEACHER ? "var(--blue-9)" : "var(--green-9)";

  const iconColor =
    user.role === UserRole.TEACHER ? "var(--blue-10)" : "var(--green-10)";

  // Shared styles
  const labelStyle = {
    color: "var(--gray-11)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontSize: "11px",
  };

  return (
    <Box
      p={{ initial: "4", sm: "6", md: "8" }}
      style={{
        background:
          "linear-gradient(180deg, var(--gray-1) 0%, var(--color-background) 50%)",
        minHeight: "100vh",
      }}
    >
      {/* Navigation */}
      <Box mb="6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          size="2"
          style={{ transition: "all 0.2s ease" }}
        >
          <ArrowLeftIcon /> {t("navigation.backToDashboard")}
        </Button>
      </Box>

      <Box style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Profile Header */}
        <Card
          size="4"
          mb="6"
          style={{
            background: roleGradient,
            border: `2px solid ${roleBorderColor}`,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Flex
            direction={{ initial: "column", sm: "row" }}
            align={{ initial: "center", sm: "start" }}
            gap="6"
          >
            {/* Avatar */}
            <Box
              style={{
                width: "112px",
                height: "112px",
                borderRadius: "50%",
                background: avatarGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "42px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                border: "4px solid white",
                position: "relative",
              }}
              role="img"
              aria-label={`${user.fullName} avatar`}
            >
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </Box>

            {/* User Info */}
            <Flex
              direction="column"
              gap="3"
              align={{ initial: "center", sm: "start" }}
              style={{ flex: 1, width: "100%" }}
            >
              <Flex
                direction={{ initial: "column", sm: "row" }}
                align={{ initial: "center", sm: "center" }}
                gap="3"
                wrap="wrap"
              >
                <Heading
                  size="8"
                  style={{
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--gray-12)",
                    lineHeight: 1.2,
                  }}
                  className="text-center sm:text-left"
                >
                  {user.fullName}
                </Heading>
                <Badge
                  color={roleColor}
                  size="2"
                  style={{
                    fontWeight: 500,
                    padding: "4px 12px",
                  }}
                >
                  {user.role === UserRole.TEACHER
                    ? t("auth.teacher")
                    : t("auth.student")}
                </Badge>
              </Flex>

              <Flex
                align="center"
                gap="2"
                mt="1"
                justify={{ initial: "center", sm: "start" }}
              >
                <EnvelopeClosedIcon
                  width="16"
                  height="16"
                  style={{ color: iconColor }}
                />
                <Text size="3" color="gray" style={{ fontWeight: 500 }}>
                  {user.email}
                </Text>
              </Flex>

              {!isEditing && (
                <Box mt="3" className="w-full sm:w-auto">
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="2"
                    className="w-full sm:w-auto"
                    style={{
                      background: buttonBackground,
                      fontWeight: 600,
                    }}
                  >
                    <Pencil1Icon /> {t("profile.editProfile")}
                  </Button>
                </Box>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Main Content */}
        <Flex direction="column" gap="5">
          {/* Personal Information */}
          <Card
            size="4"
            style={{
              border: "1px solid var(--gray-4)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            <Flex align="center" gap="3" mb="5">
              <Box
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.08))",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <PersonIcon
                  width="20"
                  height="20"
                  style={{ color: "var(--blue-11)" }}
                />
              </Box>
              <Heading
                size="5"
                style={{ fontWeight: 700, color: "var(--gray-12)" }}
              >
                {t("profile.profile")}
              </Heading>
            </Flex>

            <Flex direction="column" gap="4">
              {/* Full Name */}
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <PersonIcon
                    width="16"
                    height="16"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <Text size="2" weight="medium" style={labelStyle}>
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
                    required
                    aria-label={t("auth.fullName")}
                  />
                ) : (
                  <Text
                    size="4"
                    weight="bold"
                    style={{ color: "var(--gray-12)" }}
                  >
                    {user.fullName}
                  </Text>
                )}
              </Box>

              {/* Email */}
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <EnvelopeClosedIcon
                    width="16"
                    height="16"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <Text size="2" weight="medium" style={labelStyle}>
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
                    required
                    aria-label={t("auth.email")}
                  />
                ) : (
                  <Flex align="center" gap="2">
                    <EnvelopeClosedIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--green-10)" }}
                    />
                    <Text
                      size="4"
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {user.email}
                    </Text>
                  </Flex>
                )}
              </Box>
            </Flex>
          </Card>

          {/* Professional Information (Teachers only) */}
          {user.role === UserRole.TEACHER && (
            <Card
              size="4"
              style={{
                border: "1px solid var(--gray-4)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                background:
                  "linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(16, 185, 129, 0.01) 100%)",
              }}
            >
              <Flex align="center" gap="3" mb="5">
                <Box
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.08))",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <BackpackIcon
                    width="20"
                    height="20"
                    style={{ color: "var(--green-11)" }}
                  />
                </Box>
                <Heading
                  size="5"
                  style={{ fontWeight: 700, color: "var(--gray-12)" }}
                >
                  {t("profile.professionalInfo")}
                </Heading>
              </Flex>

              <Flex direction="column" gap="4">
                {/* Phone */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <MobileIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--gray-9)" }}
                    />
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        color: "var(--gray-11)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                      }}
                    >
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
                    <Text
                      size="4"
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {user.metadata?.phone || (
                        <Text
                          color="gray"
                          style={{ fontStyle: "italic", fontWeight: 400 }}
                        >
                          {t("profile.notProvided")}
                        </Text>
                      )}
                    </Text>
                  )}
                </Box>

                {/* Office */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <HomeIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--gray-9)" }}
                    />
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        color: "var(--gray-11)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                      }}
                    >
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
                    <Text
                      size="4"
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {user.metadata?.office || (
                        <Text
                          color="gray"
                          style={{ fontStyle: "italic", fontWeight: 400 }}
                        >
                          {t("profile.notProvided")}
                        </Text>
                      )}
                    </Text>
                  )}
                </Box>

                {/* Department */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <BackpackIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--gray-9)" }}
                    />
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        color: "var(--gray-11)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                      }}
                    >
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
                    <Text
                      size="4"
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {user.metadata?.department || (
                        <Text
                          color="gray"
                          style={{ fontStyle: "italic", fontWeight: 400 }}
                        >
                          {t("profile.notProvided")}
                        </Text>
                      )}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Card>
          )}

          {/* Account Details */}
          <Card
            size="4"
            style={{
              border: "1px solid var(--gray-4)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              background:
                "linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(192, 132, 252, 0.01) 100%)",
            }}
          >
            <Flex align="center" gap="3" mb="5">
              <Box
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(192, 132, 252, 0.08))",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                }}
              >
                <ClockIcon
                  width="20"
                  height="20"
                  style={{ color: "var(--purple-11)" }}
                />
              </Box>
              <Heading
                size="5"
                style={{ fontWeight: 700, color: "var(--gray-12)" }}
              >
                {t("profile.accountDetails")}
              </Heading>
            </Flex>

            <Flex direction="column" gap="4">
              <Flex
                direction={{ initial: "column", sm: "row" }}
                justify={{ initial: "start", sm: "between" }}
                align={{ initial: "start", sm: "center" }}
                gap="2"
              >
                <Flex align="center" gap="2">
                  <CalendarIcon
                    width="16"
                    height="16"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <Text size="2" weight="medium" style={labelStyle}>
                    {t("profile.accountCreated")}
                  </Text>
                </Flex>
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: "var(--gray-12)" }}
                >
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </Flex>

              <Flex
                direction={{ initial: "column", sm: "row" }}
                justify={{ initial: "start", sm: "between" }}
                align={{ initial: "start", sm: "center" }}
                gap="2"
              >
                <Flex align="center" gap="2">
                  <ClockIcon
                    width="16"
                    height="16"
                    style={{ color: "var(--gray-9)" }}
                  />
                  <Text size="2" weight="medium" style={labelStyle}>
                    {t("profile.lastUpdated")}
                  </Text>
                </Flex>
                <Text
                  size="3"
                  weight="bold"
                  style={{ color: "var(--gray-12)" }}
                >
                  {new Date(user.updatedAt).toLocaleDateString()}
                </Text>
              </Flex>
            </Flex>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <Card
              size="4"
              style={{
                border: "1px solid var(--gray-4)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <Flex
                direction={{ initial: "column", sm: "row" }}
                gap="3"
                justify="end"
              >
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  style={{ fontWeight: 600 }}
                >
                  <Cross2Icon /> {t("common.cancel")}
                </Button>
                <Button
                  size="3"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto hover:scale-105"
                  style={{
                    background: buttonBackground,
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <CheckIcon />{" "}
                  {isSaving ? t("class.saving") : t("profile.saveChanges")}
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
