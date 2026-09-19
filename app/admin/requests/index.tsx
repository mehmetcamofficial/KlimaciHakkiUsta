import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { State } from "@/components/ui/marketplace";
import { AdminRequestRow } from "@/components/admin/admin-ui";
import { listRequestsForAdmin, type RequestRow } from "@/services/requests";
import { spacing, ui } from "@/theme";

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<RequestRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRequests(await listRequestsForAdmin());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  return (
    <>
      <Text style={ui.title}>Talepler</Text>
      <Text style={ui.body}>En son 50 talep, RLS ile erişilebilen kapsamda.</Text>

      {loading ? (
        <State loading title="Talepler yükleniyor…" />
      ) : error ? (
        <State title="Talepler yüklenemedi." retry={() => setAttempt((value) => value + 1)} />
      ) : !requests?.length ? (
        <State title="Henüz talep yok." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {requests.map((request) => (
            <AdminRequestRow key={request.id} request={request} />
          ))}
        </View>
      )}
    </>
  );
}
