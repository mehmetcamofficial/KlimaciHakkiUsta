import { useEffect, useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RequireAuth } from "@/components/auth-guard";
import {
  Button,
  Screen,
  State,
  StatusBadge,
} from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import {
  getOwnRequest,
  getRequestPhotoUrl,
  subscribeRequests,
  updateRequest,
  type RequestRow,
} from "@/services/requests";
import { colors, ui } from "@/theme";

const steps = [
  "Talep alındı",
  "Usta aranıyor",
  "Usta atandı",
  "Yolda",
  "Servis tamamlandı",
];
const labels = [
  "Talep alındı",
  "Usta aranıyor",
  "Usta atandı",
  "Usta yolda",
  "Tamamlandı",
];
function distanceKm(a: number, b: number, c: number, d: number) {
  const rad = Math.PI / 180;
  const x =
    Math.sin(((c - a) * rad) / 2) ** 2 +
    Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
function OwnTracking({ customerId }: { customerId: string }) {
  const params = useLocalSearchParams<{ requestNo?: string }>();
  const [lookup, setLookup] = useState(params.requestNo ?? "");
  const [number, setNumber] = useState(params.requestNo ?? "");
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setLookup(params.requestNo ?? "");
    setNumber(params.requestNo ?? "");
  }, [params.requestNo]);
  useEffect(() => {
    let active = true;
    setRequest(null);
    setMessage("");
    setError(false);
    setRating(0);
    setComment("");
    if (!number) return;
    async function load() {
      try {
        const data = await getOwnRequest(number, customerId);
        if (active) {
          setRequest(data);
          setError(false);
          setRating(data?.rating ?? 0);
          setComment(data?.review_comment ?? "");
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    setLoading(true);
    void load();
    const unsubscribe = subscribeRequests("tracking-request", load, customerId);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [number, attempt, customerId]);
  async function review() {
    if (!request || !rating || saving) return;
    setSaving(true);
    setMessage("");
    try {
      await updateRequest(request.id, {
        rating,
        review_comment: comment.trim(),
      });
      setMessage("Değerlendirmeniz kaydedildi.");
    } catch {
      setMessage("Değerlendirme kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setMessage("Bağlantı açılamadı.");
    }
  }
  async function openPhoto() {
    if (!request) return;
    const url = await getRequestPhotoUrl(request);
    if (!url) {
      setMessage("Fotoğraf açılamadı.");
      return;
    }
    await open(url);
  }
  const hasCustomer = request?.latitude != null && request.longitude != null;
  const hasProfessional =
    request?.technician_latitude != null &&
    request.technician_longitude != null;
  const distance =
    hasCustomer && hasProfessional && request
      ? distanceKm(
          request.latitude!,
          request.longitude!,
          request.technician_latitude!,
          request.technician_longitude!,
        )
      : null;
  const activeIndex = steps.indexOf(request?.status ?? "");
  return (
    <Screen>
      <Text style={ui.title}>Talep takibi</Text>
      <TextInput
        accessibilityLabel="Talep numarası"
        style={ui.input}
        placeholder="Talep numaranız"
        autoCapitalize="characters"
        value={lookup}
        onChangeText={setLookup}
      />
      <Button
        title="Talebi bul"
        secondary
        onPress={() => {
          setNumber(lookup.trim());
          setAttempt((value) => value + 1);
        }}
        disabled={!lookup.trim()}
      />
      {loading ? (
        <State loading title="Talebiniz yükleniyor…" />
      ) : error ? (
        <State
          title="Talep yüklenemedi."
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : !request ? (
        <State
          title={
            number
              ? "Bu numarayla talep bulunamadı."
              : "Takip etmek için talep numaranızı girin veya Taleplerim ekranından seçin."
          }
        />
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.heading}>
              {request.problem_type ?? "Hizmet talebi"}
            </Text>
            <Text selectable style={ui.caption}>
              {request.request_no}
            </Text>
            <StatusBadge status={request.status} />
            {steps.map((step, index) => (
              <View key={step} style={[ui.row, { paddingVertical: 8 }]}>
                <Ionicons
                  name={
                    index < activeIndex
                      ? "checkmark-circle"
                      : index === activeIndex
                        ? "radio-button-on"
                        : "ellipse-outline"
                  }
                  size={25}
                  color={index <= activeIndex ? colors.accent : colors.muted}
                />
                <Text style={[ui.body, { flex: 1 }]}>
                  {labels[index]}
                  {index === activeIndex ? " · Şu an" : ""}
                </Text>
              </View>
            ))}
          </View>
          <View style={ui.card}>
            <Text style={ui.heading}>Profesyonel bilgileri</Text>
            <Text style={ui.body}>
              {request.technician_name ??
                "Henüz profesyonel bilgisi paylaşılmadı."}
            </Text>
            {request.technician_phone && (
              <Button
                secondary
                title="Profesyoneli ara"
                onPress={() => void open(`tel:${request.technician_phone}`)}
              />
            )}
          </View>
          <View style={ui.card}>
            <Text style={ui.heading}>Konum ve hizmet detayları</Text>
            <Text style={ui.body}>{request.address}</Text>
            {request.note && <Text style={ui.body}>{request.note}</Text>}
            {(request.photo_url || request.photo_path) && (
              <Button
                secondary
                title="Talep fotoğrafını aç"
                onPress={() => void openPhoto()}
              />
            )}
            {hasCustomer && (
              <Button
                secondary
                title="Hizmet konumunu aç"
                onPress={() =>
                  void open(
                    `https://www.google.com/maps?q=${request.latitude},${request.longitude}`,
                  )
                }
              />
            )}
            {hasProfessional && (
              <Button
                secondary
                title="Paylaşılan usta konumunu aç"
                onPress={() =>
                  void open(
                    `https://www.google.com/maps?q=${request.technician_latitude},${request.technician_longitude}`,
                  )
                }
              />
            )}
            {distance !== null && request.status !== "Servis tamamlandı" && (
              <>
                <Text style={ui.caption}>
                  Kuş uçuşu mesafe: {distance.toFixed(1)} km. Yaklaşık süre:{" "}
                  {Math.max(1, Math.ceil((distance / 30) * 60))} dk (trafik ve
                  gerçek rota dahil değil).
                </Text>
                <Button
                  secondary
                  title="Yol tarifini aç"
                  onPress={() =>
                    void open(
                      `https://www.google.com/maps/dir/?api=1&origin=${request.technician_latitude},${request.technician_longitude}&destination=${request.latitude},${request.longitude}`,
                    )
                  }
                />
              </>
            )}
          </View>
          {request.status === "Servis tamamlandı" && (
            <View style={ui.card}>
              <Text style={ui.heading}>Hizmeti değerlendirin</Text>
              <View style={[ui.row, { flexWrap: "wrap" }]}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} yıldız`}
                    accessibilityState={{ selected: rating === value }}
                    onPress={() => setRating(value)}
                    style={{
                      minHeight: 48,
                      minWidth: 44,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={rating >= value ? "star" : "star-outline"}
                      size={28}
                      color={colors.warning}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Değerlendirme yorumu"
                style={ui.input}
                multiline
                placeholder="Deneyiminizi paylaşın (isteğe bağlı)"
                value={comment}
                onChangeText={setComment}
              />
              <Button
                title="Değerlendirmeyi kaydet"
                onPress={review}
                loading={saving}
                disabled={!rating}
              />
            </View>
          )}
        </>
      )}
      {!!message && <State title={message} />}
    </Screen>
  );
}

export default function TrackingScreen() {
  const { user } = useAuth();
  return <RequireAuth>{user && <OwnTracking customerId={user.id} />}</RequireAuth>;
}
