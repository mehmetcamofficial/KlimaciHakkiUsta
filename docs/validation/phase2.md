# Faz 2 doğrulama sonuçları — Auth + RBAC + RLS + Data Ownership + Secure Storage

Bu dosya, `feature/phase2-auth-rbac-security` dalında yapılan doğrulamayı belgeler.
`docs/validation/phase1.md`'deki format izlenir: her madde **IMPLEMENTED** /
**TESTED LOCALLY** / **TESTED ON ANDROID** / **VERIFIED AGAINST REMOTE SUPABASE**
olarak işaretlenir — kod var olması "doğrulandı" anlamına gelmez.

## 1. Mimari

- **Auth:** Supabase Auth, e-posta + şifre. `lib/auth.tsx` (`AuthProvider`/`useAuth`)
  tek merkezi oturum katmanı; hiçbir ekran doğrudan `supabase.auth.*` çağırmaz.
  `lib/supabase.ts` oturumu `@react-native-async-storage/async-storage` ile kalıcı
  yapar ve `AppState`'e bağlı auto-refresh kullanır (resmi Supabase+RN deseni).
- **Roller:** `profiles.role` — `customer` | `professional` | `admin`, constrained
  `text` (enum değil — bkz. README'deki karar gerekçesi).
- **RBAC:** `lib/rbac.ts`'teki saf `decideAccess()` fonksiyonu, `components/auth-guard.tsx`
  (`RequireAuth`, `RequireRole`) tarafından kullanılır. Bu yalnızca UI'dir.
- **Gerçek yetkilendirme sınırı:** RLS politikaları + `service_requests` üzerinde bir
  `before update` trigger'ı (kolon-bazlı kısıtlama için — düz RLS tek başına kolon
  filtreleyemez).
- **Legacy:** `customer_id` nullable; NULL satırlar hiçbir müşteriye görünmez, yalnız
  admin'e.
- **Storage:** Yeni yüklemeler `{uid}/{requestNo}/photo.<ext>`; okuma `createSignedUrl`
  ile anlık üretilir, kalıcı olarak saklanmaz.

## 2. Statik kontroller — TESTED LOCALLY

| Kontrol | Komut | Sonuç |
|---|---|---|
| Lint | `npm run lint` | ✅ Temiz |
| TypeScript | `npx tsc --noEmit` | ✅ Temiz |
| Servis kontratı testleri | `node --test tests/marketplace.cjs` | ✅ 6/6 |
| Auth/RBAC testleri | `node --test tests/auth.cjs` | ✅ 6/6 |
| Birlikte | `node --test tests/marketplace.cjs tests/auth.cjs` | ✅ 12/12 |
| Web bundle | `npx expo export -p web` | ✅ 17 rota, hatasız |
| Secret scan | bkz. §6 | ✅ Temiz |

`tests/auth.cjs` neyi kapsıyor: `isUserRole` (yalnız 3 geçerli rol, `{role:"admin"}`
gibi şekilli objeler dahil her şeyi reddeder), `decideAccess` (loading > signed-out >
forbidden > ok önceliği, rol uyuşmazlığı asla sessizce izin vermez), `mapAuthError`
(bilinen hatalar Türkçeye çevrilir, bilinmeyenler ham içerik sızdırmadan genel mesaja
düşer).

