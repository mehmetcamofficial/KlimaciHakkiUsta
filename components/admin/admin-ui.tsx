import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { StatusBadge } from "@/components/ui/marketplace";
import type { RequestRow } from "@/services/requests";
import { colors, spacing, ui } from "@/theme";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={[ui.card, { flexGrow: 1, flexBasis: 200, minWidth: 160 }]}>
      <Text style={ui.caption}>{label}</Text>
      <Text style={[ui.title, { fontSize: 28 }]}>{value}</Text>
    </View>
  );
}

/** Honest "not built yet" state for planned-but-unimplemented sidebar modules. */
export function PlaceholderModule({ title }: { title: string }) {
  return (
    <View style={[ui.card, { alignItems: "flex-start", gap: spacing.sm }]}>
      <Text style={ui.heading}>{title}</Text>
      <Text style={ui.body}>Bu modül henüz geliştirilmedi. Yakında eklenecek.</Text>
    </View>
  );
}

/**
 * One request, rendered as a card rather than a table row — this is what
 * "safe narrow-screen representation" looks like in React Native: the same
 * layout reflows via flexWrap instead of needing a separate mobile table.
 */
export function AdminRequestRow({ request }: { request: RequestRow }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${request.request_no} detayını aç`}
      onPress={() =>
        router.push({
          pathname: "/admin/requests/[id]",
          params: { id: String(request.id) },
        })
      }
      style={({ pressed }) => [ui.card, { gap: spacing.sm, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.sm }}>
        <Text style={[ui.heading, { fontSize: 16 }]}>{request.request_no}</Text>
        <StatusBadge status={request.status} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
        <Text style={ui.caption}>{request.problem_type || "Hizmet belirtilmemiş"}</Text>
        {request.created_at && (
          <Text style={ui.caption}>{new Date(request.created_at).toLocaleDateString("tr-TR")}</Text>
        )}
      </View>
      <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>Detayı görüntüle →</Text>
    </Pressable>
  );
}

export function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ flexBasis: "45%", flexGrow: 1, gap: 2 }}>
      <Text style={ui.caption}>{label}</Text>
      <Text style={ui.body}>{value || "-"}</Text>
    </View>
  );
}
