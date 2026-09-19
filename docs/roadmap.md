# Klimacı Hakkı Usta → Çoklu Hizmet Platformu

> **Durum:** Aktif yeniden mimarileştirme / MVP planlama  
> **Mevcut sürüm:** Klima servis talebi prototipi  
> **Hedef:** Klima ile sınırlı olmayan; müşterileri yerel profesyonellerle buluşturan çoklu hizmet platformu.

## 1. Ürün vizyonu

Proje ilk olarak klima servis talebi uygulaması olarak geliştirildi. Mevcut prototipte servis talebi oluşturma, fotoğraf yükleme, konum alma, Supabase'e kayıt, talep takibi, yönetici ekranı, usta konumu ve müşteri değerlendirmesi gibi temel akışlar bulunuyor.

Yeni hedef, bu altyapıyı tek bir klima ustasına bağlı yapıdan çıkarıp **müşteri + profesyonel/usta + admin** rollerine sahip, kategori bazlı yerel hizmet platformuna dönüştürmektir.

Temel kullanıcı akışı:

```text
İhtiyaç
  ↓
Hizmet kategorisi
  ↓
Hizmet / sorun tipi
  ↓
Açıklama + fotoğraf + konum
  ↓
Servis talebi
  ↓
Uygun profesyonel / atama
  ↓
İş takibi
  ↓
Tamamlama
  ↓
Puan + yorum
```

## 2. Başlangıç hizmet kategorileri

İlk MVP'de öncelikli kategoriler:

- Klima servisi
- Elektrikçi
- Su tesisatçısı
- Kombi / doğalgaz servisi
- Çilingir
- Beyaz eşya servisi
- Boya / badana ve küçük tadilat
- Mobilya / montaj
- Temizlik
- Bahçe / peyzaj

Sonraki genişleme adayları:

- Fayans / seramik
- Parke
- Marangoz
- Cam / PVC / doğrama
- Panjur / kepenk
- Çatı / izolasyon
- Kaynak / demir işleri
- Güvenlik kamerası / alarm
- Uydu / TV
- İnternet / ağ teknik servisi
- Bilgisayar / telefon teknik servis
- Güneş enerjisi
- Otomatik / damla sulama
- Havuz bakımı
- İlaçlama
- Nakliye / küçük eşya taşıma
- Mobil lastik / akü / yol yardım

Kategoriler uygulama koduna sabitlenmemelidir. Hedef yapıda kategoriler ve hizmet tipleri veritabanından yönetilecek, böylece yeni bir meslek eklemek için uygulama sürümü yayınlamak gerekmeyecektir.

## 3. Roller

### Müşteri

- Kategori ve hizmet seçer.
- Talep oluşturur.
- Fotoğraf ve konum ekler.
- Kendi taleplerini görür.
- Atanan profesyoneli ve iş durumunu takip eder.
- İş tamamlandıktan sonra puan ve yorum verir.

### Profesyonel / Usta

- Bir veya birden fazla meslek/hizmet alanına sahip olabilir.
- Hizmet verdiği bölgeleri ve müsaitliğini yönetir.
- Kendisine atanmış işleri görür.
- İş durumunu günceller.
- Gerekli olduğunda konum paylaşır.
- Gelecekte takvim ve kazanç ekranlarına sahip olur.

### Admin

- Kategori ve hizmetleri yönetir.
- Müşteri ve profesyonelleri yönetir.
- Talepleri izler.
- Profesyonel ataması yapar.
- Operasyon, kalite ve değerlendirmeleri takip eder.

## 4. Mevcut teknoloji yığını

| Alan | Teknoloji |
| --- | --- |
| Mobil | Expo SDK 54 |
| UI | React Native 0.81 |
| React | React 19 |
| Dil | TypeScript |
| Routing | Expo Router 6 |
| Navigation | React Navigation / Bottom Tabs |
| Backend/BaaS | Supabase |
| Veritabanı | Supabase Postgres |
| Realtime | Supabase Realtime |
| Dosya | Supabase Storage |
| Konum | expo-location |
| Fotoğraf | expo-image-picker |
| Web hedefi | React Native Web / Expo static web |
| Paket yöneticisi | npm |
| Lint | ESLint / Expo config |

