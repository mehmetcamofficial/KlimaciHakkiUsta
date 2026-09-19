import React, { type PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/lib/auth";
import { ADMIN_NAV_ITEMS } from "@/lib/admin";
import { useScreenSize } from "@/hooks/use-screen-size";
import { colors, radius, spacing, ui } from "@/theme";

/**
 * The one shell every /admin route renders inside (see app/admin/_layout.tsx).
 * Desktop gets a persistent left sidebar; below desktop the same nav items
 * become a horizontally-scrollable strip so nothing ever overflows the
 * viewport width — this is a foundation, not a polished mobile admin app,
 * so a collapsing strip is the honest minimum rather than a full off-canvas
 * drawer.
 */
export function AdminShell({ children }: PropsWithChildren) {
  const screenSize = useScreenSize();
  const isDesktop = screenSize === "desktop";
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={ui.row}>
          <View style={{ backgroundColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm }}>
            <Ionicons name="shield-checkmark" size={18} color="white" />
          </View>
          <Text style={[ui.heading, { fontSize: 17 }]}>UstaYanımda Admin</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Text style={ui.caption} numberOfLines={1}>
            {profile?.fullName || "Admin"}
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}
          >
            Çıkış Yap
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column" }}>
        <AdminNav isDesktop={isDesktop} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AdminNav({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = ADMIN_NAV_ITEMS.map((item) => {
    const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    return (
      <Text
        key={item.key}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => router.push(item.href as never)}
        numberOfLines={1}
        style={{
          fontSize: 14,
          fontWeight: active ? "700" : "600",
          color: active ? colors.accent : colors.muted,
          backgroundColor: active ? colors.subtle : "transparent",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.sm,
          opacity: item.implemented ? 1 : 0.65,
        }}
      >
        {item.label}
        {!item.implemented ? " · yakında" : ""}
      </Text>
    );
  });

  if (isDesktop) {
    return (
      <ScrollView
        style={{
          width: 240,
          flexGrow: 0,
          flexShrink: 0,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          backgroundColor: colors.surface,
        }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}
      >
        {items}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        flexGrow: 0,
        flexShrink: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.xs, flexDirection: "row" }}
    >
      {items}
    </ScrollView>
  );
}
