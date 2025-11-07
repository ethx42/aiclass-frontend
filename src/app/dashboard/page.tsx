'use client';

import { useAuthStore } from '@/src/lib/stores/auth-store';
import { TeacherDashboard } from '@/src/components/TeacherDashboard';
import { StudentDashboard } from '@/src/components/StudentDashboard';
import { UserRole } from '@/src/types/api';
import { Box, Flex, Heading, Button } from '@radix-ui/themes';
import { ExitIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/src/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  console.log(user);
  

  return (
    <Box>
      {/* Header */}
      <Box
        style={{
          borderBottom: '1px solid var(--gray-6)',
          background: 'var(--color-background)',
        }}
      >
        <Flex justify="between" align="center" px="6" py="4">
          <Heading size="6">AIClass</Heading>
          <Flex gap="3" align="center">
            <Box style={{ textAlign: 'right' }}>
              <Heading size="3">{user?.fullName}</Heading>
              <Box style={{ fontSize: '12px', color: 'var(--gray-11)' }}>
                {user?.role}
              </Box>
            </Box>
            <Button variant="soft" onClick={() => router.push('/profile')}>
              <PersonIcon /> Profile
            </Button>
            <Button variant="soft" color="red" onClick={logout}>
              <ExitIcon /> Logout
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Dashboard Content */}
      {user?.role === UserRole.TEACHER ? <TeacherDashboard /> : <StudentDashboard />}
    </Box>
  );
}

