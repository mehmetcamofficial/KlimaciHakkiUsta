import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { fetchServiceCategoryBySlug, fetchServiceTypesByCategorySlug } from '@/services/categories';
import type { ServiceCategory, ServiceType } from '@/types/domain';

export default function CategoryServiceTypesScreen() {
  const { categorySlug } = useLocalSearchParams<{ categorySlug: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);

      try {
        const [categoryResult, typesResult] = await Promise.all([
          fetchServiceCategoryBySlug(categorySlug),
          fetchServiceTypesByCategorySlug(categorySlug),
        ]);

        if (cancelled) return;

        setCategory(categoryResult);
        setServiceTypes(typesResult);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  function openRequestForm(serviceType: ServiceType) {
    router.push({
      pathname: '/request/new',
      params: { category: categorySlug, type: serviceType.slug },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: category?.name ?? 'Hizmetler' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.centerStateText}>Hizmetler yükleniyor...</Text>
          </View>
        ) : error || !category ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>Kategori bulunamadı</Text>
            <Text style={styles.centerStateText}>
              Lütfen ana sayfaya dönüp tekrar dener misin?
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{category.name}</Text>
            <Text style={styles.subtitle}>{category.description}</Text>

            {serviceTypes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Bu kategoride henüz hizmet tipi tanımlanmadı.</Text>
              </View>
            ) : (
              serviceTypes.map((serviceType) => (
                <TouchableOpacity
                  key={serviceType.id}
                  style={styles.card}
                  onPress={() => openRequestForm(serviceType)}>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{serviceType.name}</Text>
                    {serviceType.description ? (
                      <Text style={styles.cardText}>{serviceType.description}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 60 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  centerStateTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  centerStateText: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 8, marginBottom: 20, fontSize: 15, lineHeight: 22, color: '#64748B' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  emptyText: { color: '#64748B', fontSize: 16, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardTextWrap: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: '#64748B' },
});
