# MotoRescue Frontend - Kapsamlı Kod & Mimari Rehberi

Bu belge, **MotoRescue** mobil uygulamasının (`moto-rescue-frontend`) mimarisini, klasör yapısını, Expo Router sayfalarını, bileşenlerini ve teknik kod mantığını ayrıntılı olarak açıklamaktadır. Mülakatta mobil uygulama mimarisini anlatırken veya canlı kod üzerinde değişiklik yaparken referans olarak hazırlanmıştır.

---

## 📑 İçindekiler

1. [Teknoloji Yığını & Mimari Yaklaşım](#1-teknoloji-yığını--mimari-yaklaşım)
2. [Ağ Katmanı & Güvenlik (`api/client.ts`)](#2-ağ-katmanı--güvenlik-apiclientts)
3. [Uygulama Yaşam Döngüsü & Kök Yönlendirme (`app/_layout.tsx`)](#3-uygulama-yaşam-döngüsü--kök-yönlendirme-app_layouttsx)
4. [Yetkilendirme & Profil Sayfaları (`(auth)`)](#4-yetkilendirme--profil-sayfaları-auth)
5. [Yolcu Deneyimi & Akışı (`(passenger)`)](#5-yolcu-deneyimi--akışı-passenger)
   - [request-form.tsx (Talep Oluşturma)](#request-formtsx-yardım-talebi-oluşturma)
   - [searching.tsx (Motorcu Aranıyor)](#searchingtsx-motorcu-bekleme-ekranı)
   - [ride.tsx (Canlı Sürüş & Biniş Kodu)](#ridetsx-canlı-takip-ve-sürüş-ekranı)
   - [review.tsx (Değerlendirme)](#reviewtsx-kurtarmayı-değerlendirme)
   - [Dashboard, History, Profile](#yolcu-sekmeleri-tabs)
6. [Motorcu Deneyimi & Akışı (`(biker)`)](#6-motorcu-deneyimi--akışı-biker)
   - [dashboard.tsx (Çevrimiçi Olma & Açık Çağrılar)](#dashboardtsx-motorcu-kontrol-paneli)
   - [incoming.tsx (Gelen Acil Çağrı)](#incomingtsx-gelen-çağrı-ekranı)
   - [navigation.tsx (Navigasyon, Biniş Kodu Doğrulama & Tamamlama)](#navigationtsx-navigasyon-ve-sürüş-yönetimi)
   - [badges.tsx (Rozetler & Seviyeler)](#badgestsx-oyunlaştırma-ve-rozetler)
7. [Arka Plan Konum Takibi (`background-location.ts`)](#7-arka-plan-konum-takibi-background-locationts)
8. [Mülakatta Jürinin Sorabileceği Can Alıcı 5 Frontend Sorusu ve Yanıtları](#8-mülakatta-jürinin-sorabileceği-can-alıcı-5-frontend-sorusu-ve-yanıtları)

---

## 1. Teknoloji Yığını & Mimari Yaklaşım

* **Framework:** React Native (Expo SDK 54)
* **Yönlendirme (Routing):** Expo Router v4 (Next.js benzeri dosya tabanlı yönlendirme - *File-based routing*)
* **Dil & Tip Güvenliği:** TypeScript (Strict mode)
* **Stil & Arayüz:** NativeWind (Tailwind CSS for React Native) + Lucide React Native İkonları
* **Kimlik Doğrulama:** Firebase Auth (JS Client SDK)
* **Harita & Konum:** `react-native-maps` (Android Google Maps SDK native entegrasyonu) + `expo-location`
* **Bildirimler:** `expo-notifications` (Expo Push Notification Service)
* **Mimari Prensip:** **Server-Authoritative Thin Client**
  - İstemci (mobil uygulama), veritabanına doğrudan kritik veri yazmaz.
  - Sadece durumları gösterir (presentation layer) ve sunucunun REST API'sine istek atar.
  - Harita rotaları ve adres tamamlama bile güvenlik gereği Spring Boot backend üzerinden proxy'lenir.

---

## 2. Ağ Katmanı & Güvenlik (`api/client.ts`)

Mobil uygulamanın backend ile konuştuğu merkezi kapıdır.

### 1. Dinamik IP Çözümleme (`resolveApiUrl()`)
* **Kod Mantığı:**
  * `.env` dosyasında `EXPO_PUBLIC_API_URL` tanımlıysa doğrudan onu kullanır.
  * Tanımlı değilse çalışma ortamını dinamik olarak algılar:
    * **Android Emulator:** `http://10.0.2.2:8083` (Android emülatörünün bilgisayarın `localhost`una eriştiği özel IP).
    * **Fiziksel Cihaz (Expo Go):** `Constants.expoConfig?.hostUri` üzerinden bilgisayarın yerel ağ IP'sini (örn. `192.168.1.35:8083`) otomatik çözer.
* **Mülakat Notu:** *"Geliştirme yaparken bilgisayarımın yerel IP'si her değiştiğinde kod değiştirmek zorunda kalmamak için Expo'nun host IP'sini dinamik okuyan bir mekanizma kurdum."*

### 2. Otomatik Token Enjeksiyonu (`apiRequest<T>`)
* **Kod Mantığı:**
  1. `await auth.authStateReady()` ile Firebase Auth oturumunun hazır olduğunu garanti eder.
  2. `await auth.currentUser.getIdToken()` ile kullanıcının o anki geçerli JWT token'ını alır.
  3. Tüm isteklere otomatik olarak `Authorization: Bearer <token>` başlığını ekler.
  4. Kullanıcının seçtiği dili `Accept-Language` başlığı olarak gönderir (Backend'in bildirimleri doğru dilde atabilmesi için).
  5. HTTP 4xx veya 5xx hatası dönerse sunucunun hata mesajını yerelleştirilmiş olarak kullanıcıya fırlatır.

---

## 3. Uygulama Yaşam Döngüsü & Kök Yönlendirme (`app/_layout.tsx`)

Uygulama açıldığında ilk çalışan ve tüm rotaları saran kök bileşendir.

### Kodun Çalışma Mantığı:
1. **Oturum Dinleyicisi (`onAuthStateChanged`):**
   * Kullanıcı giriş yapmamışsa -> `router.replace("/(auth)/login")` ile giriş ekranına yönlendirir.
   * Kullanıcı giriş yapmışsa -> Backend'den `userApi.get()` ile profilini çeker.
2. **Rol Bazlı Yönlendirme (`profileRoute(profile)`):**
   * Kullanıcının henüz rolü yoksa -> `/(auth)/profile-select` ekranına atar.
   * Kullanıcı rolü `passenger` (yolcu) ise -> `/(passenger)/(tabs)/dashboard` ekranına yönlendirir.
   * Kullanıcı rolü `biker` (motorcu) ise -> `/(biker)/(tabs)/dashboard` ekranına yönlendirir.
3. **Bildirim Derin Bağlantısı (Push Notification Deep-Linking):**
   * Uygulama kapalıyken veya arka plandayken gelen bildirime tıklandığında:
     * Gelen bildirim türü `rescue_request` ve rol `biker` ise -> Doğrudan `/(biker)/incoming` ekranını açar.
     * Bildirim türü `rescue_accepted` ve rol `passenger` ise -> Yolcuyu `/(passenger)/ride` ekranına fırlatır.
4. **Arka Plan Konum Kaydı:**
   * Motorcular için arka planda GPS konumu gönderen task (`@/utils/background-location`) burada import edilerek başlatılır.

---

## 4. Yetkilendirme & Profil Sayfaları (`(auth)`)

* **`login.tsx` & `register.tsx`:** 
  * E-posta ve şifre ile Firebase Auth üzerinden giriş ve kayıt olma.
  * Giriş sonrası backend'e `userApi.get()` isteği atılarak profil kontrolü yapılır.
* **`profile-select.tsx`:**
  * Kullanıcıya ilk girişte *"Yolcu musun, Motorcu musun?"* seçimini yaptırır.
  * Seçime göre backend'deki `PATCH /api/users/me/role` endpoint'ini tetikler.
* **`profile-biker.tsx`:**
  * Motorcunun ad, telefon, plaka, motosiklet marka/model, kask durumu ve ehliyet/kimlik belgelerini yüklediği ekrandır.
  * Fotoğrafları Firebase Storage'a yükler, ardından dönen Storage yollarını backend'e kaydeder.
* **`profile-passenger.tsx`:**
  * Yolcunun acil durum kişisi (emergency contact), ad ve telefon bilgilerini kaydettiği ekrandır.

---

## 5. Yolcu Deneyimi & Akışı (`(passenger)`)

### `request-form.tsx` (Yardım Talebi Oluşturma)
Yolcunun yardım çağırdığı ana ekrandır.
* **Teknik Kod Mantığı:**
  1. **Debounced Arama:** Yolcu adres yazarken her harfte istek atmamak için `useAddressSuggestions` hook'u içinde debounce (zaman gecikmesi) kullanılır.
  2. **Places API Proxy:** `placesApi.autocomplete(...)` çağrısı backend üzerinden Google Places'a gider. Maliyet optimizasyonu için `sessionToken` kullanılır.
  3. **Haritadan Konum Seçme (`LocationMap`):** Kullanıcı dilerse harita üzerinden pini sürükleyerek başlangıç ve varış noktasını seçebilir.
  4. **Aciliyet & Kask Seçimi:** Sınav, Hastane, İş gibi aciliyet butonları ve `needsHelmet` switch'i bulunur.
  5. **Talebi Gönderme:** `rescueApi.create(...)` fonksiyonu çağrılır. Başarılı olursa dönen `requestId` ile `/(passenger)/searching?requestId=...` sayfasına geçilir.

---

### `searching.tsx` (Motorcu Bekleme Ekranı)
* **Teknik Kod Mantığı:**
  1. Yolcunun yardım çağrısı açıldıktan sonra motorcuların görmesi için beklediği ekrandır.
  2. Geriye doğru 5 dakikalık bir geri sayım (`expiresAt`) gösterir.
  3. Belirli aralıklarla (polling) veya bildirimle çağrının durumunu kontrol eder.
  4. Bir motorcu çağrıyı kabul ettiği an (`status === 'accepted'`), otomatik olarak `/(passenger)/ride` ekranına yönlenir.
  5. Yolcu isterse *"Talebi İptal Et"* butonuna basarak `rescueApi.cancel(requestId)` tetikleyebilir.

---

### `ride.tsx` (Canlı Takip ve Sürüş Ekranı)
Kurtarma kabul edildikten sonra yolcunun takip yaptığı ekrandır.
* **Teknik Kod Mantığı:**
  1. **Biniş Kodu (Boarding Code) Gösterimi:** 
     * Yolcunun ekranının üst kısmında kocaman 6 haneli güvenlik kodu yazar: *"Motorcunuza bu kodu söyleyin"*.
     * Motorcu bu kodu kendi ekranına girmeden yolculuk başlamaz.
  2. **Canlı Harita Takibi:**
     * Yolcunun konumu (`pickup`), hedef (`destination`) ve motorcunun canlı konumu (`bikerLocation`) haritada gösterilir.
     * Motorcunun yaklaşması harita üzerinde anlık güncellenir.
  3. **Çağrı Tamamlandığında:** Durum `completed` olduğu anda kullanıcıyı doğrudan değerlendirme ekranına (`/(passenger)/review`) yönlendirir.

---

### `review.tsx` (Kurtarmayı Değerlendirme)
* **Teknik Kod Mantığı:**
  * 1 ile 5 arası interaktif yıldız seçimi ve metin kutusu içerir.
  * `reviewsApi.create(rescueId, { rating, comment })` çağrısı yapar.
  * Backend motorcunun genel puan ortalamasını günceller ve yolcu ana sayfaya döner.

---

### Yolcu Sekmeleri (`(tabs)`)
* **`dashboard.tsx`:** Tek dokunuşla acil yardım çağırma butonu, son yapılan yolculuğun özeti ve yakındaki açık durum bilgisi.
* **`history.tsx`:** Geçmişte yapılan tüm yardım çağrılarının listesi (tarih, motorcu adı, başlangıç-bitiş yerleri).
* **`profile.tsx`:** Profil bilgilerini güncelleme, dil seçimi (Türkçe/İngilizce) ve çıkış yapma (`logout`).

---

## 6. Motorcu Deneyimi & Akışı (`(biker)`)

### `dashboard.tsx` (Motorcu Kontrol Paneli)
* **Teknik Kod Mantığı:**
  1. **Çevrimiçi / Çevrimdışı Anahtarı (Online Switch):**
     * Motorcu anahtarı açtığında `userApi.update({ online: true })` çağrılır.
     * Backend telefon ve kimlik kontrolü yapar; uygunsa motorcu çevrimiçi olur.
     * Çevrimiçi olunduğu anda `expo-location` ile anlık GPS konumu alınır ve backend'e gönderilir.
  2. **Açık Çağrıların Listelenmesi (`rescueApi.open()`):**
     * 6 km yakındaki açık çağrılar listelenir.
     * Her kartta mesafe, yolcunun aciliyeti ve kask ihtiyacı rozet olarak gösterilir.
  3. **İşe Tıklama:** Bir karta tıklandığında detayları görmek için `incoming.tsx` açılır.

---

### `incoming.tsx` (Gelen Çağrı Ekranı)
Yakındaki bir çağrının tüm detaylarının görüldüğü ve kabul edildiği ekrandır.
* **Teknik Kod Mantığı:**
  * Yolcunun başlangıç noktası, hedefi, aciliyet türü (`urgency`) ve kask isteyip istemediği gösterilir.
  * **"Kabul Et" Butonu:** `rescueApi.accept(requestId)` fonksiyonunu çağırır.
  * *Eğer başka bir motorcu daha önce davranmışsa*, backend'den dönen `409 CONFLICT` hatası yakalanır ve ekranda *"Bu çağrı az önce başka bir motorcu tarafından alındı"* uyarısı çıkarılır.
  * Başarılı olursa rota hesaplanarak `/(biker)/navigation` ekranına geçilir.

---

### `navigation.tsx` (Navigasyon ve Sürüş Yönetimi)
Motorcunun tüm operasyonu yönettiği en kapsamlı ekrandır.
* **Teknik Kod Mantığı:**
  1. **Google Routes Polyline:** 
     * `directionsApi.route(...)` çağrısı ile backend'den optimize rota çizgisi (`encodedPolyline`) ve tahmini varış süresi (ETA) alınır.
     * Harita üzerinde mavi rota çizgisi çizilir.
  2. **Canlı Konum Güncellemesi:**
     * Motorcu hareket ettikçe `rescueApi.updateBikerLocation(requestId, lat, lng)` çağrısı yapılarak yolcunun haritasındaki motor ikonu hareket ettirilir.
  3. **Aşama 1 - Yolcuya Ulaşma & Biniş Kodu Girişi:**
     * Motorcu yolcunun yanına vardığında ekranda kod giriş kutusu belirir.
     * Yolcunun söylediği 6 haneli kodu yazar ve *"Sürüşü Başlat"*a basar.
     * `rescueApi.start(requestId, { boardingCode })` çağrılır. Kod doğruysa durum `in_progress` olur.
  4. **Aşama 2 - Hedefe Varış & Kurtarmayı Bitirme:**
     * Hedefe ulaşıldığında *"Kurtarmayı Tamamla"* butonu aktifleşir.
     * `rescueApi.complete(requestId)` çağrılır.
     * Motorcunun üzerindeki kilit (`bikerLock`) kalkar ve motorcu tebrik ekranıyla dashboard'a döner.

---

### `badges.tsx` (Oyunlaştırma ve Rozetler)
* **Teknik Kod Mantığı:**
  * `badgesApi.mine()` ile motorcunun verileri çekilir.
  * XP İlerleme Çubuğu (Örn: 1250 / 1500 XP - Altın Seviyeye Kalan XP).
  * Rozet Grid'i:
    * Açılmış rozetler renkli emoji ve tamamlanma tarihi ile gösterilir.
    * Kilitli rozetler soluk renkli ve ilerleme yüzdesiyle (örn. 3/5 sınav kurtarması) listelenir.

---

## 7. Arka Plan Konum Takibi (`background-location.ts`)

Motorcunun ekranı kapalıyken bile çağrı alabilmesi ve yolcunun motorcuyu haritada görebilmesi için Expo'nun arka plan görev mekanizması kullanılmıştır:

* **Kütüphaneler:** `expo-task-manager` ve `expo-location`.
* **Görev Tanımı:** `TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => { ... })`
* **Çalışma Prensibi:**
  * Motorcu çevrimiçi (`online`) olduğunda arka plan görevi başlatılır.
  * Telefon kilitli olsa dahi konum değiştikçe `userApi.updateLocation(latitude, longitude)` endpoint'ine fısıldanır.
  * Motorcu çevrimdışı olduğunda arka plan görevi sonlandırılır (pil tasarrufu).

---

## 8. Mülakatta Jürinin Sorabileceği Can Alıcı 5 Frontend Sorusu ve Yanıtları

### 1. "Expo Router'ı neden tercih ettin, klasik React Navigation'a göre avantajı nedir?"
> **Cevap:** *"Expo Router, React Navigation üzerine kurulu dosya tabanlı (file-based) modern bir yönlendirme sistemidir. En büyük avantajı; Next.js gibi klasör hiyerarşisine (`(auth)`, `(passenger)`, `(biker)`) bakarak otomatik rota oluşturmasıdır. Ayrıca push bildirimlerinden gelen URL'leri (deep-linking) ekstra konfigürasyon yapmadan doğal olarak destekler."*

### 2. "Kullanıcı uygulamayı açtığında hangi ekrana gideceğini nasıl belirliyorsun?"
> **Cevap:** *"`app/_layout.tsx` dosyasında kök bir navigatör kurdum. Firebase Auth'un `onAuthStateChanged` fonksiyonu ile önce oturumu kontrol ediyorum. Oturum yoksa `/login` ekranına; oturum varsa backend'den `userApi.get()` ile profilini çekiyorum. Eğer kullanıcının rolü henüz seçilmemişse `/profile-select` ekranına, yolcuysa `/(passenger)`, motorcuysa `/(biker)` dashboard'una yönlendiriyorum."*

### 3. "Google Haritalar anahtarının güvenliğini frontend tarafında nasıl sağladın?"
> **Cevap:** *"Mobilde Google Haritalar kullanırken iki tür anahtar vardır: Biri haritayı ekrana çizen native SDK anahtarı, diğeri ise rota ve adres tamamlayan Web Service anahtarları. Native SDK anahtarını Google Cloud Console üzerinden sadece kendi Android paket adım (`com.oguzumutcan.motorescue`) ve SHA-1 imzam ile kısıtladım (başka uygulamada çalışamaz). Çalınması riskli olan Google Places ve Routes API anahtarlarını ise mobil koda asla koymadım; onları Spring Boot backend'imin arkasında saklayıp mobilden backend uç noktalarına istek attım."*

### 4. "Adres ararken kullanıcının her harf yazışında Google'a istek gidip fatura kabarmasını nasıl engelledin?"
> **Cevap:** *"`request-form.tsx` içinde `useAddressSuggestions` hook'unda debounce (gecikmeli tetikleme) tekniği kullandım. Kullanıcı yazmayı bıraktıktan sonra 300-400 milisaniye bekleyip tek bir istek atıyorum. Ayrıca Google Places API New'in `sessionToken` özelliğini kullanarak bir adres seçimi yapılana kadarki tüm tuş vuruşlarını tek bir faturalandırma oturumu altında topladım."*

### 5. "State management (durum yönetimi) olarak Redux veya Zustand yerine ne kullandın, neden?"
> **Cevap:** *"Uygulamamız **Server-Authoritative** (sunucu otoritesinde) bir mimariye sahip olduğu için istemci tarafında karmaşık global state depoları (Redux gibi boilerplate kodlar) kurmak yerine; kayıt aşamasında hafif bir React Context (`RegistrationProvider`), veri akışında ise doğrudan backend API istemcisi ve yerel React hook'ları (`useState`, `useEffect`, `useRef`) kullandım. Böylece uygulamanın durum karmaşasını azalttım ve tek gerçeklik kaynağının (single source of truth) her zaman sunucu olmasını sağladım."*
