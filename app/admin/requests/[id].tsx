import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { State, StatusBadge } from "@/components/ui/marketplace";
import { DetailField } from "@/components/admin/admin-ui";
import { getRequestForAdmin, type RequestRow } from "@/services/requests";
import { spacing, ui } from "@/theme";

export default function AdminRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<RequestRow | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError(true);
      return;
    }
    setRequest(undefined);
    setError(false);
    try {
      setRequest(await getRequestForAdmin(numericId));
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  if (error) {
    return <State title="Talep yüklenemedi." retry={() => setAttempt((value) => value + 1)} />;
  }

  if (request === undefined) {
    return <State loading title="Yükleniyor…" />;
  }

  if (request === null) {
    return <State title="Talep bulunamadı veya erişim yetkiniz yok." />;
  }

  return (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.sm }}>
        <Text style={ui.title}>{request.request_no}</Text>
        <StatusBadge status={request.status} />
      </View>

      <View style={[ui.card, { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }]}>
        <DetailField label="Hizmet" value={request.problem_type} />
        <DetailField label="Telefon" value={request.phone} />
        <DetailField label="Adres" value={request.address} />
        <DetailField label="Not" value={request.note} />
        <DetailField label="Marka" value={request.brand} />
        <DetailField
          label="Oluşturulma"
          value={request.created_at ? new Date(request.created_at).toLocaleString("tr-TR") : null}
        />
      </View>

      {(request.latitude || request.longitude) && (
        <View style={[ui.card, { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }]}>
          <DetailField label="Enlem" value={request.latitude ? String(request.latitude) : null} />
          <DetailField label="Boylam" value={request.longitude ? String(request.longitude) : null} />
        </View>
      )}

      {request.rating && (
        <View style={[ui.card, { gap: spacing.sm }]}>
          <Text style={ui.heading}>Müşteri Değerlendirmesi</Text>
          <Text style={ui.body}>{"★".repeat(request.rating)}{"☆".repeat(5 - request.rating)}</Text>
          {request.review_comment && <Text style={ui.body}>{request.review_comment}</Text>}
        </View>
      )}
    </>
  );
}
