import React from "react";
import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/lib/auth";
import { colors, radius, spacing, ui } from "@/theme";

/**
 * Desktop-web-only header nav, shown in place of the native bottom tab bar
 * once the window is wide enough (see app/(tabs)/_layout.tsx — gated on
 * `Platform.OS === "web"` there, so this never affects Android/iOS).
 * Exposes only the same customer areas the bottom tab bar does; the Admin
 * entry point below is appended separately and only when the signed-in
 * user's role is actually "admin" — never based on hiding/showing a link
 * alone, since /admin's real gate is RequireRole + RLS, not this nav.
 */
const LINKS = [
  { key: "index", label: "Ana Sayfa", icon: "home-outline" as const, href: "/" as const },
  {
    key: "service",
    label: "Taleplerim",
    icon: "receipt-outline" as const,
    href: "/(tabs)/service" as const,
    matchPath: "/service",
  },
  {
    key: "tracking",
    label: "Takip",
    icon: "location-outline" as const,
    href: "/(tabs)/tracking" as const,
    matchPath: "/tracking",
  },
  {
    key: "profile",
    label: "Profil",
    icon: "person-outline" as const,
    href: "/(tabs)/profile" as const,
    matchPath: "/profile",
  },
];

const ADMIN_LINK = {
  key: "admin",
  label: "Admin",
  icon: "shield-checkmark-outline" as const,
  href: "/admin" as const,
  matchPath: "/admin",
};

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();
  const links = role === "admin" ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={ui.row}>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: radius.sm,
            padding: spacing.sm,
          }}
        >
          <Ionicons name="home-outline" size={20} color="white" />
        </View>
        <Text style={[ui.heading, { fontSize: 18 }]}>UstaYanımda</Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {links.map((link) => {
          const active =
            link.key === "index"
              ? pathname === "/"
              : pathname === (link.matchPath ?? link.href);
          return (
            <Pressable
              key={link.key}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              accessibilityState={{ selected: active }}
              onPress={() => router.push(link.href)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.subtle : "transparent",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons
                name={link.icon}
                size={18}
                color={active ? colors.accent : colors.muted}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: active ? "700" : "600",
                  color: active ? colors.accent : colors.muted,
                }}
              >
                {link.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
