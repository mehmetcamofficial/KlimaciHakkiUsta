import React from "react";
import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, ui } from "@/theme";

/**
 * Desktop-web-only header nav, shown in place of the native bottom tab bar
 * once the window is wide enough (see app/(tabs)/_layout.tsx — gated on
 * `Platform.OS === "web"` there, so this never affects Android/iOS).
 * Intentionally exposes only the same customer areas the bottom tab bar
 * does — no admin link here, matching the tab bar's own `href: null` on
 * the admin tab (see requirement: don't expose admin nav to customers).
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

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();

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
        {LINKS.map((link) => {
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
