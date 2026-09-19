# Faz 1 doğrulama sonuçları

Bu dosya `README.md`'de referans verilen ayrıntılı test sonuçlarını içerir.
`feature/phase1-ustayanimda-marketplace` dalında, bu doğrulamanın yapıldığı anki
işlenmemiş (uncommitted) çalışma ağacına karşı çalıştırılmıştır.

## 1. Statik kontroller

| Kontrol | Komut | Sonuç |
|---|---|---|
| Lint | `npm run lint` (expo lint) | ✅ Temiz, 0 hata/uyarı |
| TypeScript | `npx tsc --noEmit` | ✅ Temiz, 0 hata |
| Servis kontrat testleri | `node --test tests/marketplace.cjs` | ✅ 5/5 test geçti |
| Secret scan | `git diff` + yeni dosyalarda `service_role`/`SUPABASE_SERVICE`/JWT/PEM deseni araması | ✅ Eşleşme yok; `.env` `git check-ignore` ile doğrulandı, hiçbir zaman staged değildi |

Test dökümü:

```
✔ 10 categories, 45 services, unique slugs and valid ownership
✔ missing migration uses a coherent local snapshot
✔ empty remote catalog stays empty; permission failures remain errors
✔ Klima request preserves GPS, photo and selected service
✔ legacy retry only for missing marketplace columns and preserves category in note
ℹ tests 5, pass 5, fail 0
```

## 2. Bundle / Expo doğrulaması

`npx expo export -p web` başarıyla tamamlandı; tüm rotalar (ana sayfa, kategori,
talep formu, taleplerim, takip, profil, admin, `_sitemap`) hatasız üretildi.
Bu, Metro/Babel/TypeScript zincirinin ve `experiments.typedRoutes` altında yeni
dinamik rotaların (`/services/[categorySlug]`, `/request/new`) doğru
çözümlendiğini kanıtlar.

Native Android/iOS build (`expo run:android` / EAS) bu ortamda çalıştırılmadı;
bu, Gradle/Xcode derleme zincirini kapsamaz.

## 3. Görsel/manuel doğrulama (§35–36)

**Ortam kısıtı:** Bu sandbox ortamından gerçek Supabase'e giden HTTPS istekleri
bir TLS araya girme/müdahale katmanı tarafından engelleniyor
(`net::ERR_CERT_AUTHORITY_INVALID`; `curl -k` ile gövde incelendiğinde Supabase
değil, alakasız bir HTML sayfası dönüyor). Bu, uygulamanın değil, ortamın bir
kısıtıdır. Doğru davranış yine de gözlemlendi: gerçek ağ hatası ile karşılaşan
ana sayfa ~15 saniye içinde "Hizmetler şu anda yüklenemiyor." hata durumuna ve
çalışan bir "Tekrar dene" düğmesine düşüyor (bkz. `01b-home-after-15s` ekran
görüntüsü, bu oturumda alındı, depoya eklenmedi).

Bu kısıt nedeniyle asıl ürün/QA amaçlı görsel inceleme, Playwright ile başlatılan
headless Chromium üzerinden `npx expo start --web` çıktısına karşı, 360×780
(küçük/orta Android telefon eni) viewport'ta yapıldı; Supabase kategori/hizmet
uçları `PGRST205` ("tablo yok") döndürecek şekilde mock'landı ki yerel katalog
fallback yolu (asıl amaçlanan ilk kullanıcı deneyimi — bkz. §5) gerçek 10
kategori/45 hizmet verisiyle incelenebilsin.

İncelenen ekranlar: Ana Sayfa (yükleniyor/yerel katalog/arama/arama-boş
sonuç), Su Tesisatı / Kombi-Doğalgaz / Mobilya-Montaj / Boya-Tadilat kategori
ekranları, Klima ve Su Kaçağı talep formları, Taleplerim (yükleniyor ve boş
durum), Takip (boş/arama durumu), Profil, Admin (boş durum).

**Bulgu ve düzeltme:** Arama sonucu boş olduğunda (`"Aramanızla eşleşen hizmet
bulunamadı."`) `State` bileşenine koşulsuz `retry` geçiliyordu; bu, bir hata
yokken yanıltıcı bir "Tekrar dene" düğmesi gösteriyordu. `app/(tabs)/index.tsx`
içinde `retry={query ? undefined : retry}` olarak düzeltildi ve düzeltme sonrası
tekrar ekran görüntüsüyle doğrulandı. Düzeltmeden sonra lint ve typecheck tekrar
çalıştırıldı, ikisi de temiz kaldı.

**Diğer gözlemler (hata değil):**
- Uzun Türkçe kategori adları ("Kombi / Doğalgaz", "Boya / Tadilat",
  "Mobilya / Montaj") 360 px genişlikte kart içinde doğru şekilde iki satıra
  sarıyor, taşma yok.
- Klima kategori/hizmet tipi seçildiğinde talep formunda yalnızca Klima'ya özel
  "Marka" / "Klima tipi" alanları görünüyor; diğer kategorilerde görünmüyor
  (kod incelemesi + ekran görüntüsüyle doğrulandı).
- Arama, kategori adı ve o kategorinin hizmet tipi adlarında alt dize eşleşmesi
  yapıyor (ör. "su" araması "Sulama Sistemi" nedeniyle Bahçe/Peyzaj'ı da
  getiriyor). Bu kasıtlı, basit bir alt dize taraması; tam kelime eşleşmesi bu
  fazın kapsamı dışında bırakıldı.
- Taleplerim/Takip/Admin ekranları, bu sandbox'ta gerçek `service_requests`
  ağ isteği başarısız olduğunda kendi yükleniyor/hata durumlarını doğru
  gösteriyor (kod incelemesiyle doğrulandı; bkz. `services/requests.ts`
  `listRequests`/`getRequest` + ilgili ekranlardaki `try/catch`).

## 4. Android emülatör

Bu makinede bir Android SDK ve `Pixel_8` AVD'si mevcut, ancak bu repo için
doğrulanmış bir native/Expo-Go başlatma yolu (proje-özel bir "run" betiği)
bulunmuyor; native path'i bu oturumda sıfırdan kurmak (emülatör boot + Expo Go
kurulumu + Metro bağlantısı) orantısız sürede olacağından, bunun yerine §3'teki
web tabanlı, telefon genişliğinde headless doğrulama tercih edildi. Bu, gerçek
Android'e özgü davranışları (safe-area insets, klavye kaçınma, StatusBar
yüksekliği, native "geri" hareketi) bağımsız olarak doğrulamaz — bunlar
doğrulanmamış olarak işaretlenmiştir. Kalıcı bir native QA yolu isteniyorsa
`/run-skill-generator` ile bu proje için bir "run" betiği oluşturulabilir.

## 5. Özet

Statik kontroller (lint, typecheck, birim testleri, secret scan) ve web/headless
görsel geçiş temiz. Bulunan tek gerçek hata (yanıltıcı "Tekrar dene" düğmesi)
düzeltildi ve doğrulandı. Gerçek Supabase'e karşı uçtan uca doğrulama ve native
Android doğrulaması bu ortamda yapılamadı; bunlar README'nin "Faz 1 kontrol
listesi" bölümünde açıkça `[ ]` olarak işaretlenmiştir.