Expo New Architecture açıktır. Typed Routes ve React Compiler deneyleri de aktiftir.

## 5. Mevcut prototip

Şu an kodda bulunan ana ekranlar:

```text
app/
├── (tabs)/
│   ├── index.tsx       Ana ekran
│   ├── service.tsx     Servis talebi
│   ├── tracking.tsx    Talep takibi
│   ├── profile.tsx     Profil / geçmiş
│   └── admin.tsx       Operasyon ekranı
└── _layout.tsx

lib/
└── supabase.ts
```

Mevcut prototipte doğrulanmış temel yetenekler:

- Servis talebi oluşturma
- Klima/arızaya özel form alanları
- GPS konumu alma
- Galeriden fotoğraf seçme
- Supabase Storage'a fotoğraf yükleme
- Supabase'e servis talebi kaydetme
- Realtime güncelleme
- Admin tarafından durum değiştirme
- Usta konumu paylaşımı
- Google Maps yönlendirmesi
- Mesafe / yaklaşık ETA
- Servis sonrası puan ve yorum
- Profil ekranında servis geçmişi

Bu kod, çoklu hizmet platformunun başlangıç prototipi olarak korunacaktır.

## 6. Hedef domain modeli

Önerilen temel veri modeli:

```text
profiles
├── id
├── role: CUSTOMER | PROFESSIONAL | ADMIN
├── full_name
├── phone
└── status

service_categories
├── id
├── name
├── slug
├── icon
└── active

service_types
├── id
├── category_id
├── name
└── active

professionals
├── id
├── profile_id
├── bio
├── rating
├── availability
└── verification_status

professional_services
├── professional_id
└── service_type_id

service_requests
├── id
├── customer_id
├── category_id
├── service_type_id
├── description
├── address
├── latitude / longitude
└── status

request_assignments
├── request_id
├── professional_id
├── assigned_at
└── status

request_events
├── request_id
├── event_type
├── actor_id
└── created_at

reviews
├── request_id
├── customer_id
├── professional_id
├── rating
└── comment
```

Bir profesyonel birden fazla hizmet sunabilir. Örneğin aynı kişi hem klima bakımı hem elektrik işleri sunabilir.

## 7. Hedef uygulama mimarisi

```text
Expo Router UI
│
├── auth/
│   └── giriş / kayıt / oturum
│
├── customer/
│   ├── keşfet / kategoriler
│   ├── talep oluştur
│   ├── taleplerim
│   └── talep takip
│
├── professional/
│   ├── işler
│   ├── iş detayı
│   ├── müsaitlik
│   └── profil
│
└── admin/
    ├── talepler
    ├── profesyoneller
    ├── atamalar
    └── kategoriler

Application Layer
├── types/
├── services/
├── hooks/
├── validation/
└── query/cache

Supabase
├── Auth
├── Postgres
├── Migrations
├── RLS Policies
├── Private Storage
├── Realtime
└── Edge Functions
```

Yetki gerektiren operasyonlar yalnızca UI gizleme ile korunmayacak; RLS ve gerektiğinde Edge Functions ile backend tarafında zorunlu kılınacaktır.

## 8. Faz planı

### Faz 0 — Mevcut prototipi koruma — DONE

- [x] Yerel Git reposunu doğrula.
- [x] Mevcut çalışma ağacını commit'e al.
- [x] GitHub reposunu oluştur.
- [x] `main` branch'ini GitHub'a push et.
- [x] Supabase publishable config'i environment değişkenlerine taşı.
- [x] `.env` dosyalarını Git dışında tut.

### Faz 1 — Marketplace Foundation — NEXT

Amaç: Klima-spesifik veri modelini çoklu hizmet modeline dönüştürmek.

