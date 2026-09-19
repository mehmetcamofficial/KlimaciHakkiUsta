from pathlib import Path

profile = Path("app/(tabs)/profile.tsx")

profile.write_text("""
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('profile-service-history')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadRequests() {
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .order('id', { ascending: false })
      .limit(20);

    setRequests(data || []);
  }

  const totalRequests = requests.length;
  const completedRequests = requests.filter((item) => item.status === 'Servis tamamlandı').length;
  const activeRequests = requests.filter((item) => item.status !== 'Servis tamamlandı').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.profileCard}>
        <Text style={styles.profileName}>Misafir Kullanıcı</Text>
        <Text style={styles.profileText}>Telefon: Henüz sabit profil yok</Text>
        <Text style={styles.profileText}>Adres: Taleplerden alınır</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Servis Özeti</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalRequests}</Text>
            <Text style={styles.summaryLabel}>Toplam Talep</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{activeRequests}</Text>
            <Text style={styles.summaryLabel}>Aktif Talep</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{completedRequests}</Text>
            <Text style={styles.summaryLabel}>Tamamlanan</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Servis Geçmişi</Text>

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Henüz servis talebi yok.</Text>
        </View>
      ) : null}

      {requests.map((item) => {
        const isCompleted = item.status === 'Servis tamamlandı';
        const hasRating = !!item.rating;
        const hasPhoto = !!item.photo_url;

        return (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.requestNo}>{item.request_no}</Text>
              <View style={[styles.statusPill, isCompleted ? styles.completedPill : styles.activePill]}>
                <Text style={styles.statusPillText}>
                  {isCompleted ? 'Tamamlandı' : 'Aktif'}
                </Text>
              </View>
            </View>

            <Text style={styles.historyText}>Marka: {item.brand || '-'}</Text>
            <Text style={styles.historyText}>Klima Tipi: {item.ac_type || '-'}</Text>
            <Text style={styles.historyText}>Arıza: {item.problem_type || '-'}</Text>
            <Text style={styles.historyText}>Durum: {item.status || '-'}</Text>

            {item.address ? (
              <Text style={styles.historyText}>Adres: {item.address}</Text>
            ) : null}

            {hasRating ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewStars}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </Text>
                <Text style={styles.reviewComment}>
                  {item.review_comment || 'Yorum yazılmadı.'}
                </Text>
              </View>
            ) : isCompleted ? (
              <View style={styles.noReviewBox}>
                <Text style={styles.noReviewText}>Bu servis henüz değerlendirilmedi.</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              {hasPhoto ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => Linking.openURL(item.photo_url)}
                >
                  <Text style={styles.smallButtonText}>📷 Fotoğraf</Text>
                </TouchableOpacity>
              ) : null}

              {item.latitude && item.longitude ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`)
                  }
                >
                  <Text style={styles.smallButtonText}>📍 Konum</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  title: {
    marginTop: 48,
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },

  profileCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },

  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },

  profileText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },

  summaryCard: {
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
  },

  summaryNumber: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  summaryLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  requestNo: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },

  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  completedPill: {
    backgroundColor: '#DCFCE7',
  },

  activePill: {
    backgroundColor: '#E0F2FE',
  },

  statusPillText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },

  historyText: {
    marginTop: 9,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },

  reviewBox: {
    marginTop: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 14,
  },

  reviewStars: {
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: '800',
  },

  reviewComment: {
    color: '#78350F',
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
  },

  noReviewBox: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 14,
  },

  noReviewText: {
    color: '#64748B',
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },

  smallButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
""".strip(), encoding="utf-8")

print("Profil ekranına servis geçmişi eklendi.")
