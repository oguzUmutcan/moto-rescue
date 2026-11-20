# MotoRescue Backend - Kapsamlı Kod & Mimari Rehberi

Bu belge, **MotoRescue** projesinin Java 21 / Spring Boot arka yüzünde (`moto-rescue-backend`) bulunan **tüm Java sınıflarını ve içerdikleri metotların teknik kod mantığını** ayrıntılı olarak açıklamaktadır. Mülakatta kod tabanını açıklarken veya kod üzerinde canlı değişiklik yaparken referans olarak hazırlanmıştır.

---

## 📑 İçindekiler

1. [Genel Mimari & Akış Şeması](#1-genel-mimari--akış-şeması)
2. [Konfigürasyon Dosyaları (`config`)](#2-konfigürasyon-dosyaları-config)
   - [AuthApplication.java](#authapplicationjava)
   - [FirebaseConfig.java](#firebaseconfigjava)
   - [AsyncConfig.java](#asyncconfigjava)
   - [WebConfig.java](#webconfigjava)
3. [Controller Katmanı (`controller`)](#3-controller-katmanı-controller)
   - [RescueController.java](#rescuecontrollerjava)
   - [UserController.java](#usercontrollerjava)
   - [AuthController.java](#authcontrollerjava)
   - [ReviewController.java](#reviewcontrollerjava)
   - [BadgeController.java](#badgecontrollerjava)
   - [NotificationController.java](#notificationcontrollerjava)
   - [DirectionsController.java](#directionscontrollerjava)
   - [PlacesController.java](#placescontrollerjava)
   - [PublicBikerController.java](#publicbikercontrollerjava)
   - [ApiExceptionHandler.java](#apiexceptionhandlerjava)
4. [Service Katmanı (`service`)](#4-service-katmanı-service)
   - [RescueService.java](#rescueservicejava-kalp-ve-en-kritik-servis)
   - [UserService.java](#userservicejava)
   - [AuthService.java](#authservicejava)
   - [ReviewService.java](#reviewservicejava)
   - [BadgeService.java](#badgeservicejava)
   - [NotificationService.java](#notificationservicejava)
   - [NotificationInboxService.java](#notificationinboxservicejava)
   - [DirectionsService.java](#directionsservicejava)
   - [PlacesService.java](#placesservicejava)
   - [PublicBikerService.java](#publicbikerservicejava)
5. [DTO Katmanı (`dto`)](#5-dto-katmanı-dto)
6. [Mülakatta Jürinin Sorabileceği Can Alıcı 5 Soru ve Yanıtları](#6-mülakatta-jürinin-sorabileceği-can-alıcı-5-soru-ve-yanıtları)

---

## 1. Genel Mimari & Akış Şeması

```
[ Mobil İstemci (Expo / React Native) ]
                   │
                   ▼  (Bearer <Firebase_ID_Token>)
      [ Controller Katmanı ]  (Gelen isteği karşılar, token'ı doğrular)
                   │
                   ▼
       [ Service Katmanı ]    (İş mantığı, doğrulama, transaction kilitleri)
                   │
     ┌─────────────┼─────────────┬──────────────────┐
     ▼             ▼             ▼                  ▼
[ Firestore ]  [ Firebase Auth ] [ Google Routes/Places ] [ Expo Push API ]
```

* **Server-Authoritative:** İstemci (frontend) doğrudan veritabanındaki durumları değiştiremez. Her şey backend üzerinden yürütülür.
* **Token Tabanlı Kimlik Denetimi:** Kullanıcı ID'si (UID) istemciden parametre olarak alınmaz; `Authorization: Bearer <token>` başlığındaki Firebase ID token backend tarafından doğrulanarak güvenli bir şekilde token'ın içinden çıkarılır (`token.getUid()`).

---

## 2. Konfigürasyon Dosyaları (`config`)

### AuthApplication.java
* **Konum:** `com.motorescue.auth.AuthApplication`
* **Görevi:** Spring Boot uygulamasının başlangıç (entry-point) sınıfıdır.
* **Anotasyonlar:**
  * `@SpringBootApplication`: Otomatik yapılandırma, component scanning ve Spring Boot konfigürasyonunu aktif eder.
  * `@EnableScheduling`: `NotificationService` içindeki arka plan periyodik görevlerinin (örneğin Expo bildirim alındı makbuzlarının kontrolü) çalışmasını sağlar.
* **Metotlar:**
  * `main(String[] args)`: `SpringApplication.run(AuthApplication.class, args)` çağrısı ile Spring konteynerini ve gömülü Tomcat sunucusunu başlatır.

---

### FirebaseConfig.java
* **Konum:** `com.motorescue.auth.config.FirebaseConfig`
* **Görevi:** Google Firebase Admin SDK ve Firestore bağlantısını ayağa kaldırır ve Spring IoC konteynerine `@Bean` olarak sunar.
* **Anotasyonlar:**
  * `@Configuration`: Spring konfigürasyon sınıfı olduğunu belirtir.
  * `@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)`: Firebase istenirse test ortamlarında kapatılabilsin diye eklenmiş esneklik bayrağıdır.
* **Metotlar:**
  * `firebaseApp(@Value("${firebase.project-id}") String projectId)`:
    * `FirebaseApp.getApps()` kontrolü yaparak daha önce başlatılmışsa mevcut instance'ı döner.
    * Başlatılmamışsa `GoogleCredentials.getApplicationDefault()` kullanarak ortamdaki (GCloud / Environment) servis hesabı yetkilerini okur ve `FirebaseApp.initializeApp(options)` ile başlatır.
  * `firestore(FirebaseApp firebaseApp)`:
    * `FirestoreClient.getFirestore(firebaseApp)` çağrısıyla Firestore NoSQL veritabanı istemcisini oluşturur ve servislerin enjekte edebileceği bir Spring Bean haline getirir.

---

### AsyncConfig.java
* **Konum:** `com.motorescue.auth.config.AsyncConfig`
* **Görevi:** Asenkron (`@Async`) işlemleri yönetecek özel bir Thread Havuzu (ThreadPool) tanımlar.
* **Anotasyonlar:**
  * `@EnableAsync`: Spring'in `@Async` anotasyonlu metotları ayrı thread'lerde çalıştırmasını sağlar.
* **Metotlar:**
  * `notificationExecutor()`:
    * Bildirim gönderimi gibi yavaş ağ işlemlerinin ana HTTP isteklerini bloklamaması için bir `ThreadPoolTaskExecutor` oluşturur.
    * Çekirdek iş parçacığı sayısı: 2 (`CorePoolSize`), maksimum iş parçacığı sayısı: 4 (`MaxPoolSize`), kuyruk kapasitesi: 100 (`QueueCapacity`).
    * Kuyruk dolarsa isteği ana thread'de güvenle işlemek için `CallerRunsPolicy` benimser.

---

### WebConfig.java
* **Konum:** `com.motorescue.auth.config.WebConfig`
* **Görevi:** Cross-Origin Resource Sharing (CORS) politikasını belirler.
* **Metotlar:**
  * `addCorsMappings(CorsRegistry registry)`:
    * `/api/**` altındaki tüm uç noktalara sadece `app.cors.allowed-origins` konfigürasyonunda tanımlı origin'lerden (örneğin localhost:8081, localhost:19006) erişim izni verir.
    * Desteklenen HTTP metotları: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
    * `Authorization` ve `Content-Type` başlıklarına izin verir.

---

## 3. Controller Katmanı (`controller`)

Controller sınıfları istemciden gelen HTTP isteklerini karşılar, yetkilendirme başlığını (`Authorization`) alır ve işi ilgili servise devreder.

### RescueController.java
* **Konum:** `com.motorescue.auth.controller.RescueController`
* **Temel Yol:** `/api/rescues`
* **Metotlar:**
  * `POST /api/rescues` -> `create(...)`: Yeni kurtarma çağrısı oluşturur.
  * `GET /api/rescues/{requestId}` -> `get(...)`: Belirli bir çağrının detayını getirir.
  * `GET /api/rescues/open` -> `open(...)`: Motorcuların yakınlarındaki açık çağrıları listeler.
  * `GET /api/rescues/history` -> `history(...)`: Kullanıcının geçmiş kurtarma kayıtlarını listeler.
  * `GET /api/rescues/active` -> `active(...)`: Kullanıcının o anki aktif kurtarmasını getirir.
  * `POST /api/rescues/{requestId}/accept` -> `accept(...)`: Motorcunun çağrıyı kabul etmesini sağlar.
  * `POST /api/rescues/{requestId}/cancel` -> `cancel(...)`: Yolcu veya motorcunun çağrıyı iptal etmesini sağlar.
  * `POST /api/rescues/{requestId}/start` -> `start(...)`: Motorcunun 4-6 haneli biniş kodunu girerek sürüşü başlatmasını sağlar.
  * `POST /api/rescues/{requestId}/complete` -> `complete(...)`: Motorcunun hedef noktaya varıp sürüşü tamamlamasını sağlar.
  * `POST /api/rescues/{requestId}/biker-location` -> `bikerLocation(...)`: Motorcunun canlı konumunu günceller.

---

### UserController.java
* **Konum:** `com.motorescue.auth.controller.UserController`
* **Temel Yol:** `/api/users/me`
* **Metotlar:**
  * `POST /api/users/me` -> `create(...)`: İlk kayıt sonrası profil oluşturur (isim, telefon, dil vb.).
  * `GET /api/users/me` -> `get(...)`: Giriş yapmış kullanıcının profil bilgilerini getirir.
  * `PATCH /api/users/me/role` -> `role(...)`: Kullanıcı rolünü (`passenger` veya `biker`) belirler.
  * `PATCH /api/users/me` -> `update(...)`: Profil bilgilerini, motorcu araç bilgilerini günceller veya online durumunu değiştirir.
  * `PATCH /api/users/me/profile-photo` -> `profilePhoto(...)`: Firebase Storage'daki profil fotoğrafı yolunu kaydeder.
  * `DELETE /api/users/me/profile-photo` -> `deleteProfilePhoto(...)`: Profil fotoğrafını kaldırır.
  * `PATCH /api/users/me/location` -> `location(...)`: Kullanıcının (özellikle motorcunun) anlık GPS koordinatlarını günceller.
  * `PATCH /api/users/me/push-token` -> `pushToken(...)`: Cihazın Expo Push bildirim token'ını kaydeder.
  * `DELETE /api/users/me/push-token` -> `deletePushToken(...)`: Çıkış yapıldığında push token'ı siler.
  * `POST /api/users/me/identity-document` -> `submitIdentityDocument(...)`: Motorcunun kimlik/ehliyet belgelerinin Storage yollarını kaydeder.
  * `DELETE /api/users/me` -> `delete(...)`: Hesabı hem Firestore'dan hem de Firebase Auth'tan tamamen siler (GDPR/KVKK uyumu).

---

### AuthController.java
* **Konum:** `com.motorescue.auth.controller.AuthController`
* **Temel Yol:** `/api/auth`
* **Metotlar:**
  * `GET /api/auth/session` -> `session(...)`: Gönderilen Bearer token'ın geçerli olup olmadığını kontrol eder, `uid` ve `emailVerified` bilgilerini döner.

---

### ReviewController.java
* **Konum:** `com.motorescue.auth.controller.ReviewController`
* **Temel Yol:** `/api/reviews`
* **Metotlar:**
  * `POST /api/reviews/rescue/{rescueId}` -> `create(...)`: Tamamlanan bir kurtarma için yolcunun motorcuya puan ve yorum bırakmasını sağlar.
  * `GET /api/reviews/mine` -> `mine(...)`: Yolcunun yaptığı değerlendirmeleri listeler.
  * `GET /api/reviews/received` -> `received(...)`: Motorcunun aldığı değerlendirmeleri listeler.

---

### BadgeController.java
* **Konum:** `com.motorescue.auth.controller.BadgeController`
* **Temel Yol:** `/api/badges`
* **Metotlar:**
  * `GET /api/badges/me` -> `mine(...)`: Motorcunun kazandığı rozetleri, seviyesini (Bronze, Silver, Gold, Platinum) ve toplam XP'sini döner.

---

### NotificationController.java
* **Konum:** `com.motorescue.auth.controller.NotificationController`
* **Temel Yol:** `/api/notifications`
* **Metotlar:**
  * `GET /api/notifications` -> `list(...)`: Kullanıcının bildirim gelen kutusunu listeler.
  * `PATCH /api/notifications/{notificationId}/read` -> `markRead(...)`: Belirli bir bildirimi okundu olarak işaretler.
  * `PATCH /api/notifications/read-all` -> `markAllRead(...)`: Tüm bildirimleri tek seferde okundu yapar.

---

### DirectionsController.java & PlacesController.java
* **Görevi:** Google Routes ve Places web servislerini backend üzerinden güvenli şekilde proxy'ler.
* **DirectionsController:** `POST /api/directions` ile başlangıç ve varış koordinatları arasındaki rota polyline'ını ve süresini döner.
* **PlacesController:** `POST /api/places/autocomplete` ve `GET /api/places/{placeId}` ile adres tamamlama ve detay sorguları yapar.

---

### PublicBikerController.java
* **Konum:** `com.motorescue.auth.controller.PublicBikerController`
* **Temel Yol:** `/api/bikers`
* **Metotlar:**
  * `GET /api/bikers?query=...` -> `search(...)`: Onaylı, kamuya açık motorcular arasında isim araması yapar.
  * `GET /api/bikers/{bikerId}` -> `get(...)`: Bir motorcunun genel profilini, tamamladığı kurtarmaları ve aldığı yorumları (yolcu isimleri gizlenmiş olarak) getirir.

---

### ApiExceptionHandler.java
* **Konum:** `com.motorescue.auth.controller.ApiExceptionHandler`
* **Görevi:** `@RestControllerAdvice` ile global hata yakalayıcıdır. Fırlatılan `IllegalArgumentException` veya yetkisiz token hatalarını yakalayıp JSON formatında `401 UNAUTHORIZED` döner.

---

## 4. Service Katmanı (`service`)

Bütün iş kuralları, veritabanı işlemleri ve güvenlik denetimleri burada yaşar.

### RescueService.java (Kalp ve En Kritik Servis)

Bu sınıf, uygulamanın durum makinesini (state machine) ve eşzamanlılık kilitlerini yönetir.

#### 1. `create(FirebaseToken token, CreateRescueRequest request)`
* **Kod Mantığı:**
  1. `userProfile(token.getUid())` ile kullanıcının rolünün `passenger` olduğunu doğrular (`403 FORBIDDEN`).
  2. `active(token)` ile yolcunun zaten devam eden açık bir çağrısı olup olmadığını kontrol eder (`409 CONFLICT`).
  3. Yeni bir çağrı belgesi (`rescueRequests`) hazırlar; durumu `searching`, geçerlilik süresi 5 dakika (`expiresAt = now + 300sn`).
  4. **Firestore Transaction Başlatır:**
     * `activeRescueLock(token.getUid())` referansı üzerinden `assertLockAvailable` kontrolü yapar.
     * Çağrıyı oluşturur ve `activeRescueParticipants/{passengerUid}` belgesine kilit koyar.
  5. Çağrı oluştuktan sonra asenkron olarak `notificationService.notifyNearbyBikers(response)` tetiklenir (6 km içindeki uygun motorculara bildirim gider).

#### 2. `open(FirebaseToken token)`
* **Kod Mantığı:**
  1. İstek atan kişinin `biker` rolünde olduğunu ve profilinde `online == true` olduğunu doğrular.
  2. Motorcunun konumunun güncel (`isFreshLocation`) olup olmadığını denetler.
  3. Firestore'dan `status == "searching"` olan son 10 çağrıyı çeker.
  4. Stream filtreleri ile:
     - Süresi dolmamış olanları (`!isExpired(document)`),
     - Motorcunun konumuna `ZONE_KM` (6.0 km) mesafede olanları filtreler ve döner.

#### 3. `accept(FirebaseToken token, String requestId)` (Race Condition Çözüm Yeri!)
* **Kod Mantığı:**
  1. `requireRole(token.getUid(), "biker")` ile motorcu rolü aranır.
  2. **`firestore.runTransaction` içinde atomik olarak çalışır:**
     * Çağrı belgesi (`snapshot`), motorcu profili (`biker`) ve motorcu kilidi (`bikerLock`) okunur.
     * `validateAcceptable(status, isExpired)`: Çağrı hala `searching` mi? Değilse `409` fırlatılır. (Aynı anda iki motorcu basarsa biri burada elenir!)
     * `validateBikerEligibility`: Motorcunun kimlik belgelerinin yüklü olup olmadığı, telefonunun olup olmadığı kontrol edilir.
     * `assertLockAvailable(transaction, currentLock)`: Motorcunun zaten başka bir aktif çağrısı var mı kontrol edilir.
     * Mesafe kontrolü yapılır (<= 6 km).
     * `boardingCode`: Güvenli rastgele 6 haneli biniş kodu üretilir (`SECURE_RANDOM.nextInt(1_000_000)`).
     * Çağrının durumu `"accepted"` yapılır, motorcu bilgileri çağrıya işlenir.
     * `activeRescueParticipants/{bikerUid}` belgesi oluşturularak motorcu kilitlenir.
  3. `notificationService.notifyPassengerAccepted(response)` ile yolcuya *"Motorcu yola çıktı"* bildirimi atılır.

#### 4. `start(FirebaseToken token, String requestId, StartRescueRequest request)`
* **Kod Mantığı:**
  1. Motorcunun bu çağrıya atanmış motorcu olduğunu ve durumun `accepted` olduğunu doğrular (`validateBikerTransition`).
  2. Yolcunun motorcuya söylediği biniş kodunu kontrol eder (`validateBoardingCode`):
     * Gönderilen kod veritabanındaki `boardingCode` ile eşleşmiyorsa `400 BAD_REQUEST ("Boarding code is incorrect")` fırlatılır.
  3. Kod doğruysa durum `"in_progress"` yapılır, `startedAt` zaman damgası basılır.
  4. Yolcuya sürüşün başladığı bildirilir.

#### 5. `complete(FirebaseToken token, String requestId)`
* **Kod Mantığı:**
  1. Motorcunun yetkili olduğunu ve durumun `in_progress` olduğunu doğrular.
  2. Durumu `"completed"` yapar, `completedAt` zamanını kaydeder.
  3. **Kilitleri Kaldırır:** Hem yolcunun hem motorcunun `activeRescueParticipants` kayıtları silinir. Artık her iki kullanıcı da yeni çağrı alabilir/açabilir.
  4. Motorcunun toplam kurtarma sayısını 1 artırır (`totalRescues + 1`).
  5. Yolcuya puanlama yapabilmesi için bildirim gönderir.

#### 6. `cancel(FirebaseToken token, String requestId)`
* **Kod Mantığı:**
  1. Sadece çağrının katılımcısı (yolcu veya motorcu) iptal edebilir.
  2. Durum `in_progress` veya `completed` ise iptale izin verilmez (`409 CONFLICT`). Sadece `searching` veya `accepted` aşamasında iptal edilebilir.
  3. Durum `"cancelled"` yapılır, katılımcıların kilitleri kaldırılır ve karşı tarafa iptal bildirimi gönderilir.

#### 7. `updateBikerLocation(FirebaseToken token, String requestId, double lat, double lng)`
* **Kod Mantığı:**
  * Motorcunun anlık koordinatlarını çağrı belgesindeki `bikerLocation` alanına yazar. Yolcu ekranında motorcunun harita üzerinde canlı kayması bu metot sayesinde gerçekleşir.

---

### UserService.java
* **Konum:** `com.motorescue.auth.service.UserService`
* **Görevi:** Kullanıcı profili, rol seçimi, çevrimiçi/çevrimdışı durumu ve kimlik doğrulama süreçlerini yönetir.
* **Metotlar:**
  * `create(token, request)`: Firestore'da varsayılan alanlarla (`rating: 5.0`, `role: null`, `online: false`) kullanıcı kaydı açar.
  * `get(token)`: Kullanıcı profilini döner. Eğer kimlik belgesi yüklenmiş ve otomatik onay süresi dolmuşsa statüyü `verified` yapar.
  * `setRole(token, role)`: Kullanıcının rolünü `passenger` veya `biker` olarak kaydeder.
  * `update(token, request)`: Profil bilgilerini (ad, telefon, acil durum kişisi, plaka, motor modeli) günceller. Motorcu `online: true` olmak istediğinde telefon ve rol kontrolü yapar.
  * `updateLocation(token, lat, lng)`: Motorcunun son konumunu ve `locationUpdatedAt` zamanını günceller.
  * `submitIdentityDocument(...)`: Ehliyet/kimlik fotoğraflarının Storage yollarını kaydeder ve durumu `pending` yapar.
  * `delete(token)`: Kullanıcının Firestore belgesini ve Firebase Auth kaydını siler.

---

### AuthService.java
* **Konum:** `com.motorescue.auth.service.AuthService`
* **Görevi:** Güvenlik kapısıdır.
* **Metotlar:**
  * `authenticate(String authorization)`: `Bearer <token>` formatını kontrol eder, token string'ini ayıklar.
  * `verifyIdToken(String idToken)`: `FirebaseAuth.getInstance().verifyIdToken(idToken, true)` çağrısı yaparak token'ın imzasını, süresini ve Firebase tarafından iptal edilip edilmediğini (`checkRevoked=true`) doğrular. Geçersizse `IllegalArgumentException` fırlatır.

---

### ReviewService.java
* **Konum:** `com.motorescue.auth.service.ReviewService`
* **Görevi:** Değerlendirme ve puanlama sistemini yönetir.
* **Metotlar:**
  * `create(token, rescueId, request)`:
    * **Transaction içinde çalışır.**
    * Yalnızca kurtarmanın yolcusu puan verebilir.
    * Kurtarmanın durumu `completed` olmalıdır.
    * Her kurtarma için sadece **1 adet** yorum yapılabilir (Yorum belgesinin ID'si `rescueId` olarak ayarlandığı için mükerrer kayıt imkansızdır).
    * Motorcunun `ratingTotal`, `ratingCount` değerlerini günceller ve yeni aritmetik ortalamayı (`rating = ratingTotal / ratingCount`) motorcu profiline yazar.
  * `mine(token)` & `received(token)`: Verilen ve alınan değerlendirmeleri listeler.

---

### BadgeService.java
* **Konum:** `com.motorescue.auth.service.BadgeService`
* **Görevi:** Motorcular için oyunlaştırma (gamification) ve rozet sistemini hesaplar. Rozetler veritabanında statik tutulmaz, tamamlanan kurtarmalardan dinamik olarak hesaplanır.
* **Hesaplanan Rozetler:**
  * `first_rescue`: İlk kurtarma tamamlandığında (1 kurtarma).
  * `rising_rescuer`: 5 kurtarma tamamlandığında.
  * `city_hero`: 25 kurtarma tamamlandığında.
  * `rescue_legend`: 100 kurtarma tamamlandığında.
  * `exam_hero`: Aciliyeti "sınav" olan 5 kurtarma tamamlandığında.
  * `helmet_hero`: Kask gerektiren 10 kurtarma tamamlandığında.
  * `night_rescuer`: Saat 20:00 ile 06:00 arasında tamamlanan 10 gece kurtarmasında.
  * `five_star`: En az 5 değerlendirme ve 4.8 üzeri puan ortalamasında.
* **Seviye Mantığı:** Her kurtarma 50 XP verir. XP'ye göre `Bronze`, `Silver`, `Gold`, `Platinum` unvanları atanır.

---

### NotificationService.java & NotificationInboxService.java
* **Konum:** `com.motorescue.auth.service`
* **NotificationService:**
  * `@Async("notificationExecutor")` ile çağrı oluşturulduğunda, kabul edildiğinde veya iptal edildiğinde Expo Push API'sine (`https://exp.host/--/api/v2/push/send`) HTTP isteği atar.
  * `@Scheduled` görevi ile 15 dakikada bir Expo makbuzlarını (`pushNotificationReceipts`) denetleyerek geçersiz token'ları temizler.
* **NotificationInboxService:**
  * Push bildirimi kaçıran kullanıcılar için bildirimleri Firestore'daki `userNotifications` koleksiyonuna yazar.
  * **İdempotent Tasarım:** Belge ID'leri `uid + "_" + type + "_" + requestId` şeklinde deterministik üretilir; böylece aynı bildirim iki kez kaydedilmez.
  * `markAllRead(token)`: Kullanıcının tüm okunmamış bildirimlerini tek bir `WriteBatch` kullanarak topluca günceller.

---

### DirectionsService.java & PlacesService.java
* **DirectionsService:**
  * Google Routes API v2 (`https://routes.googleapis.com/directions/v2:computeRoutes`) ile haberleşir.
  * `TRAFFIC_AWARE` seçeneğiyle canlı trafik yoğunluğunu hesaba katarak en hızlı rotayı ve polyline çizgisini çeker.
  * Mesafeyi km'ye, süreyi dakikaya çevirip döner.
* **PlacesService:**
  * Google Places API (New) (`https://places.googleapis.com/v1/places:autocomplete`) kullanarak adres aramalarında otomatik tamamlama ve koordinat çözümleme sağlar.
  * Maliyet tasarrufu için `sessionToken` desteği sunar.

---

### PublicBikerService.java
* **Konum:** `com.motorescue.auth.service.PublicBikerService`
* **Görevi:** Motorcuların kamuya açık profillerinin güvenli şekilde görüntülenmesini sağlar.
* **Güvenlik & Gizlilik (Önemli!):**
  * Yolcuların motorculara yaptığı yorumları listelerken `anonymizedPassengerName` metodu kullanılır. Yolcunun adı soyadı gizlenir (Örn: "Ahmet Y***"), böylece kişisel veriler korunur.

---

## 5. DTO Katmanı (`dto`)

Tüm veri transfer nesneleri Java 21'in modern **`record`** yapısı ile tanımlanmıştır. Bu sayede `immutable` (değiştirilemez), temiz ve `boilerplate` (getter/setter) kod içermeyen nesneler elde edilmiştir.

* **`RescueDtos.java`:** `CreateRescueRequest`, `StartRescueRequest`, `RescueResponse`
* **`UserDtos.java`:** `CreateProfileRequest`, `UpdateProfileRequest`, `UserProfileResponse`, `LocationRequest`
* **`ReviewDtos.java`:** `CreateReviewRequest`, `ReviewResponse`
* **`BadgeDtos.java`:** `BadgeResponse`, `BadgeSummaryResponse`
* **`DirectionsDtos.java`:** `RouteRequest`, `RouteResponse`
* **`PlacesDtos.java`:** `AutocompleteRequest`, `PlaceDetailsResponse`
* **`PublicBikerDtos.java`:** `PublicBikerSummary`, `PublicBikerProfile`
* **`NotificationDtos.java`:** `NotificationResponse`

---

## 6. Mülakatta Jürinin Sorabileceği Can Alıcı 5 Soru ve Yanıtları

### 1. "Neden veritabanına doğrudan mobilden yazmadın da araya Spring Boot koydun?"
> **Cevap:** *"İki temel sebebi var: Güvenlik ve Eşzamanlılık. Google Routes ve Places web servis API anahtarlarını mobil pakete (APK) gömmemek ve güvenli tutmak için backend'i proxy olarak kullandım. İkinci olarak; çağrı durum geçişlerini (`searching` -> `accepted` -> `in_progress`), biniş kodu doğrulamasını ve iki motorcunun aynı çağrıyı kapmasını engelleyen `activeRescueParticipants` transactional kilidini sadece sunucu tarafında güvenle yönetebilirdim."*

### 2. "İki motorcu aynı anda 'Kabul Et'e basarsa ne olur?"
> **Cevap:** *"RescueService sınıfındaki `accept` metodum Firestore'un `runTransaction` mekanizmasıyla çalışır. Firestore Optimistic Concurrency Control (İyimser Eşzamanlılık) kullanır. İlk motorcu işlemi tamamladığında çağrının durumunu `accepted` yapar. İkinci motorcunun işlemi commit edilmeye çalışırken okuduğu belgenin versiyonu değiştiği için transaction tekrar çalıştırılır. Yeniden çalıştığında durum artık `searching` olmadığından `validateAcceptable` metodum devreye girer ve ikinci motorcuya `409 Conflict` hatası döner."*

### 3. "Bir motorcunun aynı anda iki iş almasını nasıl engelliyorsun?"
> **Cevap:** *"`activeRescueParticipants/{uid}` koleksiyonunu dağıtık kilit (distributed lock) olarak kullanıyorum. Motorcu bir işi kabul ettiği an bu belgeye kurtarma ID'si yazılır. Başka bir çağrıyı kabul etmeye çalıştığında `assertLockAvailable` kontrolü bu kilidin varlığını tespit eder ve `409 Conflict - You already have an active rescue` hatası fırlatır. Kilit ancak kurtarma tamamlandığında (`complete`) veya iptal edildiğinde (`cancel`) silinir."*

### 4. "Bildirim gönderirken mobil uygulamanın yanıt süresi neden yavaşlamıyor?"
> **Cevap:** *"`AsyncConfig` sınıfında özel bir `ThreadPoolTaskExecutor` havuzu tanımladım ve `NotificationService` sınıfındaki bildirim metotlarını `@Async('notificationExecutor')` anotasyonu ile işaretledim. Kurtarma kabul edildiğinde veya oluşturulduğunda kullanıcıya hemen HTTP yanıtı dönülür, Expo Push bildirimleri ise arka planda ayrı bir thread üzerinden asenkron gönderilir."*

### 5. "Kullanıcı kimliğini endpoint'lerde neden parametre olarak almıyorsun?"
> **Cevap:** *"İstemciden gönderilen `userId` parametresine asla güvenilmez; kötü niyetli bir kullanıcı başka birinin ID'sini göndererek onun adına işlem yapabilir (IDOR açığı). Bu yüzden tüm uç noktalarda Firebase ID token'ı backend'deki `AuthService.verifyIdToken` metodu ile doğrular, kullanıcının gerçek kimliğini doğrudan doğrulanmış token'ın içinden (`token.getUid()`) alırım."*
