"use client";

import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { HomeIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useT } from "@/src/lib/i18n/provider";

export default function NotFound() {
  const router = useRouter();
  const t = useT();

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "20px" }}
    >
      <Card size="4" style={{ maxWidth: "500px", textAlign: "center" }}>
        <Flex direction="column" gap="4" align="center">
          <Box
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              color: "var(--gray-9)",
              lineHeight: "1",
            }}
          >
            404
          </Box>

          <Heading size="6">{t("common.notFound")}</Heading>

          <Text size="3" color="gray">
            {t("common.notFoundMessage")}
          </Text>

          <Flex gap="3" mt="2">
            <Button variant="soft" onClick={() => router.back()}>
              <ArrowLeftIcon /> {t("common.back")}
            </Button>
            <Button onClick={() => router.push("/dashboard")}>
              <HomeIcon /> {t("navigation.dashboard")}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
