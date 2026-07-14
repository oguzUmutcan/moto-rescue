# MotoRescue Session Handoff

Son güncelleme: 15 Temmuz 2026  
Workspace: `C:\Users\umuto\desktop\lecture\zmy works\actual projects\motorescue`

## Kullanıcı çalışma kuralları

- Her değişiklik kökteki `DEGISIKLIK_GUNLUGU.md` dosyasına şu formatta kaydedilmeli:
  - Sorun neydi?
  - Neden bu sorun çıktı?
  - Çözüm yöntemi neler?
  - Nasıl Çözüldü?
- Push işlemleri `master` yerine ayrı bir feature branch üzerinde yapılmalı.
- Secret, Firebase service-account JSON veya API key repoya eklenmemeli.
- Kullanıcı fiziksel telefonu passenger, Android emülatörünü rider/biker olarak uçtan uca test ediyor.

## Git durumu

- Monorepo remote: `https://github.com/oguzUmutcan/moto-rescue.git`
- Aktif branch: `feat/backend-api-consolidation`
- Son push edilmiş commit: `32d7b59 feat: add backend-driven rider badge system`
- Bu dosya oluşturulmadan hemen önce çalışma ağacı temizdi.
- Son önemli commitler:
  - `32d7b59` backend kontrollü badge sistemi
  - `a2ec84c` post-ride rider review/rating
  - `e5985c1` yakın place sonuçları ve klavye yerleşimi
  - `147c6af` Google Maps turn-by-turn deep link
  - `56cd326` kabul sonrası iki taraflı rescue akışı
  - `0dba07b` aday biker'ın açık rescue detay yetkisi
  - `cd5b460` incoming rescue ekranının otomatik açılması

## Repo yapısı

```text
motorescue/
├── moto-rescue-frontend/   Expo 54 / React Native / Expo Router / Firebase Auth
├── moto-rescue-backend/    Java 21+ / Spring Boot 4.1 / Firebase Admin / Firestore
├── DEGISIKLIK_GUNLUGU.md   Ayrıntılı kronolojik değişiklik kaydı
└── session_handoff.md      Bu dosya
```

## Çalıştırma

### Backend

Backend varsayılan portu `8083`:

```powershell
cd moto-rescue-backend
gcloud auth application-default login
gcloud auth application-default set-quota-project motorescue-d4abc
.\mvnw.cmd spring-boot:run
```

Firebase proje ID varsayılan olarak `motorescue-d4abc`. Yapılandırılabilir environment değişkenleri:

```text
SERVER_PORT=8083
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=motorescue-d4abc
GOOGLE_CLOUD_PROJECT=motorescue-d4abc
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

Backend Application Default Credentials kullanıyor. Service-account dosyası kullanılacaksa workspace dışında saklanmalı ve yalnızca `GOOGLE_APPLICATION_CREDENTIALS` ile gösterilmeli.

### Frontend

```powershell
cd moto-rescue-frontend
npx expo start --clear --lan
```

- Web/iOS simulator fallback: `http://localhost:8083`
- Android emulator fallback: `http://10.0.2.2:8083`
- Expo Go fiziksel cihaz: Metro `hostUri` üzerinden bilgisayarın LAN adresi otomatik türetiliyor.
- Override: `EXPO_PUBLIC_API_URL`
- Fiziksel telefon ve bilgisayar aynı Wi-Fi ağında olmalı.
- Windows Firewall Java için özel ağ erişimine izin vermeli.

Firebase frontend değerleri `moto-rescue-frontend/.env` içinde bulunmalı; `.env.example` yalnızca anahtar adlarını içerir.

## Mimari kararlar

- Firebase Authentication istemcide oturum açmak için kullanılıyor.
- Profil, rol, rescue, review ve badge iş kuralları Spring Boot backend'de.
- Frontend her API isteğinde güncel Firebase ID token'ını `Authorization: Bearer` olarak gönderiyor.
- Kullanıcı kimliği request body'den değil doğrulanmış token UID'sinden alınıyor.
- Frontend doğrudan Firestore veya Firebase Storage kullanmıyor.
- Firebase Storage ücret/billing nedeniyle kullanılmıyor; identity document upload şimdilik kapalı.
- Rescue state server-authoritative:

```text
searching -> accepted -> in_progress -> completed
     |           |
     +-----------+-> cancelled (passenger, sürüş başlamadan önce)
```

- Kritik accept/cancel/start/complete ve review/rating işlemleri Firestore transaction kullanıyor.

## Backend API özeti

Bütün endpoint'ler Firebase Bearer token ister.

### Auth

```text
GET /api/auth/session
GET /api/auth/phone-session
```

### Users

```text
POST   /api/users/me
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/role
DELETE /api/users/me
```

### Rescues

```text
POST /api/rescues
GET  /api/rescues/{requestId}
GET  /api/rescues/open
GET  /api/rescues/history
GET  /api/rescues/active
POST /api/rescues/{requestId}/accept
POST /api/rescues/{requestId}/cancel
POST /api/rescues/{requestId}/start
POST /api/rescues/{requestId}/complete
```

Rescue belgeleri pickup/destination label ve koordinatlarını, urgency, helmet ihtiyacı, katılımcıları ve lifecycle timestamp'lerini içeriyor.

