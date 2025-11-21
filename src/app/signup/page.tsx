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
  Select,
  Callout,
} from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { authApi } from "@/src/lib/api/auth";
import { UserRole } from "@/src/types/api";
import Link from "next/link";
import { LanguageSelector } from "@/src/components/LanguageSelector";
import { useT } from "@/src/lib/i18n/provider";
import { useAuth } from "@/src/lib/hooks/use-auth";

export default function SignupPage() {
  const router = useRouter();
  const t = useT();
  const { isAuthenticated, initializeAuth } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.STUDENT,
  });

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (value && !validateEmail(value)) {
      setEmailError(t("auth.invalidEmail") || "Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate email format
    if (!formData.email || !validateEmail(formData.email)) {
      setEmailError(t("auth.invalidEmail") || "Please enter a valid email address");
      return;
    }

    // Validate password is not empty
    if (!formData.password || formData.password.trim() === "") {
      setPasswordError(t("auth.passwordRequired") || "Password is required");
      return;
    }

    // Validate confirm password is not empty
    if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
      setConfirmPasswordError(t("auth.confirmPasswordRequired") || "Please confirm your password");
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError(t("auth.passwordMinLength"));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.signup({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
      });

      // Redirect to login
      router.push("/login?signup=success");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Failed to create account";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "20px" }}
    >
      <Box style={{ width: "100%", maxWidth: "450px" }}>
        <Card size="4">
          <Flex direction="column" gap="4">
            <Flex justify="end">
              <LanguageSelector />
            </Flex>

            <Box style={{ textAlign: "center" }}>
              <Heading size="8" mb="2">
                {t("auth.createAccount")}
              </Heading>
              <Text size="3" color="gray">
                Join the AIClass platform
              </Text>
            </Box>

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
                {/* Full Name */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.fullName")} *
                  </Text>
                  <TextField.Root
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </Box>

                {/* Email */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.email")} *
                  </Text>
                  <TextField.Root
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => {
                      if (formData.email && !validateEmail(formData.email)) {
                        setEmailError(t("auth.invalidEmail") || "Please enter a valid email address");
                      }
                    }}
                    required
                    color={emailError ? "red" : undefined}
                  />
                  {emailError && (
                    <Text size="1" color="red" mt="1">
                      {emailError}
                    </Text>
                  )}
                </Box>

                {/* Role */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.iAmA")} *
                  </Text>
                  <Select.Root
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                    required
                  >
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      <Select.Item value={UserRole.STUDENT}>
                        {t("auth.student")}
                      </Select.Item>
                      <Select.Item value={UserRole.TEACHER}>
                        {t("auth.teacher")}
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Password */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.password")} *
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder={t("auth.passwordMinLength")}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (e.target.value && e.target.value.trim() !== "") {
                        setPasswordError("");
                      }
                    }}
                    onBlur={() => {
                      if (!formData.password || formData.password.trim() === "") {
                        setPasswordError(t("auth.passwordRequired") || "Password is required");
                      } else if (formData.password.length < 6) {
                        setPasswordError(t("auth.passwordMinLength"));
                      } else {
                        setPasswordError("");
                      }
                    }}
                    required
                    minLength={6}
                    color={passwordError ? "red" : undefined}
                  />
                  {passwordError && (
                    <Text size="1" color="red" mt="1">
                      {passwordError}
                    </Text>
                  )}
                </Box>

                {/* Confirm Password */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.confirmPassword")} *
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder={t("auth.confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      });
                      if (e.target.value && e.target.value.trim() !== "") {
                        setConfirmPasswordError("");
                        // Also clear password mismatch error if passwords match
                        if (formData.password === e.target.value) {
                          setError("");
                        }
                      }
                    }}
                    onBlur={() => {
                      if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
                        setConfirmPasswordError(t("auth.confirmPasswordRequired") || "Please confirm your password");
                      } else if (formData.password !== formData.confirmPassword) {
                        setConfirmPasswordError(t("auth.passwordsDontMatch"));
                      } else {
                        setConfirmPasswordError("");
                      }
                    }}
                    required
                    minLength={6}
                    color={confirmPasswordError ? "red" : undefined}
                  />
                  {confirmPasswordError && (
                    <Text size="1" color="red" mt="1">
                      {confirmPasswordError}
                    </Text>
                  )}
                </Box>

                <Button type="submit" size="3" disabled={isLoading}>
                  {isLoading ? t("auth.creatingAccount") : t("auth.signup")}
                </Button>
              </Flex>
            </form>

            <Flex justify="center" gap="2">
              <Text size="2" color="gray">
                {t("auth.alreadyHaveAccount")}
              </Text>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue" style={{ cursor: "pointer" }}>
                  {t("auth.login")}
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Flex>
  );
}
