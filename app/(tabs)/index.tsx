import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchServiceCategories } from '@/services/categories';
import type { ServiceCategory } from '@/types/domain';

export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);

      try {
        const result = await fetchServiceCategories();
        if (!cancelled) setCategories(result);
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
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr');
    if (!query) return categories;
    return categories.filter((category) => category.name.toLocaleLowerCase('tr').includes(query));
  }, [categories, search]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Klimacı Hakkı Usta</Text>
        <Text style={styles.subtitle}>Bugün neye ihtiyacınız var?</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Hangi hizmete ihtiyacınız var?"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionTitle}>Kategoriler</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.centerStateText}>Kategoriler yükleniyor...</Text>
          </View>
        ) : error && categories.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>Kategoriler yüklenemedi</Text>
            <Text style={styles.centerStateText}>
              Lütfen internet bağlantını kontrol edip tekrar dener misin?
            </Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateText}>Aramanla eşleşen kategori bulunamadı.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() =>
                  router.push({ pathname: '/services/[categorySlug]', params: { categorySlug: category.slug } })
                }>
                <View style={styles.categoryIconWrap}>
                  <Ionicons
                    name={category.iconKey as React.ComponentProps<typeof Ionicons>['name']}
                    size={26}
                    color="#06B6D4"
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.darkCard}>
          <Text style={styles.darkCardTitle}>Acil Servis</Text>
          <Text style={styles.darkCardText}>
            Yakındaki uygun ustaya talep gönderilir. Usta kabul edince takip ekranı açılır.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 26,
    color: '#64748B',
  },
  searchBox: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },
  centerState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerStateTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  centerStateText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  darkCard: {
    marginTop: 28,
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 24,
  },
  darkCardTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  darkCardText: {
    marginTop: 8,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
});
