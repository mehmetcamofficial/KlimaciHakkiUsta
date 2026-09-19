from pathlib import Path

admin = Path("app/(tabs)/admin.tsx")
tracking = Path("app/(tabs)/tracking.tsx")

admin_text = admin.read_text(encoding="utf-8")

admin_text = admin_text.replace(
"import React, { useEffect, useState } from 'react';",
"import React, { useEffect, useState } from 'react';\nimport * as Location from 'expo-location';"
)

insert_func = """
  async function shareTechnicianLocation(id: number) {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Konum İzni Gerekli', 'Usta konumunu paylaşmak için izin gerekli.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    const { error } = await supabase
      .from('service_requests')
      .update({
        technician_latitude: location.coords.latitude,
        technician_longitude: location.coords.longitude,
      })
      .eq('id', id);

    if (error) {
      Alert.alert('Konum Hatası', error.message);
      return;
    }

    Alert.alert('Konum Paylaşıldı', 'Usta konumu müşteriye gönderildi.');
  }

"""

admin_text = admin_text.replace(
"  async function updateStatus(id: number, status: string) {",
insert_func + "  async function updateStatus(id: number, status: string) {"
)

admin_text = admin_text.replace(
"""          <View style={styles.buttonGrid}>""",
"""          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => shareTechnicianLocation(item.id)}
          >
            <Text style={styles.actionButtonText}>🚐 Usta Konumunu Paylaş</Text>
          </TouchableOpacity>

          <View style={styles.buttonGrid}>"""
)

admin.write_text(admin_text, encoding="utf-8")

tracking.write_text("""
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TrackingScreen() {
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    loadRequest();

    const channel = supabase
      .channel('tracking-live-location')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        () => loadRequest()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadRequest() {
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    setRequest(data);
  }

  const steps = ['Talep alındı', 'Usta aranıyor', 'Usta atandı', 'Yolda', 'Servis tamamlandı'];
  const status = request?.status || 'Talep alındı';
  const activeIndex = steps.indexOf(status);

  const hasCustomerLocation = request?.latitude && request?.longitude;
  const hasTechnicianLocation = request?.technician_latitude && request?.technician_longitude;

  function openCustomerMap() {
    Linking.openURL(`https://www.google.com/maps?q=${request.latitude},${request.longitude}`);
  }

  function openTechnicianMap() {
    Linking.openURL(`https://www.google.com/maps?q=${request.technician_latitude},${request.technician_longitude}`);
  }

  function openRouteMap() {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${request.technician_latitude},${request.technician_longitude}&destination=${request.latitude},${request.longitude}`
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Servis Takibi</Text>
        <Text style={styles.subtitle}>Talep No: {request?.request_no || '-'}</Text>

        <View style={styles.card}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.circle, index <= activeIndex && styles.circleActive]} />
              <Text style={[styles.stepText, index <= activeIndex && styles.stepTextActive]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Usta Bilgileri</Text>
          <Text style={styles.infoText}>Ad: {request?.technician_name || 'Henüz atanmadı'}</Text>

          <TouchableOpacity
            disabled={!request?.technician_phone}
            onPress={() => Linking.openURL(`tel:${request.technician_phone}`)}
          >
            <Text style={styles.callText}>
              Telefon: {request?.technician_phone || '-'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>Tahmini Varış: {request?.eta || '-'}</Text>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Canlı Konum</Text>

          <Text style={styles.mapText}>
            Müşteri Konumu: {hasCustomerLocation ? 'Alındı' : 'Yok'}
          </Text>

          <Text style={styles.mapText}>
            Usta Konumu: {hasTechnicianLocation ? 'Paylaşıldı' : 'Henüz paylaşılmadı'}
          </Text>

          {hasCustomerLocation ? (
            <TouchableOpacity style={styles.mapButton} onPress={openCustomerMap}>
              <Text style={styles.mapButtonText}>📍 Müşteri Konumunu Aç</Text>
            </TouchableOpacity>
          ) : null}

          {hasTechnicianLocation ? (
            <TouchableOpacity style={styles.mapButton} onPress={openTechnicianMap}>
              <Text style={styles.mapButtonText}>🚐 Usta Konumunu Aç</Text>
            </TouchableOpacity>
          ) : null}

          {hasCustomerLocation && hasTechnicianLocation ? (
            <TouchableOpacity style={styles.routeButton} onPress={openRouteMap}>
              <Text style={styles.routeButtonText}>��️ Yol Tarifi Aç</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  title: { fontSize: 34, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 10, color: '#64748B', fontSize: 18 },
  card: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  circle: { width: 18, height: 18, borderRadius: 999, backgroundColor: '#CBD5E1', marginRight: 16 },
  circleActive: { backgroundColor: '#10B981' },
  stepText: { fontSize: 18, color: '#64748B', fontWeight: '700' },
  stepTextActive: { color: '#0F172A' },
  infoCard: { marginTop: 24, backgroundColor: '#0F172A', borderRadius: 24, padding: 20 },
  infoTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  infoText: { color: '#CBD5E1', marginTop: 12, fontSize: 16 },
  callText: { color: '#38BDF8', marginTop: 12, fontSize: 16, fontWeight: '800' },
  mapCard: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
  mapTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  mapText: { marginTop: 10, color: '#64748B', fontSize: 16 },
  mapButton: { marginTop: 14, backgroundColor: '#0F172A', padding: 16, borderRadius: 16 },
  mapButtonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '800' },
  routeButton: { marginTop: 14, backgroundColor: '#06B6D4', padding: 16, borderRadius: 16 },
  routeButtonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '800' },
});
""".strip(), encoding="utf-8")

print("Canlı usta konumu ve harita butonları eklendi.")
