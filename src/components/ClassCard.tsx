"use client";

import { Card, Flex, Heading, Text, Badge, Box } from "@radix-ui/themes";
import { ClassResponse, Semester, getSemesterDisplay } from "@/src/types/api";
import Link from "next/link";
import { useT } from "@/src/lib/i18n/provider";
import {
  PersonIcon,
  ShadowInnerIcon,
  FileTextIcon,
  ClockIcon,
} from "@radix-ui/react-icons";

interface ClassCardProps {
  classData: ClassResponse;
}

const getSemesterColor = (
  semester: Semester
): "blue" | "green" | "orange" | "purple" => {
  switch (semester) {
    case Semester.SPRING:
      return "green";
    case Semester.SUMMER:
      return "orange";
    case Semester.FALL:
      return "blue";
    case Semester.WINTER:
      return "purple";
    default:
      return "blue";
  }
};

const getSemesterGradient = (semester: Semester): string => {
  switch (semester) {
    case Semester.SPRING:
      return "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(5, 150, 105, 0.02) 100%)";
    case Semester.SUMMER:
      return "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(251, 146, 60, 0.04) 50%, rgba(234, 88, 12, 0.02) 100%)";
    case Semester.FALL:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 50%, rgba(37, 99, 235, 0.02) 100%)";
    case Semester.WINTER:
      return "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(192, 132, 252, 0.04) 50%, rgba(147, 51, 234, 0.02) 100%)";
    default:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 50%, rgba(37, 99, 235, 0.02) 100%)";
  }
};

const getSemesterAccentColor = (semester: Semester): string => {
  switch (semester) {
    case Semester.SPRING:
      return "rgba(34, 197, 94, 0.15)";
    case Semester.SUMMER:
      return "rgba(249, 115, 22, 0.15)";
    case Semester.FALL:
      return "rgba(59, 130, 246, 0.15)";
    case Semester.WINTER:
      return "rgba(168, 85, 247, 0.15)";
    default:
      return "rgba(59, 130, 246, 0.15)";
  }
};

const getSemesterIconGradient = (semester: Semester): string => {
  switch (semester) {
    case Semester.SPRING:
      return "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))";
    case Semester.SUMMER:
      return "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 146, 60, 0.1))";
    case Semester.FALL:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1))";
    case Semester.WINTER:
      return "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(192, 132, 252, 0.1))";
    default:
      return "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.1))";
  }
};

export function ClassCard({ classData }: ClassCardProps) {
  const t = useT();

  return (
    <Link href={`/class/${classData.id}`} style={{ textDecoration: "none" }}>
      <Card
        style={{
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: getSemesterGradient(classData?.semester),
          border: "1px solid var(--gray-4)",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        }}
        className="class-card"
      >
        {/* Decorative gradient overlay */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: `radial-gradient(circle at top right, ${getSemesterAccentColor(
              classData?.semester
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
            background: getSemesterAccentColor(classData?.semester),
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
                  className="class-card-icon"
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    background: getSemesterIconGradient(classData?.semester),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${getSemesterAccentColor(
                      classData?.semester
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
                    {classData?.subjectCode}
                  </Heading>
                  <Text
                    size="2"
                    color="gray"
                    style={{
                      lineHeight: 1.5,
                      fontWeight: 400,
                      opacity: 0.85,
                    }}
                  >
                    {classData?.subjectName}
                  </Text>
                </Box>
              </Flex>
            </Box>
            <Badge
              color={getSemesterColor(classData?.semester)}
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
              {getSemesterDisplay(classData?.semester)} {classData?.year}
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
            {classData?.groupCode && (
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
                    {classData?.groupCode}
                  </Text>
                </Text>
              </Flex>
            )}

            {classData?.schedule && (
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
                  {classData?.schedule}
                </Text>
              </Flex>
            )}

            {classData?.teacherName && (
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
                  <PersonIcon width="12" height="12" />
                </Box>
                <Text
                  size="2"
                  color="gray"
                  style={{ fontStyle: "italic", fontWeight: 500, opacity: 0.9 }}
                >
                  {classData?.teacherName}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
}
