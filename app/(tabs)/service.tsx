import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { RequireAuth } from "@/components/auth-guard";
import {
  Button,
  Screen,
  State,
  StatusBadge,
} from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import {
  listOwnRequests,
  subscribeRequests,
  type RequestRow,
} from "@/services/requests";
import { ui } from "@/theme";

function OwnRequestsList({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await listOwnRequests(customerId);
        if (active) {
          setRequests(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    setLoading(true);
    void load();
    const unsubscribe = subscribeRequests("request-history", load, customerId);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt, customerId]);
  return (
    <Screen>
      <Text style={ui.title}>Taleplerim</Text>
      <Text style={ui.caption}>Yalnızca sizin oluşturduğunuz talepler listelenir.</Text>
      {loading ? (
        <State loading title="Talepler yükleniyor…" />
      ) : error ? (
        <State
          title="Talepler yüklenemedi."
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : !requests.length ? (
        <State title="Henüz talep bulunmuyor. Ana sayfadan bir hizmet seçebilirsiniz." />
      ) : (
        requests.map((request) => (
          <View key={request.id} style={ui.card}>
            <Text style={ui.heading}>
              {request.problem_type ?? "Hizmet talebi"}
            </Text>
            <Text selectable style={ui.caption}>
              {request.request_no}
            </Text>
            <StatusBadge status={request.status} />
            {request.created_at && (
              <Text style={ui.caption}>
                {new Date(request.created_at).toLocaleDateString("tr-TR")}
              </Text>
            )}
            <Text style={ui.body}>{request.address}</Text>
            {request.rating && (
              <Text style={ui.body}>
                Değerlendirme: {request.rating}/5 · {request.review_comment}
              </Text>
            )}
            <Button
              title="Talebi Takip Et"
              secondary
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/tracking",
                  params: { requestNo: request.request_no },
                })
              }
            />
          </View>
        ))
      )}
    </Screen>
  );
}

export default function RequestsScreen() {
  const { user } = useAuth();
  return (
    <RequireAuth>
      {user && <OwnRequestsList customerId={user.id} />}
    </RequireAuth>
  );
}
