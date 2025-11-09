"use client";

import { DropdownMenu, Button, Flex, Text } from "@radix-ui/themes";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useTranslations } from "@/src/lib/i18n/provider";

export function LanguageSelector() {
  const { locale, setLocale } = useTranslations();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft" color="gray" size="2">
          <GlobeIcon />
          <Flex align="center" gap="1">
            <Text>{currentLanguage.code.toUpperCase()}</Text>
          </Flex>
        </Button>
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
              <Text>{lang.name}</Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

