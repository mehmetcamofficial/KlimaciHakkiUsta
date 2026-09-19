import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

const statuses = ['Talep alındı', 'Usta aranıyor', 'Usta atandı', 'Yolda', 'Servis tamamlandı'];

export default function AdminScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [watchingId, setWatchingId] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('admin_service_requests_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);

      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  async function loadRequests() {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      Alert.alert('Veri Hatası', error.message);
      return;
    }

    setRequests(data || []);
  }

  async function updateStatus(id: number, status: string) {
    const updateData: any = { status };

    if (status === 'Usta atandı' || status === 'Yolda') {
      updateData.technician_name = 'Hakkı Usta';
      updateData.technician_phone = '+905551112233';
    }

    const { error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      Alert.alert('Güncelleme Hatası', error.message);
    }
  }

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

  async function startLiveTracking(id: number) {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Konum İzni Gerekli', 'Canlı konum için izin gerekli.');
      return;
    }

    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }

    const newSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      async (location) => {
        await supabase
          .from('service_requests')
          .update({
            technician_latitude: location.coords.latitude,
            technician_longitude: location.coords.longitude,
          })
          .eq('id', id);
      }
    );

    setSubscription(newSubscription);
    setWatchingId(id);

    await updateStatus(id, 'Yolda');

    Alert.alert('Canlı Takip Başladı', 'Usta konumu hareket ettikçe güncellenecek.');
  }

  function stopLiveTracking() {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }

    setWatchingId(null);
    Alert.alert('Canlı Takip Durduruldu', 'Usta konumu artık otomatik güncellenmeyecek.');
  }

  function openCustomerMap(item: any) {
    Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`);
  }

  function openTechnicianMap(item: any) {
    Linking.openURL(`https://www.google.com/maps?q=${item.technician_latitude},${item.technician_longitude}`);
  }

  function openRouteMap(item: any) {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${item.technician_latitude},${item.technician_longitude}&destination=${item.latitude},${item.longitude}`
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Usta Paneli</Text>
      <Text style={styles.subtitle}>Gelen servis taleplerini yönet.</Text>

      {requests.map((item) => {
        const hasCustomerLocation = item.latitude && item.longitude;
        const hasTechnicianLocation = item.technician_latitude && item.technician_longitude;
        const isWatching = watchingId === item.id;

        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.requestNo}>{item.request_no}</Text>
            <Text style={styles.text}>Telefon: {item.phone}</Text>
            <Text style={styles.text}>Adres: {item.address}</Text>
            <Text style={styles.text}>Marka: {item.brand || '-'}</Text>
            <Text style={styles.text}>Arıza: {item.problem_type || '-'}</Text>
            <Text style={styles.status}>Durum: {item.status}</Text>

            {item.photo_url ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(item.photo_url)}
              >
                <Text style={styles.actionButtonText}>📷 Fotoğrafı Aç</Text>
              </TouchableOpacity>
            ) : null}

            {hasCustomerLocation ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openCustomerMap(item)}
              >
                <Text style={styles.actionButtonText}>📍 Müşteri Haritası</Text>
              </TouchableOpacity>
            ) : null}

            {item.status === 'Servis tamamlandı' ? (
              <View style={styles.closedBox}>
                <Text style={styles.closedTitle}>✅ Servis tamamlandı</Text>
                <Text style={styles.closedText}>Bu talep kapatıldı. Canlı konum takibi devre dışı.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareTechnicianLocation(item.id)}
                >
                  <Text style={styles.actionButtonText}>🚐 Usta Konumunu Bir Kez Paylaş</Text>
                </TouchableOpacity>

                {!isWatching ? (
                  <TouchableOpacity
                    style={styles.liveButton}
                    onPress={() => startLiveTracking(item.id)}
                  >
                    <Text style={styles.liveButtonText}>🟢 Canlı Konum Takibini Başlat</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopLiveTracking}
                  >
                    <Text style={styles.liveButtonText}>🔴 Canlı Konum Takibini Durdur</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {item.rating ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewTitle}>Müşteri Değerlendirmesi</Text>
                <Text style={styles.reviewStars}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </Text>
                {item.review_comment ? (
                  <Text style={styles.reviewComment}>{item.review_comment}</Text>
                ) : (
                  <Text style={styles.reviewComment}>Yorum yazılmadı.</Text>
                )}
              </View>
            ) : null}

            <View style={styles.mapBox}>
              <Text style={styles.mapTitle}>Admin Harita Özeti</Text>
              <Text style={styles.mapText}>
                Müşteri: {hasCustomerLocation ? `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}` : 'Konum yok'}
              </Text>
              <Text style={styles.mapText}>
                Usta: {hasTechnicianLocation ? `${Number(item.technician_latitude).toFixed(5)}, ${Number(item.technician_longitude).toFixed(5)}` : 'Konum yok'}
              </Text>

              {hasTechnicianLocation ? (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => openTechnicianMap(item)}
                >
                  <Text style={styles.mapButtonText}>🚐 Usta Konumunu Aç</Text>
                </TouchableOpacity>
              ) : null}

              {hasCustomerLocation && hasTechnicianLocation ? (
                <TouchableOpacity
                  style={styles.routeButton}
                  onPress={() => openRouteMap(item)}
                >
                  <Text style={styles.routeButtonText}>🗺️ Usta → Müşteri Rotası</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.buttonGrid}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    item.status === status && styles.statusButtonActive,
                  ]}
                  onPress={() => updateStatus(item.id, status)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      item.status === status && styles.statusButtonTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {requests.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Henüz servis talebi yok.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 120 },
  title: { marginTop: 48, fontSize: 32, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 18 },
  requestNo: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  text: { fontSize: 16, color: '#64748B', marginTop: 6 },
  status: { fontSize: 17, fontWeight: '800', color: '#06B6D4', marginTop: 12 },
  actionButton: { backgroundColor: '#0F172A', padding: 14, borderRadius: 16, marginTop: 12 },
  actionButtonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  liveButton: { backgroundColor: '#10B981', padding: 14, borderRadius: 16, marginTop: 12 },
  stopButton: { backgroundColor: '#DC2626', padding: 14, borderRadius: 16, marginTop: 12 },
  liveButtonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  reviewBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  reviewTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  reviewComment: {
    color: '#78350F',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '700',
  },
  closedBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  closedTitle: {
    color: '#14532D',
    fontSize: 18,
    fontWeight: '800',
  },
  closedText: {
    color: '#166534',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '700',
  },
  mapBox: { backgroundColor: '#F1F5F9', borderRadius: 18, padding: 16, marginTop: 16 },
  mapTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  mapText: { color: '#64748B', marginTop: 8, fontSize: 14 },
  mapButton: { backgroundColor: '#0F172A', padding: 14, borderRadius: 14, marginTop: 12 },
  mapButtonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  routeButton: { backgroundColor: '#06B6D4', padding: 14, borderRadius: 14, marginTop: 12 },
  routeButtonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  buttonGrid: { marginTop: 16, gap: 10 },
  statusButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 16 },
  statusButtonActive: { backgroundColor: '#06B6D4' },
  statusButtonText: { color: '#334155', fontWeight: '800', textAlign: 'center' },
  statusButtonTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  emptyText: { color: '#64748B', fontSize: 16, textAlign: 'center' },
});