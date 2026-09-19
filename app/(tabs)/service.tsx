import React, { useState } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

const problemTypes = ['Soğutmuyor', 'Su Akıtıyor', 'Ses Yapıyor', 'Hata Kodu', 'Bakım', 'Montaj'];
const acTypes = ['Split Klima', 'Salon Tipi', 'VRF', 'Kaset Tipi'];

export default function ServiceScreen() {
  const [selectedProblem, setSelectedProblem] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [brand, setBrand] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

  async function uploadPhoto(requestNo: string) {
    if (!photoUri) return null;

    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();

    const filePath = `${requestNo}.jpg`;

    const { error } = await supabase.storage
      .from('service-photos')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('service-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function submitRequest() {
    if (!phone || !address || !selectedProblem) {
      Alert.alert('Eksik Bilgi', 'Telefon, adres ve arıza türü zorunludur.');
      return;
    }

    setLoading(true);

    const requestNo =
      'KHU-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const photoUrl = await uploadPhoto(requestNo);

      const { error } = await supabase.from('service_requests').insert({
        request_no: requestNo,
        phone,
        address,
        brand,
        ac_type: selectedType,
        problem_type: selectedProblem,
        note,
        latitude,
        longitude,
        photo_url: photoUrl,
        status: 'Talep alındı',
      });

      if (error) {
        throw error;
      }

      Alert.alert('Talep Oluşturuldu', `Talep No: ${requestNo}`);

      setSelectedProblem('');
      setSelectedType('');
      setBrand('');
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Servis Talebi</Text>
      <Text style={styles.subtitle}>Klima bilgilerini gir, talebini veritabanına kaydedelim.</Text>

      <Text style={styles.label}>Arıza Türü</Text>
      <View style={styles.chipWrap}>
        {problemTypes.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selectedProblem === item && styles.chipActive]}
            onPress={() => setSelectedProblem(item)}>
            <Text style={[styles.chipText, selectedProblem === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Klima Tipi</Text>
      <View style={styles.chipWrap}>
        {acTypes.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selectedType === item && styles.chipActive]}
            onPress={() => setSelectedType(item)}>
            <Text style={[styles.chipText, selectedType === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Klima Markası" value={brand} onChangeText={setBrand} />
      <TextInput style={styles.input} placeholder="Telefon Numaranız" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Adres" value={address} onChangeText={setAddress} />

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Ek açıklama / hata kodu / özel not"
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

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submitRequest} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Gönderiliyor...' : 'Servis Talebi Gönder'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 120 },
  title: { marginTop: 48, fontSize: 32, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, lineHeight: 24, color: '#64748B' },
  label: { marginTop: 18, marginBottom: 10, fontSize: 17, fontWeight: '800', color: '#0F172A' },
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