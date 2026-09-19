import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { State } from "@/components/ui/marketplace";
import { StatCard, AdminRequestRow } from "@/components/admin/admin-ui";
import { KNOWN_REQUEST_STATUSES } from "@/lib/admin";
import {
  countRequestsForAdmin,
  listRequestsForAdmin,
  type RequestRow,
} from "@/services/requests";
import { spacing, ui } from "@/theme";

interface DashboardData {
  total: number;
  byStatus: { status: string; count: number }[];
  recent: RequestRow[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [total, statusCounts, recent] = await Promise.all([
        countRequestsForAdmin(),
        Promise.all(
          KNOWN_REQUEST_STATUSES.map(async (status) => ({
            status,
            count: await countRequestsForAdmin({ status }),
          })),
        ),
        listRequestsForAdmin(),
      ]);
      setData({ total, byStatus: statusCounts, recent: recent.slice(0, 5) });
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
      <Text style={ui.title}>Dashboard</Text>
      <Text style={ui.body}>RLS ile erişilebilen taleplere göre gerçek zamanlı özet.</Text>

      {loading ? (
        <State loading title="Yükleniyor…" />
      ) : error ? (
        <State title="Panel verileri yüklenemedi." retry={() => setAttempt((value) => value + 1)} />
      ) : data ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <StatCard label="Erişilebilir toplam talep" value={data.total} />
            {data.byStatus.map((entry) => (
              <StatCard key={entry.status} label={entry.status} value={entry.count} />
            ))}
          </View>

          <Text style={ui.heading}>Son Talepler</Text>
          {data.recent.length === 0 ? (
            <State title="Henüz talep yok." />
          ) : (
            <View style={{ gap: spacing.md }}>
              {data.recent.map((request) => (
                <AdminRequestRow key={request.id} request={request} />
              ))}
            </View>
          )}
        </>
      ) : null}
    </>
  );
}
