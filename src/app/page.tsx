'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { Flex, Spinner } from '@radix-ui/themes';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Spinner size="3" />
    </Flex>
  );
}
