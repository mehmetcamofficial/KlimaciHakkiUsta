import React, { type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useScreenSize } from "@/hooks/use-screen-size";
import { CONTENT_MAX_WIDTH } from "@/lib/responsive";
import { colors, radius, spacing, ui } from "@/theme";

/**
 * The one place every screen gets its responsive content container from —
 * "narrow" is for auth/forms (always readable-width, even on a wide
 * desktop monitor); "default" is for general content pages, which stay
 * 100% width on mobile, get comfortable padding on tablet, and stop
 * stretching edge-to-edge past the desktop breakpoint.
 */
export function Screen({
  children,
  insetTop = true,
  width = "default",
}: PropsWithChildren<{
  insetTop?: boolean;
  width?: keyof typeof CONTENT_MAX_WIDTH;
}>) {
  const screenSize = useScreenSize();
  const horizontalPadding = screenSize === "mobile" ? spacing.xl : spacing.xxl;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={insetTop ? ["top", "left", "right"] : ["left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insetTop ? 0 : 90}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xxl,
            gap: spacing.lg,
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH[width],
            alignSelf: "center",
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Brand() {
  return (
    <View style={ui.row}>
      <View
        style={{
          backgroundColor: colors.accent,
          borderRadius: radius.sm,
          padding: spacing.sm,
        }}
      >
        <Ionicons name="home-outline" size={24} color="white" />
      </View>
      <Text style={ui.heading}>UstaYanımda</Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        padding: spacing.lg,
        borderRadius: radius.sm,
        backgroundColor: secondary ? colors.subtle : colors.primary,
        opacity: pressed || disabled || loading ? 0.6 : 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
      })}
    >
      {loading && (
        <ActivityIndicator color={secondary ? colors.accent : "white"} />
      )}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: secondary ? colors.accent : "white",
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function State({
  title,
  loading,
  retry,
}: {
  title: string;
  loading?: boolean;
  retry?: () => void;
}) {
  return (
    <View style={[ui.card, { padding: spacing.xl }]}>
      {loading && <ActivityIndicator color={colors.accent} />}
      <Text accessibilityLiveRegion="polite" style={ui.body}>
        {title}
      </Text>
      {retry && <Button title="Tekrar dene" onPress={retry} secondary />}
    </View>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.subtle,
      }}
    >
      <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>
        {status}
      </Text>
    </View>
  );
}
export function ServiceCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description?: string;
  icon?: string;
  onPress: () => void;
}) {
  const name =
    icon && icon in Ionicons.glyphMap
      ? (icon as React.ComponentProps<typeof Ionicons>["name"])
      : "grid-outline";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        ui.card,
        ui.row,
        { opacity: pressed ? 0.65 : 1, minHeight: 80 },
      ]}
    >
      <Ionicons name={name} size={24} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={[ui.heading, { fontSize: 17 }]}>{title}</Text>
        {description && <Text style={ui.caption}>{description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
