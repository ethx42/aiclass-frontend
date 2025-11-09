"use client";

import { Card, Flex, Heading, Text, Badge, Box } from "@radix-ui/themes";
import { EnrollmentResponse, EnrollmentStatus } from "@/src/types/api";
import Link from "next/link";
import { useT } from "@/src/lib/i18n/provider";

interface EnrollmentCardProps {
  enrollment: EnrollmentResponse;
}

const getStatusColor = (
  status: EnrollmentStatus
): "green" | "gray" | "blue" => {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return "green";
    case EnrollmentStatus.COMPLETED:
      return "blue";
    case EnrollmentStatus.DROPPED:
      return "gray";
    default:
      return "gray";
  }
};

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const t = useT();
  
  return (
    <Link
      href={`/class/${enrollment.classId}`}
      style={{ textDecoration: "none" }}
    >
      <Card
        style={{
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        className="hover:shadow-lg"
      >
        <Flex direction="column" gap="2">
          <Flex justify="between" align="start">
            <Box>
              <Heading size="4" mb="1">
                {enrollment.className}
              </Heading>
              {enrollment.teacherName && (
                <Text size="2" color="gray">
                  {enrollment.teacherName}
                </Text>
              )}
            </Box>
            <Badge color={getStatusColor(enrollment.status)} size="2">
              {enrollment.status}
            </Badge>
          </Flex>

          {(enrollment.year || enrollment.semester || enrollment.groupCode) && (
            <Flex gap="2" align="center">
              {enrollment.semester && enrollment.year && (
                <Text size="1" color="gray">
                  {t(`class.${enrollment.semester.toLowerCase()}`)} {enrollment.year}
                </Text>
              )}
              {enrollment.groupCode && (
                <>
                  {enrollment.semester && enrollment.year && (
                    <Text size="1" color="gray">
                      •
                    </Text>
                  )}
                  <Text size="1" color="gray">
                    {t('class.group')}: <Text weight="bold">{enrollment.groupCode}</Text>
                  </Text>
                </>
              )}
            </Flex>
          )}

          {enrollment.schedule && (
            <Text size="1" color="gray">
              {enrollment.schedule}
            </Text>
          )}

          <Text size="1" color="gray">
            {t('roster.enrolledDate')}: {new Date(enrollment.enrolledAt).toLocaleDateString()}
          </Text>
        </Flex>
      </Card>
    </Link>
  );
}

