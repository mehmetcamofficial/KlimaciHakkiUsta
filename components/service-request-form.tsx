import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchServiceCategoryBySlug, fetchServiceTypesByCategorySlug } from '@/services/categories';
import { createServiceRequest } from '@/services/requests';
import type { ServiceCategory, ServiceType } from '@/types/domain';

const acTypes = ['Split Klima', 'Salon Tipi', 'VRF', 'Kaset Tipi'];

interface ServiceRequestFormProps {
  categorySlug?: string;
  serviceTypeSlug?: string;
}

export function ServiceRequestForm({ categorySlug, serviceTypeSlug }: ServiceRequestFormProps) {
  const resolvedCategorySlug = categorySlug ?? 'klima';

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

  const [acType, setAcType] = useState('');
  const [brand, setBrand] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(false);

      try {
        const [categoryResult, typesResult] = await Promise.all([
          fetchServiceCategoryBySlug(resolvedCategorySlug),
          fetchServiceTypesByCategorySlug(resolvedCategorySlug),
        ]);

        if (cancelled) return;

        setCategory(categoryResult);
        setServiceTypes(typesResult);

        const preselected = serviceTypeSlug
          ? typesResult.find((type) => type.slug === serviceTypeSlug)
          : undefined;
        setSelectedServiceType(preselected ?? typesResult[0] ?? null);
      } catch {
        if (!cancelled) setCatalogError(true);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [resolvedCategorySlug, serviceTypeSlug]);

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Konum İzni Gerekli', 'Konum almak için izin vermelisin.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
    Alert.alert('Konum Alındı', 'GPS konumun servis talebine eklendi.');
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function submitRequest() {
    if (!phone || !address || !selectedServiceType) {
      Alert.alert('Eksik Bilgi', 'Telefon, adres ve hizmet tipi zorunludur.');
      return;
    }

    setLoading(true);

    try {
      const { requestNo } = await createServiceRequest({
        categorySlug: resolvedCategorySlug,
        categoryId: category?.id && category.id !== resolvedCategorySlug ? category.id : null,
        serviceTypeSlug: selectedServiceType.slug,
        serviceTypeId:
          selectedServiceType.id && selectedServiceType.id !== `${resolvedCategorySlug}:${selectedServiceType.slug}`
            ? selectedServiceType.id
            : null,
        serviceTypeName: selectedServiceType.name,
        description: note,
        phone,
        address,
        latitude,
        longitude,
        photoUri,
        brand: category?.slug === 'klima' ? brand : null,
        acType: category?.slug === 'klima' ? acType : null,
      });

      Alert.alert('Talep Oluşturuldu', `Talep No: ${requestNo}`);

      setBrand('');
      setAcType('');
      setPhone('');
      setAddress('');
      setNote('');
      setLatitude(null);
      setLongitude(null);
      setPhotoUri(null);
    } catch (error: any) {
      Alert.alert('Kayıt Hatası', error.message || 'Talep kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  }

  if (catalogLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.centerStateText}>Hizmet bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (catalogError || !category) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerStateTitle}>Hizmet bilgisi alınamadı</Text>
        <Text style={styles.centerStateText}>
          Lütfen internet bağlantını kontrol edip tekrar dener misin?
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Talep Oluştur</Text>
      <Text style={styles.subtitle}>
        {category.name}
        {selectedServiceType ? ` • ${selectedServiceType.name}` : ''}
      </Text>

      <Text style={styles.label}>Hizmet Tipi</Text>
      {serviceTypes.length === 0 ? (
        <Text style={styles.emptyText}>Bu kategoride henüz hizmet tipi tanımlanmadı.</Text>
      ) : (
        <View style={styles.chipWrap}>
          {serviceTypes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, selectedServiceType?.id === item.id && styles.chipActive]}
              onPress={() => setSelectedServiceType(item)}>
              <Text
                style={[
                  styles.chipText,
                  selectedServiceType?.id === item.id && styles.chipTextActive,
                ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {category.slug === 'klima' ? (
        <>
          <Text style={styles.label}>Klima Tipi</Text>
          <View style={styles.chipWrap}>
            {acTypes.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, acType === item && styles.chipActive]}
                onPress={() => setAcType(item)}>
                <Text style={[styles.chipText, acType === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Klima Markası"
            value={brand}
            onChangeText={setBrand}
          />
        </>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Telefon Numaranız"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput style={styles.input} placeholder="Adres" value={address} onChangeText={setAddress} />

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Ek açıklama / özel not"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity style={styles.darkButton} onPress={pickImage}>
        <Text style={styles.darkButtonText}>
          {photoUri ? '📷 Fotoğraf Seçildi' : '📷 Fotoğraf Ekle'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.darkButton} onPress={getLocation}>
        <Text style={styles.darkButtonText}>
          {latitude && longitude ? '📍 Konum Alındı' : '📍 Konumumu Al'}
        </Text>
      </TouchableOpacity>

      {latitude && longitude ? (
        <Text style={styles.locationText}>
          Konum: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={submitRequest}
        disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Gönderiliyor...' : 'Servis Talebi Gönder'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 120 },
  centerState: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  centerStateTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  centerStateText: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  title: { marginTop: 48, fontSize: 32, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, lineHeight: 24, color: '#64748B' },
  label: { marginTop: 18, marginBottom: 10, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  emptyText: { fontSize: 15, color: '#64748B' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999 },
  chipActive: { backgroundColor: '#06B6D4' },
  chipText: { color: '#334155', fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 14, fontSize: 16 },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  darkButton: { backgroundColor: '#0F172A', padding: 18, borderRadius: 18, marginTop: 16 },
  darkButtonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  locationText: { marginTop: 10, color: '#64748B', fontWeight: '700' },
  button: { backgroundColor: '#06B6D4', padding: 22, borderRadius: 22, marginTop: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '800', fontSize: 18 },
});
