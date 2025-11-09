"use client";

import { useAuthStore } from "@/src/lib/stores/auth-store";
import { TeacherDashboard } from "@/src/components/TeacherDashboard";
import { StudentDashboard } from "@/src/components/StudentDashboard";
import { LanguageSelector } from "@/src/components/LanguageSelector";
import { UserRole } from "@/src/types/api";
import { Box, Flex, Heading, Button } from "@radix-ui/themes";
import { ExitIcon, PersonIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/src/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useT } from "@/src/lib/i18n/provider";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const t = useT();

  return (
    <Box>
      {/* Header */}
      <Box
        style={{
          borderBottom: "1px solid var(--gray-6)",
          background: "var(--color-background)",
        }}
      >
        <Flex justify="between" align="center" px="6" py="4">
          <Heading size="6">AIClass</Heading>
          <Flex gap="3" align="center">
            <LanguageSelector />
            <Box style={{ textAlign: "right" }}>
              <Heading size="3">{user?.fullName}</Heading>
              <Box style={{ fontSize: "12px", color: "var(--gray-11)" }}>
                {user?.role === UserRole.TEACHER
                  ? t("auth.teacher")
                  : t("auth.student")}
              </Box>
            </Box>
            <Button variant="soft" onClick={() => router.push("/profile")}>
              <PersonIcon /> {t("navigation.profile")}
            </Button>
            <Button variant="soft" color="red" onClick={logout}>
              <ExitIcon /> {t("auth.logout")}
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Dashboard Content */}
      {user?.role === UserRole.TEACHER ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Box>
  );
}