`tests/marketplace.cjs`'e eklenenler/güncellenenler: `createServiceRequest` artık
`customer_id`'yi payload'a koyduğunu ve fotoğraf yolunun `{uid}/...` ile başladığını
doğrular; eksik-kolon retry testi artık yalnızca eksik kolonu düşürdüğünü (sahiplik ve
`problem_type`'ın kaldığını) doğrular; yeni bir test, `customer_id` kolonu eksikken
`ConfigurationError` fırlatıldığını ve **hiçbir retry'ın sahipliği düşürmediğini**
doğrular. (Not: test harness'in `ts.transpileModule` çağrısına açık bir ES2019 `target`
eklendi — hedefsiz haliyle varsayılan ES3 çıktısı, `class X extends Error`'ı
`instanceof`/`.constructor` kırılacak şekilde downlevel ediyordu; gerçek Hermes/Babel
uygulama paketini etkilemez, yalnızca bu test harness'ine özgüydü.)

## 3. Görsel/manuel doğrulama — TESTED LOCALLY (web, Playwright)

Faz 1'deki gibi: bu sandbox'tan gerçek Supabase'e giden HTTPS istekleri bir TLS
müdahale katmanı tarafından engelleniyor (`ERR_CERT_AUTHORITY_INVALID`) — bu ortamın
kısıtı, uygulamanın değil. Kategori/hizmet uçları `PGRST205` döndürecek şekilde
mock'lanarak Ana Sayfa'nın gerçek 10 kategoriyle render edildiği doğrulandı; ancak
**gerçek Supabase Auth uç noktalarına karşı sign-up/sign-in bu ortamda test
edilemedi** (bkz. §5).

Doğrulanan (360×780 viewport, headless Chromium, `npx expo start --web`):

- Ana Sayfa (`/`): girişsiz erişilebilir, kategori grid'i render ediyor (regresyon yok).
- Taleplerim, Takip, Profil, `/admin`, `/request/new`: girişsiz açıldığında hepsi
  "Devam etmek için giriş yapmalısınız." + "Giriş yap" durumunu gösteriyor — beyaz ekran
  yok, konsol hatası yok.
- `/sign-in`, `/sign-up`: tasarım sistemine (theme/marketplace bileşenleri) uygun,
  alanlar klavye-güvenli, şifre gizli, gönder düğmesi geçersiz girişte devre dışı
  (email + <6 karakter şifre ile test edildi → düğme gri/disabled kaldı).
  Onaylandı ekran görüntüleriyle: `01-home-public`, `02..06-*-gated`, `07-sign-in`,
  `08-sign-up`, `09-sign-in-invalid` (bu oturumda alındı, depoya eklenmedi).

**Doğrulanamayan (gerçek Supabase Auth gerektirir):** gerçek sign-up/sign-in başarı
akışı, e-posta onay davranışı, `/admin`'de rol-uyuşmazlığı ("Bu sayfaya erişim
yetkiniz yok" durumu — bunun görünmesi için gerçek girişli-ama-admin-olmayan bir oturum
gerekir), Customer A/B izolasyonu, gerçek RLS reddi.

## 4. Android emülatör — NOT TESTED THIS SESSION

Faz 1 doğrulamasında olduğu gibi, bu proje için doğrulanmış bir native/Expo-Go
başlatma betiği yok; web + headless Chromium ile phone-width doğrulama tercih edildi.
Native'e özgü davranışlar (safe-area, klavye kaçınma, StatusBar) bağımsız
doğrulanmadı.

## 5. VERIFIED AGAINST REMOTE SUPABASE — NONE

Bu oturumda **hiçbir migration remote'a uygulanmadı** ve **hiçbir gerçek Supabase Auth
isteği bu sandbox'tan başarıyla tamamlanmadı** (ağ engeli, §3). Bu nedenle aşağıdakilerin
hiçbiri bu oturumda gerçek Supabase'e karşı doğrulanmadı — hepsi §6'daki manuel QA
adımlarıyla sizin tarafınızdan doğrulanmalı:

- `profiles` trigger'ının gerçekten her yeni kullanıcı için satır oluşturduğu.
- `is_admin()` fonksiyonunun ve RLS politikalarının gerçek Postgres üzerinde
  sözdizimsel/mantıksal olarak doğru çalıştığı (SQL bu oturumda bir Postgres'e karşı
  çalıştırılmadı — yalnızca elle incelendi).
- `service_requests` update trigger'ının (`to_jsonb(old) - ... <> to_jsonb(new) - ...`)
  gerçek şemaya karşı hatasız çalıştığı.
- Realtime `postgres_changes`'in bu proje sürümünde RLS'i fiilen uyguladığı.
- Storage politikalarının (`storage.foldername`, private bucket) gerçek davranışı.

## 6. Manuel QA planı (siz çalıştırın)

Önce migration'ları sırayla uygulayın: `170000` → `170100` → `170200` → (isteğe bağlı,
ayrı zamanlanabilir) `170300`. Ardından:

**A. Girişsiz kullanıcı**
1. Uygulamayı açın, Ana Sayfa ve kategori gezintisinin çalıştığını doğrulayın.
2. Taleplerim/Takip/Profil/`/admin`/"talep oluştur" — hepsinin giriş isteyen bir
   duruma düştüğünü doğrulayın.

**B. Müşteri A**
3. Kayıt olun (gerekirse e-postayı onaylayın), giriş yapın.
4. Supabase Dashboard → Table Editor → `profiles`'ta bu kullanıcı için
   `role = 'customer'` olan bir satır oluştuğunu doğrulayın.
5. Bir talep oluşturun (fotoğraf + GPS dahil). Taleplerim'de göründüğünü, Takip'te
   talep numarasıyla bulunabildiğini doğrulayın.
6. Storage → `service-photos`'ta dosyanın `{uid}/{requestNo}/photo.*` yolunda
   olduğunu doğrulayın.
7. Çıkış yapın.

**C. Müşteri B**
8. Ayrı bir hesapla kayıt olup giriş yapın.
9. Taleplerim'in **boş** olduğunu (Müşteri A'nın talebi görünmemeli) doğrulayın.
10. Müşteri A'nın talep numarasını Takip'e elle girip **bulunamadı** göründüğünü
    doğrulayın (RLS gerçekten reddediyor mu — bu adım asıl güvenlik testidir).

**D. Admin**
11. README'deki "Admin bootstrap" SQL'iyle Müşteri A'yı (veya ayrı bir hesabı)
    admin yapın.
12. O hesapla giriş yapıp `/admin`'e gidin — artık erişebildiğini, tüm talepleri
    (Müşteri A + B, legacy dahil) görebildiğini doğrulayın.
13. Admin olmayan bir hesapla `/admin`'e gidip "Bu sayfaya erişim yetkiniz yok."
    göründüğünü doğrulayın.

**E. Yeniden başlatma**
14. Uygulamayı tamamen kapatıp yeniden açın — oturumun geri yüklendiğini (tekrar
    giriş istenmediğini) doğrulayın.

**F. Supabase erişilemez**
15. `.env`'i geçici olarak geçersiz bir URL'e çevirip uygulamayı başlatın — anlamlı
    bir hata durumu gösterdiğini, çökmediğini doğrulayın; sonra `.env`'i geri alın.

## 7. Bilinen sınırlamalar

README'deki "Sınırlar ve güvenlik" bölümüyle aynı; özetle: migration'lar remote'a
uygulanana kadar RLS/sahiplik etkin değildir, PROFESSIONAL yalnızca bir yetki temeli
(gerçek profesyonel akışı yok), realtime'ın RLS farkındalığı bu projede doğrulanmadı,
e-posta onay akışı uygulama tarafından yönetilmez.
