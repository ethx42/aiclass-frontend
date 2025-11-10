"use client";

import { Card, Flex, Heading, Text, Badge, Box } from "@radix-ui/themes";
import { EnrollmentResponse, EnrollmentStatus } from "@/src/types/api";
import Link from "next/link";
import { useT } from "@/src/lib/i18n/provider";
import {
  CalendarIcon,
  ShadowInnerIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";

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

const getStatusGradient = (status: EnrollmentStatus): string => {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(5, 150, 105, 0.02) 100%)";
    case EnrollmentStatus.COMPLETED:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 50%, rgba(37, 99, 235, 0.02) 100%)";
    case EnrollmentStatus.DROPPED:
      return "linear-gradient(135deg, rgba(113, 113, 122, 0.06) 0%, rgba(82, 82, 91, 0.03) 50%, rgba(63, 63, 70, 0.01) 100%)";
    default:
      return "linear-gradient(135deg, rgba(113, 113, 122, 0.06) 0%, rgba(82, 82, 91, 0.03) 50%, rgba(63, 63, 70, 0.01) 100%)";
  }
};

const getStatusAccentColor = (status: EnrollmentStatus): string => {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return "rgba(34, 197, 94, 0.15)";
    case EnrollmentStatus.COMPLETED:
      return "rgba(59, 130, 246, 0.15)";
    case EnrollmentStatus.DROPPED:
      return "rgba(113, 113, 122, 0.1)";
    default:
      return "rgba(113, 113, 122, 0.1)";
  }
};

const getStatusIconGradient = (status: EnrollmentStatus): string => {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))";
    case EnrollmentStatus.COMPLETED:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1))";
    case EnrollmentStatus.DROPPED:
      return "linear-gradient(135deg, rgba(113, 113, 122, 0.15), rgba(82, 82, 91, 0.08))";
    default:
      return "linear-gradient(135deg, rgba(113, 113, 122, 0.15), rgba(82, 82, 91, 0.08))";
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
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: getStatusGradient(enrollment.status),
          border: "1px solid var(--gray-4)",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        }}
        className="enrollment-card"
      >
        {/* Decorative gradient overlay */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: `radial-gradient(circle at top right, ${getStatusAccentColor(
              enrollment.status
            )}, transparent 70%)`,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        {/* Subtle border accent */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: getStatusAccentColor(enrollment.status),
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        <Flex
          direction="column"
          gap="4"
          style={{ position: "relative", zIndex: 1, padding: "1px" }}
        >
          <Flex justify="between" align="start" gap="3">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Flex align="center" gap="3" mb="3">
                <Box
                  className="enrollment-card-icon"
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    background: getStatusIconGradient(enrollment.status),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${getStatusAccentColor(
                      enrollment.status
                    )}`,
                    transition:
                      "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <FileTextIcon
                    width="18"
                    height="18"
                    style={{ color: "var(--gray-12)" }}
                  />
                </Box>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Heading
                    size="4"
                    style={{
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginBottom: "4px",
                    }}
                  >
                    {enrollment.className}
                  </Heading>
                  {enrollment.teacherName && (
                    <Text
                      size="2"
                      color="gray"
                      style={{
                        lineHeight: 1.5,
                        fontWeight: 400,
                        opacity: 0.85,
                      }}
                    >
                      {enrollment.teacherName}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>
            <Badge
              color={getStatusColor(enrollment.status)}
              size="2"
              style={{
                flexShrink: 0,
                fontWeight: 600,
                fontSize: "11px",
                padding: "6px 10px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                textTransform: "capitalize",
              }}
            >
              {enrollment.status === EnrollmentStatus.ACTIVE && (
                <CheckCircledIcon
                  style={{ marginRight: "4px", width: "12px", height: "12px" }}
                />
              )}
              {enrollment.status}
            </Badge>
          </Flex>

          <Box
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, var(--gray-4), transparent)",
              margin: "4px 0",
            }}
          />

          <Flex direction="column" gap="2.5" style={{ marginTop: "2px" }}>
            {(enrollment.year || enrollment.semester) && (
              <Flex gap="2.5" align="center">
                <Box
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "var(--gray-2)",
                    color: "var(--gray-11)",
                  }}
                >
                  <CalendarIcon width="12" height="12" />
                </Box>
                <Text size="2" color="gray" style={{ fontWeight: 500 }}>
                  {enrollment.semester &&
                    t(`class.${enrollment.semester.toLowerCase()}`)}{" "}
                  {enrollment.year}
                </Text>
              </Flex>
            )}

            {enrollment.groupCode && (
              <Flex gap="2.5" align="center">
                <Box
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "var(--gray-2)",
                    color: "var(--gray-11)",
                  }}
                >
                  <ShadowInnerIcon width="12" height="12" />
                </Box>
                <Text
                  size="2"
                  color="gray"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 500,
                  }}
                >
                  {t("class.group")}:{" "}
                  <Text
                    weight="bold"
                    style={{ color: "var(--gray-12)", fontWeight: 600 }}
                  >
                    {enrollment.groupCode}
                  </Text>
                </Text>
              </Flex>
            )}

            {enrollment.schedule && (
              <Flex gap="2.5" align="center">
                <Box
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "var(--gray-2)",
                    color: "var(--gray-11)",
                  }}
                >
                  <ClockIcon width="12" height="12" />
                </Box>
                <Text size="2" color="gray" style={{ fontWeight: 500 }}>
                  {enrollment.schedule}
                </Text>
              </Flex>
            )}

            <Flex gap="2.5" align="center" mt="1">
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  background: "var(--gray-2)",
                  color: "var(--gray-11)",
                }}
              >
                <CalendarIcon width="12" height="12" />
              </Box>
              <Text
                size="1"
                color="gray"
                style={{ fontStyle: "italic", fontWeight: 500, opacity: 0.9 }}
              >
                {t("roster.enrolledDate")}:{" "}
                {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
}
