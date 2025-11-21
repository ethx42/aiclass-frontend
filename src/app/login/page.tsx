"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/lib/hooks/use-auth";
import {
  Box,
  Card,
  Flex,
  Heading,
  TextField,
  Button,
  Text,
  Callout,
} from "@radix-ui/themes";
import { InfoCircledIcon, CheckIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { LanguageSelector } from "@/src/components/LanguageSelector";
import { useT } from "@/src/lib/i18n/provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const { login, isAuthenticated, initializeAuth } = useAuth();

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
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setShowSignupSuccess(true);
      setTimeout(() => setShowSignupSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError(
        t("auth.invalidEmail") || "Please enter a valid email address"
      );
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate email format
    if (!email || !validateEmail(email)) {
      setEmailError(
        t("auth.invalidEmail") || "Please enter a valid email address"
      );
      return;
    }

    // Validate password is not empty
    if (!password || password.trim() === "") {
      setPasswordError(t("auth.passwordRequired") || "Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (!result.success) {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100vh", background: "var(--gray-2)" }}
    >
      <Box style={{ width: "100%", maxWidth: "400px", padding: "20px" }}>
        <Card size="4">
          <Flex direction="column" gap="4">
            <Flex justify="end">
              <LanguageSelector />
            </Flex>

            <Box style={{ textAlign: "center" }}>
              <Heading size="8" mb="2">
                AIClass
              </Heading>
              <Text size="2" color="gray">
                Student Performance Management System
              </Text>
            </Box>

            {showSignupSuccess && (
              <Callout.Root color="green">
                <Callout.Icon>
                  <CheckIcon />
                </Callout.Icon>
                <Callout.Text>{t("auth.signupSuccess")}</Callout.Text>
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

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.email")}
                  </Text>
                  <TextField.Root
                    type="email"
                    placeholder={t("auth.email")}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => {
                      if (email && !validateEmail(email)) {
                        setEmailError(
                          t("auth.invalidEmail") ||
                            "Please enter a valid email address"
                        );
                      }
                    }}
                    required
                    size="3"
                    color={emailError ? "red" : undefined}
                  />
                  {emailError && (
                    <Text size="1" color="red" mt="1">
                      {emailError}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    {t("auth.password")}
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value && e.target.value.trim() !== "") {
                        setPasswordError("");
                      }
                    }}
                    onBlur={() => {
                      if (!password || password.trim() === "") {
                        setPasswordError(
                          t("auth.passwordRequired") || "Password is required"
                        );
                      } else {
                        setPasswordError("");
                      }
                    }}
                    required
                    size="3"
                    color={passwordError ? "red" : undefined}
                  />
                  {passwordError && (
                    <Text size="1" color="red" mt="1">
                      {passwordError}
                    </Text>
                  )}
                </Box>

                <Button
                  type="submit"
                  size="3"
                  disabled={isLoading}
                  style={{ marginTop: "8px" }}
                >
                  {isLoading ? t("auth.loggingIn") : t("auth.login")}
                </Button>
              </Flex>
            </form>

            <Flex justify="center" gap="2" style={{ marginTop: "12px" }}>
              <Text size="2" color="gray">
                {t("auth.dontHaveAccount")}
              </Text>
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue" style={{ cursor: "pointer" }}>
                  {t("auth.signup")}
                </Text>
              </Link>
            </Flex>

            <Box style={{ textAlign: "center", marginTop: "12px" }}>
              <Text size="1" color="gray">
                Demo: teacher@university.edu / password123
              </Text>
            </Box>
          </Flex>
        </Card>
      </Box>
    </Flex>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
