# UstaYanımda

Klimacı Hakkı Usta prototipinden gelişen çok kategorili yerel hizmet marketplace temeli.
Repository ve klasör adı değiştirilmedi. Hedef akış:
**CUSTOMER → SERVICE REQUEST → PROFESSIONAL → OPERATION → COMPLETION → REVIEW**.

## Mevcut kapsam

Expo SDK 54, React Native 0.81, React 19, TypeScript, Expo Router 6 ve Supabase
(Postgres, Storage, Realtime). Yeni state yönetimi veya animasyon bağımlılığı eklenmedi.
Supabase istemcisi, Android Hermes derlemesindeki dinamik import hatası nedeniyle
2.109.0 sürümüne sabitlendi ([upstream hata](https://github.com/supabase/supabase-js/issues/2380)).

10 kategori ve 45 hizmet tipi: Klima, Elektrik, Su Tesisatı, Kombi / Doğalgaz,
Çilingir, Beyaz Eşya, Boya / Tadilat, Mobilya / Montaj, Temizlik, Bahçe / Peyzaj.
Klima Arızası, Klima Bakımı gibi gerçek hizmet adları korunur.

## Mimari ve rotalar

- `types/domain.ts`: ServiceCategory, ServiceType, ServiceRequest, RequestStatus.
- `data/service-catalog.ts`: 10 kategori / 45 hizmetin başlangıç verisi.
- `services/categories.ts`: tek katalog snapshot'ı; remote UUID'ler yerel ID'lerle karıştırılmaz.
- `services/requests.ts`: kayıt, Storage, listeleme, numarayla takip, güncelleme ve Realtime.
- `hooks/use-catalog.ts`: yüklenme/hata/tekrar deneme ve unmount koruması.
- `theme/index.ts`: renk, spacing, radius, typography, shadow token'ları.
- `components/ui/marketplace.tsx`: Screen, Brand, Button, State, StatusBadge, ServiceCard.
- `components/service-request-form.tsx`: ortak form, GPS/fotoğraf, başarı ve takip CTA'sı.
- `/`: Türkçe kategori/hizmet adı araması, kategori grid'i, aynı modelden hızlı hizmetler.
- `/services/[categorySlug]`: tüm kategoriler için tek hizmet ekranı.
- `/request/new?category=klima&type=klima-arizasi`: seçilen hizmet formu.
- `/service`: Taleplerim; son 50 kayıt, **henüz kullanıcıya özel değil**.
- `/tracking?requestNo=...`: yalnız seçilen/aranan talep; başka bir son kaydı otomatik seçmez.
- `/profile`: gerçek durumu açıklayan misafir profili, geçmiş bağlantısı.
- `/admin`: mevcut operasyon ekranı, müşteri tab menüsünden gizli; **RBAC değildir**.

Kategori 1 → N hizmet; talep kategori + hizmet ID/slug bilgilerini taşır.
Yeni kategori/hizmet için normalde yalnız DB verisi eklemek yeterlidir; yeni ekran gerekmez.
Offline/ilk kurulum verisini güncel tutmak için yerel katalog ve seed de güncellenmelidir.
Sunucu boş liste döndürürse boş kalır; yalnız eksik tablo hatasında başlangıç kataloğu
kullanılır ve UI bunu belirtir. Ağ/yetki hataları tekrar deneme ile görünürdür.

## Tasarım

Nötr açık zemin, koyu lacivert, kontrollü yeşil/turkuaz; 4/8/12/16/24/32 spacing.
Safe area, klavye kaçınması, geniş metin/small-screen grid uyarlaması, basılma geri
bildirimi, 48–52 dp eylemler ve etiketli ikon kontrolleri. Uygulama bu fazda açık temadır.
Wordmark UI primitive'leri ve Ionicons ile oluşturuldu. Launcher/splash raster
asset'leri hâlâ Expo başlangıç görselleridir; nihai logo bu fazın kapsamı değildir.
Expo `name=UstaYanımda`, `slug=ustayanimda`, `scheme=ustayanimda`; package/bundle ID eklenmedi.

## Veritabanı: inceleme öncesi uygulanmaz

- `supabase/migrations/20260919120000_marketplace_foundation.sql`: mevcut dalda bulunan
  additive tablo/kolon ve idempotent seed migration'ı korundu.
- `supabase/migrations/20260919160000_marketplace_indexes.sql`: kategori/hizmet sorguları
  için additive, tekrar çalıştırılabilir indeksler.

**Remote migration uygulanmadı. Gerçek remote şema/politikalar varsayılmadı.**
Uygulamadan önce mevcut `service_requests` yapısını, constraint ve RLS'yi inceleyin;
SQL dosyaları inceleme için hazırlanmıştır, uygulama otomatik migration çalıştırmaz.
`category_id`, `service_type_id` ve slug kolonları nullable eklenir; eski kayıtlar silinmez.
Migration yoksa yalnız marketplace kolonu eksik hatasında legacy insert denenir;
kategori/hizmet bağlamı `note` içine eklenerek korunur. Diğer hatalarda tekrar insert yapılmaz.

Legacy eşleme: description → `note`, photo → `photo_url`, hizmet adı → `problem_type`.
`brand`, `ac_type` yalnız Klima için doldurulur. `technician_*` eski konum/iletişim
alanları korunur; yeni profesyonel modeli değildir. Sabit Hakkı Usta/telefon ataması kaldırıldı.
Mevcut backend durumları aynen gösterilir; DB'de olmayan “iş başladı” eklenmedi.
Talep numarası UY öneki/zaman/rastgele bölüm kullanır; DB uniqueness/idempotency garantisi değildir.
Storage upload `upsert: false` kullanır; seçilen dosyanın MIME türü korunur.

## Yerel kurulum

Node >=20.19, npm ve Expo Go SDK 54 veya uyumlu development build gerekir.

```sh
npm ci
# Yerel .env oluşturun; commit etmeyin.
npx expo start
npm run android
npm run lint
npx tsc --noEmit
node --test tests/marketplace.cjs
npx expo export --platform android
```

`.env` değişkenleri: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
Yalnız client anon/publishable anahtar kullanın; service-role/private anahtar eklemeyin.
`service-photos` bucket ve mevcut servis talep tablosu önceden hazırlanmış olmalıdır.
Bunlar kaynak koddan otomatik oluşturulmaz.

## Sınırlar ve güvenlik

- Auth, müşteri sahipliği, CUSTOMER/PROFESSIONAL/ADMIN yetkileri ve güvenli RLS henüz yok.
- Taleplerim prototipte genel kayıt listesidir. Talep numarası bir yetki mekanizması değildir.
- Admin yalnız navigasyonda gizli; `/admin` açık rota. Durum/konum yönetimi legacy prototiptir.
- Storage public URL davranışı korunur; private bucket/signed URL Faz 2'dir.
- Otomatik usta eşleştirme/atama yok. Geçmiş statik profesyonel kayıtları değiştirilmedi.
- Ana sayfada sahipliği doğrulanamayan kayıt “sizin aktif talebiniz” diye gösterilmez.
- Konum ve ETA yalnız mevcut koordinatlardan kuş uçuşu kaba tahmindir; trafik/rota servisi değildir.
- Başarılı upload sonrası başarısız DB insert orphan dosya bırakabilir; transactional cleanup
  ve sunucu idempotency sonraki fazda ele alınmalı.
- Mevcut bağımlılık ağacında npm audit bulguları ve Expo patch sürüm uyarıları var;
  zorlayıcı/geniş dependency upgrade bu fazda yapılmadı.

## Faz 1 kontrol listesi

- [x] UstaYanımda uygulama kimliği ve UI wordmark.
- [x] Tipli kategori → hizmet → talep modeli, 10 kategori / 45 hizmet.
- [x] Ortak tasarım token/bileşenleri ve müşteri navigasyonu.
- [x] Arama, hızlı hizmetler, dinamik kategori/hizmet/form rotaları.
- [x] Fotoğraf/GPS/kayıt yolu, başarı → doğru talep takibi.
- [x] Taleplerim, profil, durum takibi, değerlendirme ve admin işlevleri.
- [x] Additive migration hazırlığı; remote DB değişikliği yapılmadı.
- [x] Lint, TypeScript ve servis kontratı testleri.
- [x] Android Hermes production bundle export.
- [ ] Canlı DB üzerinde uçtan uca fotoğraf + GPS + kayıt + rating doğrulaması.
- [ ] Tüm hedef Android boyutlarında tamamlanmış görsel regresyon.

Ayrıntılı test sonuçları: [docs/validation/phase1.md](docs/validation/phase1.md).
Başlangıç yol haritası tarihsel referans olarak [docs/roadmap.md](docs/roadmap.md)
içinde korunur; güncel uygulama durumu bu README'dir.

## Sonraki fazlar

Faz 2: Auth, profiles, roller, RLS, talep sahipliği, private Storage/signed URL.
Faz 3–4: gerçek talep yaşam döngüsü, idempotency, profesyonel onboarding/atama.
Faz 5–6: operasyon/konum olayları ve güven/değerlendirme modeli.
Faz 7–10: bildirim, randevu/ödeme, release kalite kapıları ve AI destekli sınıflandırma.
Bu yetenekler mevcutmuş gibi sunulmaz.
