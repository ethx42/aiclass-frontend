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
  Select,
  Callout,
} from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { authApi } from "@/src/lib/api/auth";
import { UserRole } from "@/src/types/api";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.STUDENT,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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
            <Box style={{ textAlign: "center" }}>
              <Heading size="8" mb="2">
                Create Account
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
                    Full Name *
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
                    Email *
                  </Text>
                  <TextField.Root
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Box>

                {/* Role */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    I am a *
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
                        Student
                      </Select.Item>
                      <Select.Item value={UserRole.TEACHER}>
                        Teacher
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Password */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Password *
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </Box>

                {/* Confirm Password */}
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Confirm Password *
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                </Box>

                <Button type="submit" size="3" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </Flex>
            </form>

            <Flex justify="center" gap="2">
              <Text size="2" color="gray">
                Already have an account?
              </Text>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue" style={{ cursor: "pointer" }}>
                  Log In
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Flex>
  );
}
