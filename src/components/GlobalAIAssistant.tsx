'use client';

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  IconButton,
  Dialog,
  Card,
  ScrollArea,
  Spinner,
  Callout,
} from '@radix-ui/themes';
import { ChatBubbleIcon, Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import { useAuthStore } from '@/src/lib/stores/auth-store';
import { useRecommendations } from '@/src/lib/hooks/use-recommendations';

export function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, error } = useRecommendations({
    recipientId: user?.id || '',
    page: 0,
    size: 50,
  });

  const recommendations = data?.data?.content || [];
  const unreadCount = recommendations.length;

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <Box
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
        }}
      >
        <Box style={{ position: 'relative' }}>
          {unreadCount > 0 && (
            <Badge
              color="red"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                borderRadius: '50%',
                minWidth: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 1,
              }}
            >
              {unreadCount}
            </Badge>
          )}
          <IconButton
            size="4"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={() => setIsOpen(true)}
          >
            <ChatBubbleIcon width="24" height="24" />
          </IconButton>
        </Box>
      </Box>

      {/* Dialog Panel */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Content
          style={{
            maxWidth: '500px',
            maxHeight: '80vh',
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            top: 'auto',
            left: 'auto',
            transform: 'none',
          }}
        >
          <Flex direction="column" style={{ height: '70vh' }}>
            {/* Header */}
            <Flex justify="between" align="center" mb="3">
              <Flex align="center" gap="2">
                <ChatBubbleIcon width="20" height="20" />
                <Dialog.Title>AI Recommendations</Dialog.Title>
              </Flex>
              <Dialog.Close>
                <IconButton variant="ghost" color="gray">
                  <Cross2Icon />
                </IconButton>
              </Dialog.Close>
            </Flex>

            <Dialog.Description size="2" mb="3">
              Personalized insights and recommendations from your AI assistant
            </Dialog.Description>

            {/* Content */}
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              {isLoading ? (
                <Flex align="center" justify="center" style={{ height: '100%' }}>
                  <Spinner size="3" />
                </Flex>
              ) : error ? (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>Failed to load recommendations</Callout.Text>
                </Callout.Root>
              ) : recommendations.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap="3"
                  style={{ height: '100%' }}
                >
                  <ChatBubbleIcon width="48" height="48" style={{ opacity: 0.3 }} />
                  <Text color="gray" size="3" style={{ textAlign: 'center' }}>
                    No recommendations yet
                  </Text>
                  <Text color="gray" size="2" style={{ textAlign: 'center' }}>
                    Your AI assistant will provide insights based on your performance
                  </Text>
                </Flex>
              ) : (
                <ScrollArea style={{ height: '100%' }}>
                  <Flex direction="column" gap="3">
                    {recommendations.map((recommendation) => (
                      <Card key={recommendation.id}>
                        <Flex direction="column" gap="2">
                          <Flex justify="between" align="start" gap="2">
                            <Badge color="blue" size="1">
                              {recommendation.audience}
                            </Badge>
                            <Text size="1" color="gray">
                              {new Date(recommendation.createdAt).toLocaleDateString()}
                            </Text>
                          </Flex>
                          <Text size="2">{recommendation.message}</Text>
                          {recommendation.classEntity && (
                            <Text size="1" color="gray">
                              {recommendation.classEntity.subject.code} -{' '}
                              {recommendation.classEntity.subject.name}
                            </Text>
                          )}
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </ScrollArea>
              )}
            </Box>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

