import { StyleSheet } from "react-native";
export const colors = {
  primary: "#182F42",
  accent: "#087F75",
  background: "#F5F6F3",
  surface: "#FFFFFF",
  text: "#182F42",
  muted: "#576872",
  border: "#DCE3DF",
  subtle: "#EAF3EE",
  success: "#24704A",
  warning: "#8A5900",
  error: "#B53636",
  disabled: "#79858A",
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 12, md: 16, lg: 24, pill: 999 };
export const typography = {
  title: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
  heading: { fontSize: 21, lineHeight: 28, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 14, lineHeight: 20 },
};
export const shadows = {
  card: {
    elevation: 1,
    shadowColor: colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
};
export const ui = StyleSheet.create({
  title: { ...typography.title, color: colors.text },
  heading: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.muted },
  caption: { ...typography.caption, color: colors.muted },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.lg,
    minHeight: 52,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
