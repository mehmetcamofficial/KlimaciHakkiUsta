import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function TrackingScreen() {
  const [request, setRequest] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');

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

    if (data?.rating) {
      setSelectedRating(data.rating);
    }

    if (data?.review_comment) {
      setReviewComment(data.review_comment);
    }
  }

  async function submitReview() {
    if (!request?.id) {
      Alert.alert('Hata', 'Talep bulunamadı.');
      return;
    }

    if (!selectedRating) {
      Alert.alert('Eksik Bilgi', 'Lütfen 1 ile 5 arasında yıldız seç.');
      return;
    }

    const { error } = await supabase
      .from('service_requests')
      .update({
        rating: selectedRating,
        review_comment: reviewComment,
      })
      .eq('id', request.id);

    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
      return;
    }

    Alert.alert('Teşekkürler', 'Değerlendirmen kaydedildi.');
    loadRequest();
  }

  const steps = ['Talep alındı', 'Usta aranıyor', 'Usta atandı', 'Yolda', 'Servis tamamlandı'];
  const status = request?.status || 'Talep alındı';
  const activeIndex = steps.indexOf(status);

  const hasCustomerLocation = request?.latitude && request?.longitude;
  const hasTechnicianLocation = request?.technician_latitude && request?.technician_longitude;

  const distanceKm =
    hasCustomerLocation && hasTechnicianLocation
      ? getDistanceKm(
          request.technician_latitude,
          request.technician_longitude,
          request.latitude,
          request.longitude
        )
      : null;

  const etaMinutes = distanceKm !== null ? Math.max(1, Math.ceil((distanceKm / 30) * 60)) : null;

  const progress =
    distanceKm !== null
      ? distanceKm > 3
        ? 1
        : Math.max(0.05, Math.min(1, distanceKm / 3))
      : 1;

  const isVeryClose = distanceKm !== null && distanceKm < 0.2;
  const isCompleted = status === 'Servis tamamlandı';
  const hasReview = !!request?.rating;

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

          <Text style={styles.infoText}>
            Tahmini Varış: {etaMinutes ? `${etaMinutes} dakika` : request?.eta || '-'}
          </Text>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Canlı Konum</Text>

          <Text style={styles.mapText}>
            Müşteri Konumu: {hasCustomerLocation ? 'Alındı' : 'Yok'}
          </Text>

          <Text style={styles.mapText}>
            Usta Konumu: {hasTechnicianLocation ? 'Paylaşıldı' : 'Henüz paylaşılmadı'}
          </Text>

          {distanceKm !== null ? (
            <>
              <View style={styles.miniMap}>
                <View style={styles.mapLine} />

                <View style={[styles.pinWrap, styles.customerPin]}>
                  <Text style={styles.pinIcon}>📍</Text>
                  <Text style={styles.customerLabel}>Müşteri</Text>
                </View>

                <View
                  style={[
                    styles.pinWrap,
                    {
                      top: isVeryClose ? 42 : 54,
                      left: `${20 + progress * 60}%`,
                    },
                  ]}
                >
                  {isVeryClose ? (
                    <View style={styles.techBubble}>
                      <Text style={styles.techBubbleText}>Usta</Text>
                    </View>
                  ) : null}

                  <Text style={styles.pinIcon}>🚐</Text>

                  {!isVeryClose ? (
                    <Text style={styles.techLabel}>Usta</Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.distanceBox, isCompleted && styles.completedBox]}>
                <Text style={styles.distanceTitle}>
                  {isCompleted ? '✅ Servis tamamlandı' : '🚐 Usta size doğru geliyor'}
                </Text>

                {isCompleted ? (
                  <Text style={styles.distanceText}>
                    Usta adresinize ulaştı ve servis süreci tamamlandı.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.distanceText}>
                      Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                    </Text>
                    <Text style={styles.distanceText}>Tahmini varış: {etaMinutes} dk</Text>
                  </>
                )}
              </View>
            </>
          ) : null}

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

          {hasCustomerLocation && hasTechnicianLocation && !isCompleted ? (
            <TouchableOpacity style={styles.routeButton} onPress={openRouteMap}>
              <Text style={styles.routeButtonText}>🗺️ Yol Tarifi Aç</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isCompleted ? (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>
              {hasReview ? 'Değerlendirmen' : 'Servisi Değerlendir'}
            </Text>

            <Text style={styles.reviewSubtitle}>
              Aldığın hizmeti 1-5 yıldız arasında puanla.
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Text style={[styles.star, selectedRating >= star && styles.starActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Yorum yazmak ister misin?"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />

            <TouchableOpacity style={styles.reviewButton} onPress={submitReview}>
              <Text style={styles.reviewButtonText}>
                {hasReview ? 'Değerlendirmeyi Güncelle' : 'Değerlendirmeyi Gönder'}
              </Text>
            </TouchableOpacity>

            {hasReview ? (
              <Text style={styles.savedReviewText}>
                Kaydedilen puan: {request.rating}/5
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },

  title: { fontSize: 34, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 10, color: '#64748B', fontSize: 18 },

  card: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  circle: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    marginRight: 16,
  },

  circleActive: { backgroundColor: '#10B981' },

  stepText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },

  stepTextActive: { color: '#0F172A' },

  infoCard: {
    marginTop: 24,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
  },

  infoTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  infoText: { color: '#CBD5E1', marginTop: 12, fontSize: 16 },
  callText: { color: '#38BDF8', marginTop: 12, fontSize: 16, fontWeight: '800' },

  mapCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },

  mapTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  mapText: { marginTop: 10, color: '#64748B', fontSize: 16 },

  miniMap: {
    height: 170,
    backgroundColor: '#E0F2FE',
    borderRadius: 22,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },

  mapLine: {
    position: 'absolute',
    left: 56,
    right: 56,
    top: 84,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
  },

  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
    minWidth: 70,
  },

  customerPin: { left: 18, top: 54 },
  pinIcon: { fontSize: 34 },

  customerLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  techLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  techBubble: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  techBubbleText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },

  distanceBox: {
    marginTop: 16,
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 18,
  },

  completedBox: { backgroundColor: '#DCFCE7' },

  distanceTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },

  distanceText: {
    color: '#0369A1',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
  },

  mapButton: {
    marginTop: 14,
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
  },

  mapButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
  },

  routeButton: {
    marginTop: 14,
    backgroundColor: '#06B6D4',
    padding: 16,
    borderRadius: 16,
  },

  routeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
  },

  reviewCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },

  reviewTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },

  reviewSubtitle: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 16,
  },

  starRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },

  star: {
    fontSize: 36,
    color: '#CBD5E1',
  },

  starActive: {
    color: '#F59E0B',
  },

  reviewInput: {
    marginTop: 18,
    minHeight: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },

  reviewButton: {
    marginTop: 16,
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 16,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },

  savedReviewText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
});