"use client";

import { Card, Flex, Heading, Text, Badge, Box } from "@radix-ui/themes";
import { ClassResponse, Semester } from "@/src/types/api";
import Link from "next/link";
import { useT } from "@/src/lib/i18n/provider";

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

export function ClassCard({ classData }: ClassCardProps) {
  const t = useT();

  return (
    <Link href={`/class/${classData.id}`} style={{ textDecoration: "none" }}>
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
                {classData?.subjectCode}
              </Heading>
              <Text size="2" color="gray">
                {classData?.subjectName}
              </Text>
            </Box>
            <Badge color={getSemesterColor(classData?.semester)} size="2">
              {t(`class.${classData?.semester?.toLowerCase() || "fall"}`)}{" "}
              {classData?.year}
            </Badge>
          </Flex>

          <Flex gap="2" align="center">
            <Text size="1" color="gray">
              {t("class.group")}:{" "}
              <Text weight="bold">{classData?.groupCode}</Text>
            </Text>
            {classData?.schedule && (
              <>
                <Text size="1" color="gray">
                  •
                </Text>
                <Text size="1" color="gray">
                  {classData?.schedule}
                </Text>
              </>
            )}
          </Flex>

          <Text size="1" color="gray">
            {classData?.teacherName}
          </Text>
        </Flex>
      </Card>
    </Link>
  );
}