### Reviews

```text
POST /api/reviews/rescue/{rescueId}
GET  /api/reviews/mine
```

- Yalnızca tamamlanmış rescue'nun passenger'ı atanmış rider'ı değerlendirebilir.
- Rating 1–5, yorum opsiyonel ve en fazla 500 karakter.
- Rescue başına tek review; review document ID = rescue ID.
- Rider `ratingTotal`, `ratingCount`, `rating` transaction içinde güncellenir.

### Badges

```text
GET /api/badges/me
```

Backend'de gerçek veriden hesaplanan badge'ler:

- First Rescue: 1 rescue
- Rising Rescuer: 5 rescue
- City Hero: 25 rescue
- Rescue Legend: 100 rescue
- Exam Hero: 5 exam rescue
- Helmet Hero: helmet gereken 10 rescue
- Night Rescuer: 20:00–06:00 arası 10 rescue (`Europe/Istanbul`)
- Top Rated Rider: en az 5 review ve 4.8+ rating

Her tamamlanmış rescue 50 XP. Level eşikleri: Bronze 0, Silver 500, Gold 1500, Platinum 3000.

## Tamamlanan frontend akışları

- Register/login, profil oluşturma, passenger/biker rol seçimi backend profiline bağlı.
- Passenger pickup için mevcut konum veya manuel adres seçebilir.
- Pickup/destination haritadan marker ile seçilebilir.
- Destination önerileri yerel geocoder sonuçlarını birleştirir, mevcut pickup'a Haversine mesafesiyle sıralar ve kaydırılabilir listede gösterir.
- Urgency gerçek açılır seçim listesi.
- Passenger rescue oluşturur ve backend status polling yapar.
- Biker açık isteği otomatik görür; incoming ekranı gerçek rescue verisini gösterir.
- Biker kabul eder, pickup'a gider, sürüşü başlatır, destination'a gider ve tamamlar.
- `Open in Google Maps` aktif aşamaya göre pickup veya destination için turn-by-turn navigasyon açar.
- Passenger kabul/start/complete durumlarını polling ile görür.
- Uygulama yeniden açılırsa `/api/rescues/active` doğru ekrana devam ettirir.
- Completion sonrası passenger rider'a yıldız ve yorum verebilir.
- Biker completion sonrası yeni badge kazanmışsa unlock bildirimi görür.
- History ekranları terminal rescue kayıtlarını ve gerçek süreyi gösterir.

## Bilinen sınırlamalar / sonraki işler

- Yer araması gerçek Places Autocomplete değil. Cihaz geocoder'ı bazı POI'leri (`İlhami Ertem Lisesi` gibi) tam isim yazılmadan bulamayabilir.
- Google Places denendi ancak billing kurulumu yapılmadı ve entegrasyon koda eklenmedi. Public Nominatim autocomplete kullanım politikası nedeniyle kullanılmamalı.
- Haritadan seçim bu POI arama sınırlamasının mevcut ücretsiz alternatifi.
- Canlı biker GPS konumu passenger'a yayınlanmıyor; haritalar hedef marker ve cihazın kendi konumunu gösteriyor.
- Uygulama içi gerçek rota çizgisi yok; turn-by-turn Google Maps deep link ile açılıyor.
- Telefon arama düğmeleri henüz gerçek telefon numarasına bağlı değil.
- Safety code prototipi kaldırıldı; doğrulanmış boarding code sistemi henüz uygulanmadı.
- Identity document upload için ücretsiz/güvenli object storage sağlayıcısı seçilmedi.
- Review ekranındaki `Not now` review'u atlar; history üzerinden daha sonra değerlendirme CTA'sı henüz yok.
- Badge hesabı son 500 biker rescue belgesini tarıyor; yüksek hacimde aggregate counter/event tabanlı yapıya geçirilmeli.
- Firestore sorguları büyüdükçe composite index ve pagination gerekecek.
- Mevcut backend testleri temel context/auth/controller testleri; ReviewService, BadgeService ve RescueService transaction kuralları için emulator tabanlı entegrasyon testleri eklenmeli.
- Push edilen feature branch henüz PR/master merge yapılmadı.

## Test komutları

```powershell
# Backend
cd moto-rescue-backend
.\mvnw.cmd clean test

# Frontend
cd ..\moto-rescue-frontend
npx tsc --noEmit
npm run lint

# Repo kökü
cd ..
git diff --check
git status --short
```

Son doğrulanan durum:

- Backend: 5 test, 0 failure/error
- TypeScript: başarılı
- ESLint: 0 hata, 0 uyarı
- Branch remote'a push edilmiş durumda

## Yeni model için önerilen başlangıç sırası

1. Bu dosyayı ve `DEGISIKLIK_GUNLUGU.md` son bölümlerini oku.
2. `git status`, aktif branch ve son commit'i doğrula.
3. Backend ve frontend testlerini çalıştır.
4. Kullanıcının fiziksel passenger + emülatör biker senaryosundaki en son hatayı yeniden üret.
5. Değişiklik yaparken server-authoritative state ve mevcut API client yapısını koru.
6. Her değişikliği günlüğe ekle, aynı feature branch'te commit/push yap.
