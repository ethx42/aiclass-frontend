"use client";

import { DropdownMenu, Button, Flex, Text, Box } from "@radix-ui/themes";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useTranslations, useT } from "@/src/lib/i18n/provider";

export function LanguageSelector() {
  const { locale, setLocale } = useTranslations();
  const t = useT();

  const languages = [
    { code: "en" as const, nameKey: "english", flag: "🇺🇸", displayCode: "ENG" },
    { code: "es" as const, nameKey: "spanish", flag: "🇪🇸", displayCode: "ES" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Box className="group w-full sm:w-auto">
          <Button
            variant="soft"
            color="gray"
            size={{ initial: "2", sm: "3" }}
            className="w-full sm:w-auto"
          >
            {/* Mobile: Icon + Text side by side */}
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
              className="language-selector-mobile"
            >
              <GlobeIcon />
              <Text>{currentLanguage.displayCode}</Text>
            </Box>

            {/* Desktop: Icon OR Text on hover (replacement) */}
            <Box
              className="language-selector-desktop relative"
              style={{
                minWidth: "32px",
                minHeight: "20px",
              }}
            >
              <Box
                className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity"
                style={{ display: "flex" }}
              >
                <GlobeIcon />
              </Box>
              <Box
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ display: "flex" }}
              >
                <Text style={{ whiteSpace: "nowrap" }}>
                  {currentLanguage.displayCode}
                </Text>
              </Box>
            </Box>
          </Button>
        </Box>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {languages.map((lang) => (
          <DropdownMenu.Item
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            disabled={lang.code === locale}
          >
            <Flex align="center" gap="2">
              <Text>{lang.flag}</Text>
              <Text>{t(`language.${lang.nameKey}`)}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