- [ ] Ürün genel isimlendirmesini belirle.
- [ ] `service_categories` modelini oluştur.
- [ ] `service_types` modelini oluştur.
- [ ] İlk kategori seed verisini hazırla.
- [ ] Klima-spesifik talep formunu generic request modeline dönüştür.
- [ ] Ana sayfayı kategori keşif ekranına dönüştür.
- [ ] Kategori → hizmet → talep akışını oluştur.
- [ ] Mevcut klima akışını regression olarak koru.

**Çıkış kriteri:** Yeni meslek/hizmet uygulama koduna yeni ekran eklemeden veri üzerinden sisteme eklenebilmeli.

### Faz 2 — Authentication + RBAC + Veri Güvenliği

- [ ] Supabase Auth.
- [ ] `profiles` modeli.
- [ ] CUSTOMER / PROFESSIONAL / ADMIN rolleri.
- [ ] Talep sahipliği (`customer_id`).
- [ ] RLS politikaları.
- [ ] Admin ekranını rol bazlı koruma.
- [ ] Private Storage + signed URL.
- [ ] Migration dosyalarını repoya alma.

**Çıkış kriteri:** Bir müşteri başka müşterinin talep veya fotoğraflarını görememeli; profesyonel yalnız yetkili olduğu işleri görmeli.

### Faz 3 — Gerçek Talep Akışı

- [ ] `/requests/[id]` detay rotası.
- [ ] “Taleplerim” ekranı.
- [ ] Talep durum geçmişi.
- [ ] Form validation.
- [ ] Loading / empty / error state standardı.
- [ ] Güvenli talep numarası.
- [ ] Idempotency / duplicate koruması.

**Çıkış kriteri:** Bir müşteri baştan sona kendi talebini oluşturup benzersiz talep ekranından takip edebilmeli.

### Faz 4 — Profesyonel / Usta Modülü

- [ ] `professionals` modeli.
- [ ] Birden fazla uzmanlık/hizmet desteği.
- [ ] Profesyonel profil ekranı.
- [ ] Hizmet bölgeleri.
- [ ] Müsaitlik.
- [ ] İş atama.
- [ ] “İşlerim” ekranı.
- [ ] İş kabul / reddetme akışı.
- [ ] Durum güncelleme.

**Çıkış kriteri:** Admin gerçek bir profesyoneli talebe atayabilmeli ve profesyonel yalnız kendi işlerini yönetebilmeli.

### Faz 5 — Operasyon + Konum

- [ ] Atama geçmişi.
- [ ] `request_events`.
- [ ] Harita entegrasyonunu ürünleştir.
- [ ] Gerçek rota / ETA sağlayıcısını değerlendir.
- [ ] Konum izinleri ve KVKK/açık rıza akışı.
- [ ] Gerekliyse kontrollü arka plan konumu.
- [ ] Admin operasyon görünümü.

### Faz 6 — Değerlendirme + Güven

- [ ] `reviews` modeli.
- [ ] Profesyonel puanı.
- [ ] İş sonrası değerlendirme.
- [ ] Profesyonel doğrulama durumu.
- [ ] Şikayet / destek akışı.
- [ ] Kötüye kullanım kontrolleri.

### Faz 7 — Bildirim + İletişim

- [ ] Push notification.
- [ ] Talep oluşturuldu bildirimi.
- [ ] Usta atandı bildirimi.
- [ ] Usta yolda bildirimi.
- [ ] İş tamamlandı bildirimi.
- [ ] SMS / WhatsApp seçeneklerini değerlendirme.
- [ ] Uygulama içi mesajlaşmanın gerekliliğini değerlendirme.

### Faz 8 — Randevu + Ticari Katman

- [ ] Randevu tarih/saat slotları.
- [ ] Fiyat teklifi.
- [ ] Teklif kabul/red.
- [ ] Ödeme altyapısı.
- [ ] Fatura / makbuz gereksinimleri.
- [ ] Platform komisyon modeli.
- [ ] İptal/iade kuralları.

