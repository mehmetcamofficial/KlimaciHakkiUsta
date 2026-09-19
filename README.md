# UstaYanımda

Klimacı Hakkı Usta prototipinden gelişen çok kategorili yerel hizmet marketplace temeli.
Repository ve klasör adı değiştirilmedi. Hedef akış:
**CUSTOMER → SERVICE REQUEST → PROFESSIONAL → OPERATION → COMPLETION → REVIEW**.

## Mevcut kapsam

Expo SDK 54, React Native 0.81, React 19, TypeScript, Expo Router 6 ve Supabase
(Postgres, Auth, Storage, Realtime). Supabase istemcisi, Android Hermes derlemesindeki
dinamik import hatası nedeniyle 2.109.0 sürümüne sabitlendi
([upstream hata](https://github.com/supabase/supabase-js/issues/2380)).

10 kategori ve 45 hizmet tipi: Klima, Elektrik, Su Tesisatı, Kombi / Doğalgaz,
Çilingir, Beyaz Eşya, Boya / Tadilat, Mobilya / Montaj, Temizlik, Bahçe / Peyzaj.
Klima Arızası, Klima Bakımı gibi gerçek hizmet adları korunur.

Faz 2 ile e-posta/şifre kimlik doğrulama, CUSTOMER/PROFESSIONAL/ADMIN rolleri ve
talep sahipliği eklendi (aşağıdaki "Kimlik, roller ve RLS" bölümüne bakın).

## Mimari ve rotalar

- `types/domain.ts`: ServiceCategory, ServiceType, ServiceRequest, RequestStatus.
- `types/auth.ts`: UserRole, Profile.
- `data/service-catalog.ts`: 10 kategori / 45 hizmetin başlangıç verisi.
- `services/categories.ts`: tek katalog snapshot'ı; remote UUID'ler yerel ID'lerle karıştırılmaz.
- `services/requests.ts`: sahiplikli kayıt, Storage (imzalı URL), listeleme (kendi/admin),
  numarayla takip (yalnız kendi), güncelleme ve Realtime.
- `services/profiles.ts`: kendi profilini okuma/güncelleme.
- `lib/supabase.ts`: AsyncStorage ile oturum kalıcılığı; SSR/statik export sırasında
  (Node, `window` yok) no-op storage'a düşer.
- `lib/auth.tsx`: `AuthProvider`/`useAuth` — session, profile, role, signIn/signUp/signOut.
- `lib/rbac.ts`: `isUserRole`, `decideAccess` (saf, test edilen erişim kararı), `roleLabel`.
- `lib/auth-errors.ts`: Supabase Auth hatalarını Türkçe, kullanıcı dostu mesaja çevirir.
- `components/auth-guard.tsx`: `RequireAuth`, `RequireRole` — **yalnızca UI kolaylığı**,
  gerçek yetkilendirme veritabanında (RLS + trigger) uygulanır.
- `hooks/use-catalog.ts`: yüklenme/hata/tekrar deneme ve unmount koruması.
- `theme/index.ts`: renk, spacing, radius, typography, shadow token'ları.
- `components/ui/marketplace.tsx`: Screen, Brand, Button, State, StatusBadge, ServiceCard.
- `components/service-request-form.tsx`: ortak form, GPS/fotoğraf, başarı ve takip CTA'sı;
  girişli kullanıcı gerektirir.
- `/`: herkese açık — Türkçe kategori/hizmet adı araması, kategori grid'i, hızlı hizmetler.
- `/services/[categorySlug]`: herkese açık — tüm kategoriler için tek hizmet ekranı.
- `/sign-in`, `/sign-up`: herkese açık kimlik doğrulama ekranları.
- `/request/new?category=klima&type=klima-arizasi`: **giriş gerektirir** — seçilen hizmet formu.
- `/service`: Taleplerim — **giriş gerektirir**; yalnızca giriş yapan müşterinin talepleri.
- `/tracking?requestNo=...`: **giriş gerektirir**; yalnızca kendi talebiniz aranabilir/görülebilir.
- `/profile`: **giriş gerektirir** — gerçek profil (ad, e-posta, telefon, rol), çıkış yap.
- `/admin`: **admin rolü gerektirir** — mevcut operasyon ekranı; müşteri tab menüsünden gizli
  *ve* rol kontrolüyle korunur (bkz. "Admin güvenliği").

Kategori 1 → N hizmet; talep kategori + hizmet ID/slug bilgilerini taşır.
Yeni kategori/hizmet için normalde yalnız DB verisi eklemek yeterlidir; yeni ekran gerekmez.

## Kimlik, roller ve RLS (Faz 2)

**Kimlik.** Supabase Auth, e-posta + şifre. Oturum `AsyncStorage` ile cihazda kalıcıdır ve
uygulama açılışında geri yüklenir (`lib/auth.tsx`). Yeni kayıt olan her kullanıcı için
`auth.users` üzerinde bir trigger (`handle_new_user`) otomatik olarak `profiles` tablosunda
`role = 'customer'` ile bir satır oluşturur — istemcinin sign-up sırasında gönderdiği hiçbir
metadata (`role` dahil) bu triggerda okunmaz; rol yükseltme yalnızca sunucu tarafında,
aşağıdaki "Admin bootstrap" adımıyla yapılabilir.

**Rol temsili — karar:** `role`, bir Postgres `enum` değil, `check (role in (...))` ile
kısıtlanmış `text` kolonudur. Enum'lar sonradan değer eklemeye izin verse de yeniden
adlandırma/kaldırma zordur ve her değişiklik dikkat gerektirir; kısıtlı text kolonu aynı
garantiyi (geçersiz değer imkansız) verirken ileride yalnızca additive bir migration ile
genişletilebilir kalır.

**RBAC.** `RequireAuth`/`RequireRole` (`components/auth-guard.tsx`) yalnızca **UI**
kolaylığıdır — hangi ekranın gösterileceğine karar verir, ama hiçbir veriyi korumaz. Gerçek
yetkilendirme sınırı veritabanıdır:

- `profiles`: RLS `select`/`update` yalnızca kendi satırına veya admin'e izin verir.
  `role` kolonu `authenticated`'dan `revoke update` ile alınmıştır — yalnızca
  `full_name`/`phone`/`avatar_path` yazılabilir kolonlardır, bu yüzden bir istemci kendi
  satırını güncellerken `role` göndermiş olsa bile bu sunucu tarafında hiçbir etki yaratmaz.
- `service_categories` / `service_types`: `select` herkese (anon dahil) açık, yalnızca
  `active = true`; yazma hiçbir client rolüne açılmamıştır.
- `service_requests`: `select`/`insert`/`update` satır düzeyinde
  `auth.uid() = customer_id or is_admin(auth.uid())` ile sınırlıdır. Hangi *kolonların*
  değiştirilebileceği (customer sadece `rating`/`review_comment`, yalnızca durum
  `Servis tamamlandı` iken) ayrı bir `before update` trigger'ı ile uygulanır — düz RLS
  politikası tek başına kolon bazlı kısıtlama yapamadığı için.
- Realtime: `service_requests` `supabase_realtime` publication'ına eklenir ve
  `replica identity full` yapılır (RLS farkındalıklı postgres_changes için); istemci ayrıca
  kendi `customer_id`'siyle filtrelenmiş abone olur (savunma katmanı — realtime payload'ı
  hiçbir zaman yetkilendirme için güvenilmez, yalnızca "bir şey değişti, RLS'e göre tekrar
  oku" sinyali olarak kullanılır).

**Legacy (sahipsiz) kayıtlar.** `customer_id` nullable eklenir; mevcut/eski satırlar
`NULL` kalır ve **hiçbir müşteriye** görünmez (`auth.uid() = NULL` hiçbir zaman doğru
değildir) — yalnızca admin görebilir. Hiçbir satır silinmez veya rastgele bir kullanıcıya
atanmaz.

**Admin bootstrap.** Uygulama hiçbir zaman otomatik admin ataması yapmaz. İlk admin'i
belirlemek için, ilgili kullanıcı normal şekilde kayıt olduktan sonra, Supabase SQL
editöründe **siz** çalıştırın:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Güvenli Storage (Faz 2)

Yeni fotoğraf yüklemeleri `service-photos` bucket'ında `{auth.uid()}/{requestNo}/photo.<ext>`
yoluna yazılır (`services/requests.ts` → `uploadRequestPhoto`). Görüntülerken kalıcı bir
public URL değil, her seferinde `createSignedUrl` ile üretilen 1 saatlik imzalı bir URL
kullanılır (`getRequestPhotoUrl`) — bu yüzden `photo_url` yerine yeni `photo_path` kolonu
kaynak olarak tutulur; `photo_url` yalnızca Faz 2 öncesi (legacy) satırlar için geri
uyumluluk amacıyla kalır.

`supabase/migrations/20260919170300_secure_storage.sql` bucket'ı **private**'a çevirir ve
`storage.objects` üzerinde: kendi klasörünü okuma/yazma (klasör adı `auth.uid()`), admin'e
tam okuma, ve klasörsüz (flat) legacy dosyalara yalnızca admin okuma politikaları ekler.
Bu migration **hiçbir objeyi taşımaz/kopyalamaz/silmez** — yalnızca erişim modelini
değiştirir. Bilerek diğer Faz 2 migration'larından ayrı bir dosyadadır çünkü uygulandığı an
mevcut satırlardaki eski `photo_url` public linkleri kırılır (zararsız — sadece görsel
açılmaz hale gelir); bkz. dosyanın kendi başlığındaki not.

## Veritabanı: inceleme öncesi uygulanmaz

Faz 1:

- `supabase/migrations/20260919120000_marketplace_foundation.sql`: additive
  tablo/kolon ve idempotent seed migration'ı.
- `supabase/migrations/20260919160000_marketplace_indexes.sql`: kategori/hizmet sorguları
  için additive, tekrar çalıştırılabilir indeksler.

Faz 2 — sırayla uygulayın, `170300` isteğe bağlı olarak ertelenebilir (yukarıya bakın):

- `supabase/migrations/20260919170000_profiles_and_roles.sql`: `profiles`, roller,
  `is_admin()`, yeni kullanıcı trigger'ı.
- `supabase/migrations/20260919170100_catalog_rls.sql`: kategori/hizmet tipi tablolarında
  RLS (herkese açık okuma, yazma yok).
- `supabase/migrations/20260919170200_service_requests_ownership.sql`: `customer_id`,
  RLS, kolon-bazlı update guard trigger'ı, realtime publication.
- `supabase/migrations/20260919170300_secure_storage.sql`: private bucket + storage
  politikaları (yukarıya bakın — ayrı, isteğe bağlı zamanlanan adım).

**Hiçbiri remote'a otomatik uygulanmadı. Gerçek remote şema/politikalar varsayılmadı.**
Migration dosyaları additive/idempotent yazılmıştır (`if exists`/`if not exists`,
`on conflict do nothing`) ve mevcut satırları silmez/yeniden atamaz. Faz 1 migration'ları
henüz uygulanmamışsa bile Faz 2 migration'ları güvenle uygulanabilir (`to_regclass` ile
tablo varlığı kontrol edilir).

`createServiceRequest`, tam payload'ı (sahiplik + kategori/hizmet kolonları) dener; hangi
opsiyonel kolon eksikse (Faz 1 ve/veya Faz 2'nin hangi kısmı henüz uygulanmadıysa) yalnız
onu payload'dan çıkarıp tekrar dener — ama `customer_id` bu şekilde asla düşürülmez: o
kolon yoksa (Faz 2 ownership migration'ı uygulanmadıysa) sahipsiz bir talep sessizce
oluşturmak yerine açık bir "sunucu güncellemesi gerekiyor" hatası fırlatılır.

Legacy eşleme: description → `note`, photo → `photo_path`/`photo_url`, hizmet adı →
`problem_type`. `brand`, `ac_type` yalnız Klima için doldurulur. `technician_*` eski
konum/iletişim alanları korunur; yeni profesyonel modeli değildir.

## Yerel kurulum

Node >=20.19, npm ve Expo Go SDK 54 veya uyumlu development build gerekir.

```sh
npm ci
# Yerel .env oluşturun; commit etmeyin.
npx expo start
npm run android
npm run lint
npx tsc --noEmit
node --test tests/marketplace.cjs tests/auth.cjs
npx expo export --platform android
```

`.env` değişkenleri: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
Yalnız client anon/publishable anahtar kullanın; **service-role/private anahtar, DB şifresi
veya JWT signing secret asla** eklemeyin — ne `.env`'e ne de kaynak koda.
`service-photos` bucket ve mevcut servis talep tablosu önceden hazırlanmış olmalıdır.
Bunlar kaynak koddan otomatik oluşturulmaz.

## Sınırlar ve güvenlik

- PROFESSIONAL rolü şimdilik yalnızca bir yetkilendirme temeli (geçerli rol değeri,
  profil satırı); eşleştirme/iş akışı/kazanç gibi hiçbir gerçek profesyonel özelliği
  Faz 2 kapsamında değildir. Statik "Hakkı Usta" adı/telefonu (`technician_name`/
  `technician_phone`) hâlâ eski, kimliksiz bir yer tutucudur — gerçek bir profesyonel
  hesabına bağlı değildir.
- `RequireAuth`/`RequireRole` yalnızca UI'dir; **hiçbir zaman** tek güvenlik sınırı olarak
  ele alınmamalıdır — RLS + trigger'lar remote'a uygulanana kadar gerçek koruma yoktur.
- Migration'lar remote'a uygulanana kadar `service_requests` tablosunda RLS/sahiplik
  **etkin değildir**; bu durumda Taleplerim/Takip istemci tarafı `.eq("customer_id", ...)`
  filtresine güvenir, ki bu tek başına güvenlik sınırı değildir.
- Realtime'ın `postgres_changes` için RLS'i gerçekten uyguladığı bu proje sürümünde
  doğrulanmadı (bkz. docs/validation/phase2.md) — istemci tarafı `customer_id` filtresi
  ek bir savunma katmanı olarak eklendi, ama tek başına dayanak değildir.
- Başarılı upload sonrası başarısız DB insert orphan dosya bırakabilir; transactional
  cleanup ve sunucu idempotency sonraki fazda ele alınmalı.
- E-posta onayı (Supabase proje ayarına bağlı) açıksa kayıt sonrası oturum hemen
  başlamaz; uygulama bu durumu algılar ve kullanıcıyı bilgilendirir ama e-posta
  gönderimini/onay akışını kendisi yönetmez.
- Mevcut bağımlılık ağacında npm audit bulguları ve Expo/react-native peer uyarıları var
  (bkz. `package.json` — react-native 0.81.6'nın peer react aralığı kök `react@19.1.0`'ı
  aşıyor); zorlayıcı/geniş dependency upgrade bu fazda yapılmadı.

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

## Faz 2 kontrol listesi

- [x] Supabase Auth (e-posta/şifre): sign up, sign in, sign out, oturum geri yükleme.
- [x] `profiles` + rol modeli (customer/professional/admin), yeni kullanıcı trigger'ı.
- [x] Rol istemciden asla güvenilmez; admin ataması yalnız manuel SQL bootstrap ile.
- [x] `service_requests.customer_id`, RLS, kolon-bazlı update guard trigger'ı.
- [x] Legacy (sahipsiz) kayıtlar korunur, müşteriye açılmaz, yalnız admin görür.
- [x] Taleplerim/Takip artık yalnızca giriş yapan müşterinin kendi kayıtlarını gösterir.
- [x] `/request/new`, `/service`, `/tracking`, `/profile` giriş gerektirir; `/admin` admin
      rolü gerektirir (UI guard) — hepsi RLS ile de sınırlanır.
- [x] Private storage + owner-scoped path + signed URL tasarımı ve migration'ı hazır.
- [x] Additive/idempotent Faz 2 migration'ları; remote'a **uygulanmadı**.
- [x] Lint, TypeScript, genişletilmiş servis kontratı testleri + yeni auth/RBAC testleri.
- [x] Web bundle export (tüm yeni rotalar dahil) temiz.
- [ ] Migration'lar gerçek Supabase projesine uygulandı ve doğrulandı.
- [ ] Gerçek Android cihaz/emülatörde uçtan uca kimlik doğrulama + RLS manuel QA'sı.
- [ ] Realtime `postgres_changes`'in RLS'i fiilen uyguladığı bu projede doğrulandı.

Ayrıntılı test/doğrulama sonuçları: [docs/validation/phase1.md](docs/validation/phase1.md),
[docs/validation/phase2.md](docs/validation/phase2.md).
Başlangıç yol haritası tarihsel referans olarak [docs/roadmap.md](docs/roadmap.md)
içinde korunur; güncel uygulama durumu bu README'dir.

## Sonraki fazlar

Faz 3–4: gerçek talep yaşam döngüsü, idempotency, profesyonel onboarding/atama.
Faz 5–6: operasyon/konum olayları ve güven/değerlendirme modeli.
Faz 7–10: bildirim, randevu/ödeme, release kalite kapıları ve AI destekli sınıflandırma.
Bu yetenekler mevcutmuş gibi sunulmaz.
