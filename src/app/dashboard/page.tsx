"use client";

import { useAuthStore } from "@/src/lib/stores/auth-store";
import { TeacherDashboard } from "@/src/components/TeacherDashboard";
import { StudentDashboard } from "@/src/components/StudentDashboard";
import { AppHeader } from "@/src/components/AppHeader";
import { UserRole } from "@/src/types/api";
import { Box } from "@radix-ui/themes";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <Box>
      <AppHeader />
      {user?.role === UserRole.TEACHER ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Box>
  );
}