### Faz 9 — Kalite + Release

- [ ] Unit/integration test altyapısı.
- [ ] Kritik RLS testleri.
- [ ] Talep oluşturma E2E testi.
- [ ] Usta atama E2E testi.
- [ ] CI.
- [ ] EAS Build.
- [ ] Android gerçek cihaz testleri.
- [ ] iOS testleri.
- [ ] Crash reporting.
- [ ] Analytics.
- [ ] Production checklist.

### Faz 10 — Akıllı Yönlendirme / AI

MVP güvenli ve stabil olduktan sonra:

- [ ] Serbest metinden kategori tahmini.
- [ ] “Lavabonun altından su geliyor” → Tesisat / Su Kaçağı gibi sınıflandırma.
- [ ] Fotoğraftan destekleyici arıza sınıflandırması.
- [ ] Konum + uzmanlık + müsaitlik bazlı profesyonel önerisi.
- [ ] Talep özetleme.
- [ ] Admin operasyon yardımcısı.

AI çıktıları kritik operasyonlarda tek başına karar verici olmayacaktır.

## 9. MVP kapsamı

İlk gerçek MVP'nin amacı bütün özellikleri yapmak değil, şu döngüyü güvenli biçimde tamamlamaktır:

```text
Müşteri kayıt/giriş
→ kategori seçimi
→ hizmet seçimi
→ talep + fotoğraf + konum
→ admin ataması
→ profesyonelin işi görmesi
→ durum güncellemesi
→ müşterinin takibi
→ tamamlanma
→ puanlama
```

Ödeme, gelişmiş AI, otomatik eşleştirme ve kapsamlı mesajlaşma ilk güvenli MVP için zorunlu değildir.

## 10. Güvenlik ilkeleri

- Service-role veya diğer gizli anahtarlar mobil uygulamaya konulmaz.
- Public/publishable istemci anahtarları environment config üzerinden yönetilir.
- Yetkilendirme yalnızca UI seviyesinde yapılmaz.
- Supabase RLS zorunlu güvenlik katmanıdır.
- Müşteri yalnız kendi verisine erişir.
- Profesyonel yalnız atanmış/yetkili işlere erişir.
- Hassas fotoğraflar private bucket'ta tutulur.
- Şema ve RLS değişiklikleri migration olarak versiyonlanır.
- Hassas operasyonlar gerektiğinde Edge Function/backend üzerinden yürütülür.
- Konum verisi minimum gerekli süre ve kapsamda işlenir.

## 11. Geliştirme prensipleri

- Fazlar sırayla ilerler; güvenlik borcu sonraya bırakılmaz.
- Büyük değişiklikler ayrı branch üzerinde geliştirilir.
- `main` çalışabilir durumda tutulur.
- Migration'lar destructive olmamalı veya açık plan/backup gerektirmelidir.
- Yeni özelliklerde loading, error ve empty state düşünülür.
- Yeni hizmet kategorileri mümkün olduğunca data-driven tasarlanır.
- Klima mevcut regression senaryosu olarak korunur.
- Doğrulanmamış AI tahminleri operasyonel gerçek olarak kaydedilmez.

## 12. Yerel geliştirme

### Gereksinimler

- Node.js
- npm
- Expo / Expo Go veya development build
- Supabase projesi

### Kurulum

```bash
npm install
```

`.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

> Gerçek `.env` dosyası Git'e commit edilmemelidir.

Uygulamayı başlat:

```bash
npx expo start
```

Diğer komutlar:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## 13. Repo

GitHub: https://github.com/mehmetcamofficial/KlimaciHakkiUsta

Mevcut prototip commit'i:

```text
0229777 feat: preserve Klimaci Hakki Usta mobile prototype
```

---

Bu README yaşayan bir ürün ve teknik plan dokümanıdır. Her faz tamamlandığında checklist ve mimari durumu güncellenmelidir.
