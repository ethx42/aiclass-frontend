'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/lib/hooks/use-auth';
import { Box, Card, Flex, Heading, TextField, Button, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon, CheckIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setShowSignupSuccess(true);
      setTimeout(() => setShowSignupSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', background: 'var(--gray-2)' }}
    >
      <Box style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <Card size="4">
          <Flex direction="column" gap="4">
            <Box style={{ textAlign: 'center' }}>
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
                <Callout.Text>
                  Account created successfully! Please log in.
                </Callout.Text>
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
                    Email
                  </Text>
                  <TextField.Root
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="3"
                  />
                </Box>

                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Password
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="3"
                  />
                </Box>

                <Button
                  type="submit"
                  size="3"
                  disabled={isLoading}
                  style={{ marginTop: '8px' }}
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
              </Flex>
            </form>

            <Flex justify="center" gap="2" style={{ marginTop: '12px' }}>
              <Text size="2" color="gray">
                Don't have an account?
              </Text>
              <Link href="/signup" style={{ textDecoration: 'none' }}>
                <Text size="2" color="blue" style={{ cursor: 'pointer' }}>
                  Sign Up
                </Text>
              </Link>
            </Flex>

            <Box style={{ textAlign: 'center', marginTop: '12px' }}>
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

