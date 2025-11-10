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
        <Flex
          direction={{ initial: "column", sm: "row" }}
          justify="between"
          align={{ initial: "start", sm: "center" }}
          gap={{ initial: "3", sm: "0" }}
          px={{ initial: "4", sm: "6" }}
          py={{ initial: "3", sm: "4" }}
        >
          <Heading size={{ initial: "5", sm: "6" }}>AIClass</Heading>
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap={{ initial: "2", sm: "3" }}
            align={{ initial: "start", sm: "center" }}
            className="w-full sm:w-auto"
          >
            <Box className="w-full sm:w-auto text-left sm:text-right">
              <Heading size={{ initial: "2", sm: "3" }}>{user?.fullName}</Heading>
              <Box style={{ fontSize: "12px", color: "var(--gray-11)" }}>
                {user?.role === UserRole.TEACHER
                  ? t("auth.teacher")
                  : t("auth.student")}
              </Box>
            </Box>
            <Flex
              direction={{ initial: "column", sm: "row" }}
              gap="2"
              className="w-full sm:w-auto"
            >
              <Button
                variant="soft"
                onClick={() => router.push("/profile")}
                size={{ initial: "2", sm: "3" }}
                className="w-full sm:w-auto"
              >
                <PersonIcon /> {t("navigation.profile")}
              </Button>
              <Button
                variant="soft"
                color="red"
                onClick={logout}
                size={{ initial: "2", sm: "3" }}
                className="w-full sm:w-auto"
              >
                <ExitIcon /> {t("auth.logout")}
              </Button>
              <LanguageSelector />
            </Flex>
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
