import React, { useRef, useState } from "react";
import { Image, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/hooks/use-catalog";
import { ConfigurationError, createServiceRequest } from "@/services/requests";
import { ui } from "@/theme";

export function ServiceRequestForm({
  categorySlug,
  serviceTypeSlug,
}: {
  categorySlug?: string;
  serviceTypeSlug?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    catalog,
    loading: catalogLoading,
    error: catalogError,
    retry,
  } = useCatalog();
  const category = catalog?.categories.find(
    (item) => item.slug === categorySlug,
  );
  const serviceType = catalog?.serviceTypes.find(
    (item) => item.categoryId === category?.id && item.slug === serviceTypeSlug,
  );
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [acType, setAcType] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [requestNo, setRequestNo] = useState("");
  const submitting = useRef(false);
  async function getLocation() {
    setLocating(true);
    setMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setMessage(
          "Konum izni verilmedi. Adresinizi yazarak devam edebilirsiniz.",
        );
        return;
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
    } catch {
      setMessage("Konum alınamadı. Tekrar deneyin veya adresinizi yazın.");
    } finally {
      setLocating(false);
    }
  }
  async function pickPhoto() {
    setPicking(true);
    setMessage("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch {
      setMessage("Fotoğraf seçilemedi. Lütfen tekrar deneyin.");
    } finally {
      setPicking(false);
    }
  }
  async function submit() {
    if (submitting.current || !category || !serviceType) return;
    if (!user) {
      setMessage("Talep oluşturmak için giriş yapmalısınız.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10 || !address.trim()) {
      setMessage("Geçerli bir telefon numarası ve adres girin.");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setMessage("");
    try {
      const result = await createServiceRequest({
        customerId: user.id,
        categorySlug: category.slug,
        categoryId: catalog?.source === "remote" ? category.id : null,
        serviceTypeSlug: serviceType.slug,
        serviceTypeId: catalog?.source === "remote" ? serviceType.id : null,
        serviceTypeName: serviceType.name,
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ...location,
        photoUri: photo?.uri,
        photoMimeType: photo?.mimeType,
        brand: category.slug === "klima" ? brand : null,
        acType: category.slug === "klima" ? acType : null,
      });
      setRequestNo(result.requestNo);
    } catch (error) {
      setMessage(
        error instanceof ConfigurationError
          ? error.message
          : "Talep kaydedilemedi. Bilgileriniz korunuyor; bağlantınızı kontrol edip tekrar deneyin.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  if (requestNo)
    return (
      <Screen insetTop={false} width="medium">
        <Text style={ui.title}>Talebiniz oluşturuldu</Text>
        <Text selectable style={ui.body}>
          Talep no: {requestNo}
        </Text>
        <Button
          title="Talebi Takip Et"
          onPress={() =>
            router.replace({
              pathname: "/(tabs)/tracking",
              params: { requestNo },
            })
          }
        />
      </Screen>
    );
  return (
    <Screen insetTop={false} width="medium">
      {catalogLoading ? (
        <State loading title="Hizmet bilgileri yükleniyor…" />
      ) : catalogError ? (
        <State title="Hizmet bilgisi alınamadı." retry={retry} />
      ) : !category || !serviceType ? (
        <State title="Hizmet bulunamadı. Ana sayfadan yeniden seçim yapın." />
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.caption}>1 — Hizmet</Text>
            <Text style={ui.heading}>
              {category.name} · {serviceType.name}
            </Text>
          </View>
          <Text style={ui.heading}>2 — Sorunu anlatın</Text>
          <TextInput
            accessibilityLabel="Sorunun açıklaması"
            editable={!saving}
            style={[ui.input, { minHeight: 112, textAlignVertical: "top" }]}
            multiline
            placeholder="Neye ihtiyacınız var? Detayları paylaşın."
            value={description}
            onChangeText={setDescription}
          />
          {category.slug === "klima" && (
            <View style={ui.card}>
              <Text style={ui.caption}>Klima bilgileri (isteğe bağlı)</Text>
              <TextInput
                accessibilityLabel="Klima markası"
                editable={!saving}
                style={ui.input}
                placeholder="Klima markası"
                value={brand}
                onChangeText={setBrand}
              />
              <TextInput
                accessibilityLabel="Klima tipi"
                editable={!saving}
                style={ui.input}
                placeholder="Klima tipi (Split, Salon, VRF…)"
                value={acType}
                onChangeText={setAcType}
              />
            </View>
          )}
          <Text style={ui.heading}>3 — Fotoğraf ekleyin</Text>
          <Text style={ui.caption}>
            İsteğe bağlı. Sorunun anlaşılmasına yardımcı olur.
          </Text>
          {photo && (
            <Image
              accessibilityLabel="Seçilen hizmet fotoğrafı"
              source={{ uri: photo.uri }}
              style={{ height: 160, borderRadius: 12, width: "100%" }}
            />
          )}
          <Button
            title={photo ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
            onPress={pickPhoto}
            secondary
            loading={picking}
            disabled={saving}
          />
          <Text style={ui.heading}>4 — Konum</Text>
          <TextInput
            accessibilityLabel="Adres (zorunlu)"
            editable={!saving}
            style={ui.input}
            multiline
            placeholder="Açık adresiniz (zorunlu)"
            value={address}
            onChangeText={setAddress}
          />
          <Button
            title={location ? "Konum alındı · Yenile" : "Konumumu al"}
            onPress={getLocation}
            secondary
            loading={locating}
            disabled={saving}
          />
          <Text style={ui.heading}>5 — İletişim</Text>
          <TextInput
            accessibilityLabel="Telefon numarası (zorunlu)"
            editable={!saving}
            style={ui.input}
            placeholder="Telefon numaranız"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
          />
          {!!message && <State title={message} />}
          <Button
            title={
              saving
                ? photo
                  ? "Fotoğraf ve talep kaydediliyor…"
                  : "Talep kaydediliyor…"
                : "Talep Oluştur"
            }
            onPress={submit}
            loading={saving}
            disabled={locating || picking}
          />
        </>
      )}
    </Screen>
  );
}
