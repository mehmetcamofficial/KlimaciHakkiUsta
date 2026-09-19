# Klimacı Hakkı Usta

Mobil bir yerel hizmet marketplace uygulaması. Başlangıçta yalnızca klima servisi
için kurulmuş bir prototip olan uygulama, Faz 1 ile **çoklu hizmet / yerel
profesyonel marketplace** temeline dönüştürülmüştür: kullanıcı bir kategori
(Elektrik, Su Tesisatı, Klima, ...) ve o kategorinin altındaki bir hizmet tipini
seçer, ardından servis talebi oluşturur.

[Expo](https://expo.dev) ve [Expo Router](https://docs.expo.dev/router/introduction)
ile geliştirilmiştir. Veri katmanı [Supabase](https://supabase.com) kullanır.

## Kurulum

```bash
npm install
npx expo start
```

`.env` dosyasında `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY`
tanımlı olmalı (yalnızca anon key — service-role key asla mobil uygulamaya
eklenmemelidir).

## Domain modeli: Kategori → Hizmet Tipi → Servis Talebi

```
Kategori (ör. "Su Tesisatı")
  └─ Hizmet Tipi (ör. "Su Kaçağı")
       └─ Servis Talebi (müşterinin oluşturduğu talep)
```

Tipler [`types/domain.ts`](types/domain.ts) içinde tanımlıdır:
`ServiceCategory`, `ServiceType`, `ServiceRequest`, `RequestStatus`,
`CreateServiceRequestInput`.

Başlangıç katalog verisi (10 kategori, her biri altında birden çok hizmet
tipi) [`data/service-catalog.ts`](data/service-catalog.ts) içinde tutulur.
Bu dosya iki amaca hizmet eder:

1. `supabase/migrations/` altındaki seed SQL'in kaynağıdır.
2. Uygulamanın **çalışma zamanı fallback'idir**: Supabase'deki
   `service_categories` / `service_types` tabloları henüz yoksa (migration
   uygulanmadıysa) veya erişilemiyorsa, uygulama otomatik olarak bu yerel
   katalogdan beslenir — boş/beyaz ekran yerine kategoriler yine listelenir.

### Veri erişim katmanı

Ekranlar Supabase sorgularını doğrudan içermez; [`services/`](services)
altındaki ince repository katmanını kullanır:

- [`services/categories.ts`](services/categories.ts) — kategori ve hizmet
  tipi okuma (Supabase → başarısız olursa yerel katalog fallback).
- [`services/requests.ts`](services/requests.ts) — servis talebi oluşturma
  ve fotoğraf yükleme.

### Yeni kategori eklemek

`data/service-catalog.ts` içindeki `SERVICE_CATALOG` dizisine yeni bir
`{ category, serviceTypes }` girdisi eklemek yeterlidir — hiçbir ekran kodu
değişmez (data-driven). Kalıcı olarak Supabase'de tutmak için aynı satırı
yeni bir migration dosyasıyla `service_categories` tablosuna da ekleyin.

### Yeni hizmet tipi eklemek

İlgili kategorinin `serviceTypes` dizisine yeni bir `serviceType(...)` satırı
eklemek yeterlidir. Aynı şekilde kalıcı hale getirmek için `service_types`
tablosuna additive bir migration ile ekleyin.

## Veritabanı / Migration

`supabase/migrations/20260919120000_marketplace_foundation.sql` dosyası
additive bir migration içerir:

- `service_categories` ve `service_types` tablolarını oluşturur (yoksa).
- `service_requests` tablosuna nullable `category_id`, `category_slug`,
  `service_type_id`, `service_type_slug` kolonlarını ekler (`ADD COLUMN IF
  NOT EXISTS`) — mevcut `brand`, `ac_type`, `problem_type` kolonlarına
  dokunmaz.
- 10 kategori ve altındaki hizmet tiplerini `ON CONFLICT ... DO NOTHING` ile
  tekrar çalıştırılabilir şekilde seed eder.

**Bu migration Faz 1 kapsamında remote veritabanına otomatik uygulanmamıştır.**
Uygulamadan önce inceleyip siz çalıştırmalısınız (`supabase db push` veya
Supabase SQL editor). Uygulanana kadar (veya offline durumda) uygulama yerel
katalog fallback'i ile tam işlevsel kalır; `services/requests.ts` talep
oluştururken önce yeni marketplace kolonlarını dener, kolonlar henüz yoksa
otomatik olarak eski (legacy) alan setiyle tekrar dener — bu sayede Klima
akışı migration uygulanmadan da bozulmaz.

## Klasör yapısı (yeni eklenenler)

```
types/domain.ts              Domain tipleri
data/service-catalog.ts      Kategori + hizmet tipi seed/fallback verisi
services/categories.ts       Kategori/hizmet tipi data-access katmanı
services/requests.ts         Servis talebi oluşturma data-access katmanı
components/service-request-form.tsx  Paylaşılan, kategoriye duyarlı talep formu
app/(tabs)/index.tsx         Ana sayfa → marketplace keşif ekranı (arama + kategori grid)
app/services/[categorySlug].tsx  Kategori altındaki hizmet tiplerini listeler
app/request/new.tsx          Genel (kategori/hizmet tipine duyarlı) talep formu
app/(tabs)/service.tsx       "Servis" sekmesi — geriye dönük uyumluluk için
                              doğrudan Klima → Klima Arızası akışına kısayol
supabase/migrations/         Additive, tekrar çalıştırılabilir SQL migration
```

## Akışlar

- **Marketplace keşif:** Ana Sayfa → kategori seç → hizmet tipi seç → talep
  formu (`/services/[categorySlug]` → `/request/new`).
- **Klima (korunan akış):** Ana Sayfa → Klima kartı **veya** doğrudan "Servis"
  sekmesi → aynı forma Klima / Klima Arızası önseçili olarak açılır. Fotoğraf
  ekleme, GPS konumu alma ve Supabase'e kayıt aynı şekilde çalışır.
- **Takip / Admin / Profil:** Değiştirilmedi; `service_requests` tablosunu
  aynı şekilde okur/günceller, yeni kolonlar nullable olduğu için etkilenmez.

## Faz 1 durumu

- [x] Uygulama artık yalnızca klima kategorisine bağlı değil.
- [x] 10 başlangıç kategorisi tanımlı (`data/service-catalog.ts`).
- [x] Kategorilerin altında hizmet tipi (service type) yapısı var.
- [x] Ana ekran kategori keşfi sunuyor (arama alanı + kategori grid).
- [x] Kategori → hizmet tipi → talep formu akışı çalışıyor.
- [x] Talep modeli kategori/hizmet tipi bilgisini taşıyabiliyor
      (`category_slug`/`service_type_slug`, DB'de mevcutsa `category_id`/
      `service_type_id`).
- [x] Mevcut klima akışı korunuyor (fotoğraf, GPS, kayıt, takip).
- [x] Yeni kategori eklemek için yeni ekran yazmak gerekmiyor (data-driven).
- [x] Yeni kod (types/, data/, services/, yeni bileşenler) tip güvenli,
      gereksiz `any` kullanılmadı.
- [x] `.env` / secret commit edilmedi.
- [x] Lint (`npm run lint`) ve typecheck (`npx tsc --noEmit`) temiz.
- [x] Değişiklikler `feature/phase1-marketplace-foundation` branch'inde.
- [x] `main` otomatik merge edilmedi.

**Faz 1 kapsamı dışında bırakılanlar (sonraki fazlar için):** authentication,
ödeme, profesyonel atama/eşleştirme sistemi, kapsamlı admin paneli, migration'ın
remote veritabanına uygulanması. Bunlar Faz 2 (Authentication/RBAC) ve Faz 4
(Professional modülü) kapsamındadır.

## Diğer Expo komutları

```bash
npx expo start        # geliştirme sunucusu
npm run android        # Android
npm run ios            # iOS
npm run web             # Web
npm run reset-project   # Starter kodu app-example'a taşır (bu proje için kullanılmadı)
```
