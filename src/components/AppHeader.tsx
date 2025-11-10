"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Button,
  Badge,
  DropdownMenu,
  Text,
} from "@radix-ui/themes";
import {
  ExitIcon,
  PersonIcon,
  HomeIcon,
  GearIcon,
  GlobeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/src/lib/stores/auth-store";
import { useAuth } from "@/src/lib/hooks/use-auth";
import { useT, useTranslations } from "@/src/lib/i18n/provider";
import { UserRole } from "@/src/types/api";

interface AppHeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  title?: string;
  subtitle?: string;
}

// Constants
const LANGUAGES = [
  { code: "en" as const, nameKey: "english", flag: "🇺🇸" },
  { code: "es" as const, nameKey: "spanish", flag: "🇪🇸" },
] as const;

const TRANSITION_EASE = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

// Style constants
const MENU_ITEM_BASE_STYLE = {
  cursor: "pointer",
  borderRadius: "8px",
  padding: "10px 12px",
  transition: TRANSITION_EASE,
  color: "var(--gray-12)",
} as const;

const ICON_BOX_STYLE = {
  padding: "6px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
} as const;

export function AppHeader({
  showBackButton = false,
  onBackClick,
  title,
  subtitle,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const t = useT();
  const { locale, setLocale } = useTranslations();
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

  const isDashboard = pathname === "/dashboard";

  // Memoized constants based on user role
  const roleConfig = useMemo(() => {
    if (!user) return null;

    const isTeacher = user.role === UserRole.TEACHER;
    return {
      color: (isTeacher ? "blue" : "green") as "blue" | "green",
      label: isTeacher ? t("auth.teacher") : t("auth.student"),
      avatarGradient: isTeacher
        ? "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)"
        : "linear-gradient(135deg, rgba(34, 197, 94, 1) 0%, rgba(16, 185, 129, 1) 100%)",
      headerGradient: isTeacher
        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 50%, rgba(29, 78, 216, 0.02) 100%)"
        : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(5, 150, 105, 0.02) 100%)",
      accentColor: isTeacher
        ? "rgba(59, 130, 246, 0.15)"
        : "rgba(34, 197, 94, 0.15)",
      borderGradient: isTeacher
        ? "linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.4), rgba(29, 78, 216, 0.2))"
        : "linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.2))",
      logoGradient: isTeacher
        ? "linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(37, 99, 235, 1))"
        : "linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1))",
      borderColor: isTeacher
        ? "rgba(59, 130, 246, 0.3)"
        : "rgba(34, 197, 94, 0.3)",
      iconColor: isTeacher ? "var(--blue-11)" : "var(--green-11)",
    };
  }, [user, t]);

  // Handlers
  const handleBack = useCallback(() => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push("/dashboard");
    }
  }, [onBackClick, router]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleLanguageToggle = useCallback(
    (e: Event | React.SyntheticEvent) => {
      e.preventDefault();
      setIsLanguageExpanded((prev) => !prev);
    },
    []
  );

  const handleLanguageSelect = useCallback(
    (langCode: (typeof LANGUAGES)[number]["code"]) => {
      setLocale(langCode);
      setIsLanguageExpanded(false);
    },
    [setLocale]
  );

  const handleMenuClose = useCallback((open: boolean) => {
    if (!open) {
      setIsLanguageExpanded(false);
    }
  }, []);

  // Utility functions
  const getInitials = useCallback((name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }, []);

  // Hover handlers (memoized to prevent recreation)
  const createHoverHandlers = useCallback(
    (hoverBg: string = "var(--gray-3)", hoverColor?: string) => ({
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        target.style.background = hoverBg;
        if (hoverColor) {
          target.style.color = hoverColor;
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        target.style.background = "transparent";
        if (hoverColor) {
          target.style.color = hoverColor;
        }
      },
    }),
    []
  );

  const defaultHoverHandlers = createHoverHandlers();
  const logoutHoverHandlers = createHoverHandlers(
    "rgba(239, 68, 68, 0.1)",
    "var(--red-11)"
  );

  if (!user || !roleConfig) {
    return null;
  }

  return (
    <Box
      style={{
        borderBottom: `2px solid ${roleConfig.accentColor}`,
        background: roleConfig.headerGradient,
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Decorative top border */}
      <Box
        style={{
          height: "3px",
          background: roleConfig.borderGradient,
        }}
      />

      <Flex
        direction="row"
        justify="between"
        align="center"
        gap={{ initial: "2", sm: "0" }}
        px={{ initial: "4", sm: "6", md: "8" }}
        py={{ initial: "3", sm: "4" }}
      >
        {/* Left Section: Logo/Title */}
        <Flex
          align="center"
          gap="4"
          style={{ flex: "0 1 auto", minWidth: 0, maxWidth: "40%" }}
        >
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={handleBack}
              size="2"
              style={{
                flexShrink: 0,
                transition: TRANSITION_EASE,
              }}
              className="hover:translate-x-[-2px]"
              aria-label={t("navigation.backToDashboard")}
            >
              <HomeIcon width="16" height="16" />
            </Button>
          )}

          <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
            {title ? (
              <>
                <Heading
                  size={{ initial: "5", sm: "6" }}
                  style={{
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--gray-12)",
                    lineHeight: 1.2,
                  }}
                  className="truncate"
                >
                  {title}
                </Heading>
                {subtitle && (
                  <Text
                    size="2"
                    color="gray"
                    style={{
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                    className="truncate"
                  >
                    {subtitle}
                  </Text>
                )}
              </>
            ) : (
              <Heading
                size={{ initial: "5", sm: "6" }}
                style={{
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: roleConfig.logoGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AIClass
              </Heading>
            )}
          </Flex>
        </Flex>

        {/* Right Section: User Info & Actions */}
        <Flex
          align="center"
          gap={{ initial: "2", sm: "3" }}
          style={{ flex: "1 1 auto", minWidth: 0, justifyContent: "flex-end" }}
        >
          {/* User Info - Desktop */}
          <Flex
            align="center"
            gap="3"
            style={{ display: "none" }}
            className="sm:flex"
          >
            <Box
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                flexShrink: 0,
                marginRight: "12px",
              }}
            >
              <Flex direction="column" align="end" gap="2">
                <Text
                  size="3"
                  weight="bold"
                  style={{
                    color: "var(--gray-12)",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    maxWidth: "none",
                    overflow: "visible",
                    textOverflow: "clip",
                  }}
                >
                  {user.fullName}
                </Text>
                <Badge
                  color={roleConfig.color}
                  size="1"
                  style={{
                    fontWeight: 600,
                    fontSize: "10px",
                    padding: "3px 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {roleConfig.label}
                </Badge>
              </Flex>
            </Box>

            {/* Avatar */}
            <Box
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: roleConfig.avatarGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
                boxShadow:
                  "0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)",
                border: "3px solid white",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
              }}
              className="hover:scale-110 hover:shadow-lg"
              role="img"
              aria-label={`${user.fullName} avatar`}
              onClick={() => router.push("/profile")}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/profile");
                }
              }}
            >
              {getInitials(user.fullName)}
              {/* Shine effect */}
              <Box
                style={{
                  position: "absolute",
                  top: "15%",
                  left: "20%",
                  width: "30%",
                  height: "30%",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent)",
                  pointerEvents: "none",
                }}
              />
            </Box>
          </Flex>

          {/* User Info - Mobile */}
          <Flex
            align="center"
            gap="2"
            style={{ display: "flex" }}
            className="sm:hidden"
          >
            <Box
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                flexShrink: 0,
              }}
            >
              <Flex direction="column" gap="1" align="end">
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    color: "var(--gray-12)",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    textOverflow: "clip",
                  }}
                >
                  {user.fullName}
                </Text>
                <Badge
                  color={roleConfig.color}
                  size="1"
                  style={{
                    fontWeight: 600,
                    fontSize: "9px",
                    padding: "2px 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {roleConfig.label}
                </Badge>
              </Flex>
            </Box>
            <Box
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: roleConfig.avatarGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                border: "2px solid white",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="hover:scale-105"
              role="img"
              aria-label={`${user.fullName} avatar`}
              onClick={() => router.push("/profile")}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/profile");
                }
              }}
            >
              {getInitials(user.fullName)}
            </Box>
          </Flex>

          {/* Actions Menu */}
          <DropdownMenu.Root onOpenChange={handleMenuClose}>
            <DropdownMenu.Trigger>
              <Button
                variant="soft"
                size={{ initial: "2", sm: "3" }}
                style={{
                  transition: TRANSITION_EASE,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
                className="hover:scale-105 hover:shadow-md"
                aria-label={t("common.menu")}
              >
                <GearIcon width="16" height="16" />
                <Box style={{ display: "none" }} className="sm:block" ml="2">
                  <Text size="2" style={{ marginLeft: "8px" }}>
                    {t("common.menu")}
                  </Text>
                </Box>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              style={{
                minWidth: "220px",
                boxShadow:
                  "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)",
                border: "1px solid var(--gray-4)",
                borderRadius: "12px",
                padding: "4px",
              }}
            >
              {!isDashboard && (
                <DropdownMenu.Item
                  onClick={() => router.push("/dashboard")}
                  style={MENU_ITEM_BASE_STYLE}
                  {...defaultHoverHandlers}
                >
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        ...ICON_BOX_STYLE,
                        background: "rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      <HomeIcon
                        width="16"
                        height="16"
                        style={{ color: "var(--blue-11)" }}
                      />
                    </Box>
                    <Text weight="medium" style={{ color: "var(--gray-12)" }}>
                      {t("navigation.dashboard")}
                    </Text>
                  </Flex>
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                onClick={() => router.push("/profile")}
                style={MENU_ITEM_BASE_STYLE}
                {...defaultHoverHandlers}
              >
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      ...ICON_BOX_STYLE,
                      background: "rgba(34, 197, 94, 0.1)",
                    }}
                  >
                    <PersonIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--green-11)" }}
                    />
                  </Box>
                  <Text weight="medium" style={{ color: "var(--gray-12)" }}>
                    {t("navigation.profile")}
                  </Text>
                </Flex>
              </DropdownMenu.Item>
              <DropdownMenu.Separator style={{ margin: "4px 0" }} />
              <DropdownMenu.Item
                onSelect={handleLanguageToggle}
                style={MENU_ITEM_BASE_STYLE}
                {...defaultHoverHandlers}
                aria-expanded={isLanguageExpanded}
              >
                <Flex
                  align="center"
                  gap="3"
                  justify="between"
                  style={{ width: "100%" }}
                >
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        ...ICON_BOX_STYLE,
                        background: "rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      <GlobeIcon
                        width="16"
                        height="16"
                        style={{ color: "var(--blue-11)" }}
                      />
                    </Box>
                    <Text weight="medium" style={{ color: "var(--gray-12)" }}>
                      {t("language.selectLanguage")}
                    </Text>
                  </Flex>
                  {isLanguageExpanded ? (
                    <ChevronDownIcon width="14" height="14" />
                  ) : (
                    <ChevronRightIcon width="14" height="14" />
                  )}
                </Flex>
              </DropdownMenu.Item>
              {isLanguageExpanded && (
                <>
                  {LANGUAGES.map((lang) => {
                    const isCurrentLang = lang.code === locale;
                    return (
                      <DropdownMenu.Item
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        disabled={isCurrentLang}
                        style={{
                          ...MENU_ITEM_BASE_STYLE,
                          cursor: isCurrentLang ? "default" : "pointer",
                          padding: "10px 12px 10px 40px",
                          opacity: isCurrentLang ? 0.6 : 1,
                        }}
                        {...(isCurrentLang ? {} : defaultHoverHandlers)}
                      >
                        <Flex align="center" gap="3">
                          <Text style={{ fontSize: "16px" }}>{lang.flag}</Text>
                          <Text
                            weight="medium"
                            style={{ color: "var(--gray-12)" }}
                          >
                            {t(`language.${lang.nameKey}`)}
                          </Text>
                          {isCurrentLang && (
                            <Text
                              size="1"
                              color="gray"
                              style={{ marginLeft: "auto" }}
                            >
                              ✓
                            </Text>
                          )}
                        </Flex>
                      </DropdownMenu.Item>
                    );
                  })}
                </>
              )}
              <DropdownMenu.Separator style={{ margin: "4px 0" }} />
              <DropdownMenu.Item
                onClick={handleLogout}
                style={{
                  ...MENU_ITEM_BASE_STYLE,
                  color: "var(--red-11)",
                }}
                {...logoutHoverHandlers}
              >
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      ...ICON_BOX_STYLE,
                      background: "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    <ExitIcon
                      width="16"
                      height="16"
                      style={{ color: "var(--red-11)" }}
                    />
                  </Box>
                  <Text weight="medium" style={{ color: "var(--red-11)" }}>
                    {t("auth.logout")}
                  </Text>
                </Flex>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>
    </Box>
  );
}
