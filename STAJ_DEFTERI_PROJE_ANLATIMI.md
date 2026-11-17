# MotoRescue Projesi — Staj Defteri İçin Teknik ve Mimari Anlatım

> Bu metin, mevcut proje kaynak kodu esas alınarak hazırlanmıştır. Projenin ne yaptığı kadar, kullanılan parçaların neden gerekli olduğu ve birbirleriyle nasıl haberleştiği de açıklanmıştır. Günlük staj defteri biçimine dönüştürülürken kurum adı, çalışma tarihleri ve kişisel görev dağılımı ayrıca eklenmelidir.

## 1. Projenin konusu ve amacı

MotoRescue, ulaşım konusunda acil desteğe ihtiyaç duyan yolcular ile yakın çevrede bulunan uygun motosiklet sürücülerini eşleştiren mobil bir yardım uygulamasıdır. Uygulamada iki temel kullanıcı rolü bulunmaktadır:

- **Passenger (yolcu):** Bulunduğu konumu ve gitmek istediği hedefi belirleyerek yardım talebi oluşturur.
- **Biker (motosiklet sürücüsü):** Gerekli profil ve belge bilgilerini tamamladıktan sonra çevrimiçi olur, yakınındaki talepleri görüntüler ve uygun talebi kabul eder.

Projenin temel amacı yalnızca iki kullanıcıyı eşleştirmek değildir. Kimlik doğrulama, rol yönetimi, konum paylaşımı, rota hesaplama, bildirim gönderimi, talep durumlarının güvenli biçimde değiştirilmesi, değerlendirme ve rozet sistemleri de aynı yapı içerisinde ele alınmıştır.

## 2. Kullanılan teknolojiler

| Katman | Kullanılan teknoloji | Projedeki görevi |
|---|---|---|
| Mobil uygulama | React Native 0.81 ve React 19 | Android, iOS ve kısmen web için ortak kullanıcı arayüzü geliştirmek |
| Geliştirme platformu | Expo SDK 54 | Mobil izinler, konum, bildirim, kamera, geliştirme ve uygulama derleme süreçlerini yönetmek |
| Dil | TypeScript | Frontend tarafında tip güvenliği sağlamak |
| Sayfa yönetimi | Expo Router | Dosya tabanlı ekran ve rol yönlendirmelerini yönetmek |
| Arayüz | NativeWind ve React Native bileşenleri | Tekrar kullanılabilir ve uyarlanabilir arayüz oluşturmak |
| Backend | Java 21 ve Spring Boot 4.1 | REST API, doğrulama, yetkilendirme ve iş kurallarını yürütmek |
| Kimlik doğrulama | Firebase Authentication | Kullanıcı hesabı oluşturma, giriş, çıkış ve ID token üretimi |
| Veritabanı | Cloud Firestore | Profil, yardım talebi, değerlendirme ve bildirim verilerini saklamak |
| Dosya depolama | Firebase Storage | Profil fotoğrafı ve kimlik/ehliyet görsellerini saklamak |
| Harita ve adres | Google Maps, Places API ve Routes API | Harita gösterimi, adres önerisi, rota, mesafe ve tahmini süre üretmek |
| Bildirim | Expo Notifications ve Expo Push API | Kullanıcılara olay tabanlı mobil bildirim göndermek |
| Yerel saklama | AsyncStorage ve SecureStore | Oturumla ilişkili profil önbelleği ile dil tercihini cihazda tutmak |
| Test | Jest ve Spring test araçları | Frontend işlevleri ile backend kurallarını otomatik doğrulamak |

## 3. Genel sistem mimarisi

Proje, istemci–sunucu mimarisiyle geliştirilmiştir. Mobil uygulama kullanıcıdan veri alır ve sonuçları gösterir. Güvenlik açısından önemli iş kuralları ise Spring Boot backend tarafından yürütülür.

```text
Kullanıcı
   |
   v
Expo / React Native mobil uygulaması
   |-- Firebase Authentication: kayıt, giriş, çıkış ve ID token
   |-- Firebase Storage: kullanıcının kendi fotoğraf/belge dosyaları
   |
   | HTTPS + Authorization: Bearer <Firebase ID token>
   v
Spring Boot REST API
   |-- Token doğrulama
   |-- Rol ve veri doğrulama
   |-- Kurtarma talebi durum makinesi
   |-- Google Places / Routes anahtarlarının korunması
   |-- Bildirim ve değerlendirme işlemleri
   v
Cloud Firestore + Google servisleri + Expo Push API
```

Bu yapıda frontend, backend’e kullanıcı kimliği olarak bir `uid` göndermemektedir. Firebase’den alınan ID token gönderilir. Backend tokenı doğruladıktan sonra kullanıcının gerçek `uid` değerini token içinden çıkarır. Böylece başka bir kullanıcının kimliğini parametre olarak gönderip işlem yapma riski azaltılmıştır.

## 4. Frontend mimarisi

Frontend, `moto-rescue-frontend` klasöründe bulunmaktadır. Uygulama dosya tabanlı yönlendirme kullandığı için `app` klasöründeki dosyalar aynı zamanda ekran ve rota yapısını oluşturur.

Temel klasörlerin görevleri şöyledir:

- `app`: Onboarding, authentication, passenger ve biker ekranlarını içerir.
- `api`: Backend endpoint’lerine yapılan istekleri tek bir katmanda toplar.
- `components`: Harita, profil fotoğrafı, belge yükleme ve yorum listesi gibi tekrar kullanılabilir bileşenleri içerir.
- `config`: Firebase istemci yapılandırmasını içerir.
- `contexts`: Kayıt sırasında ekranlar arasında geçici veri taşınmasını sağlar.
- `localization`: Türkçe–İngilizce dil seçimi ve metin dönüşümünü yönetir.
- `utils`: Bildirim, arka plan konumu, rota kararları, polyline çözme ve kayıt iş akışı gibi ortak işlemleri içerir.

Expo Router içerisinde `(auth)`, `(passenger)` ve `(biker)` gibi parantezli klasörler URL’ye eklenmeyen rota gruplarıdır. Bu sayede ekranlar kullanıcı rolüne göre mantıksal olarak ayrılmıştır. Passenger ve biker için ayrı sekme düzenleri kullanılmış, her rolün yalnızca kendi kullanım senaryosuna ait ekranları görmesi sağlanmıştır.

## 5. Kimlik doğrulama mimarisi

Projede authentication yalnızca backend’de veya yalnızca frontend’de yapılmamaktadır. İstemci ve sunucunun farklı sorumlulukları vardır.

### 5.1. Frontend tarafının sorumluluğu

Frontend Firebase Client SDK kullanarak:

- e-posta ve parola ile kullanıcı hesabı oluşturur,
- kullanıcıyı sisteme giriş yaptırır,
- şifre sıfırlama e-postasını başlatır,
- çıkış işlemini gerçekleştirir,
- oturum değişikliklerini dinler,
- backend isteklerinde kullanılacak Firebase ID tokenı alır.

Native uygulamada Firebase Auth, AsyncStorage persistence ile başlatılır. Bunun amacı uygulama kapatılıp tekrar açıldığında geçerli oturumun geri yüklenebilmesidir. API çağrıları yapılmadan önce `authStateReady()` beklenir; böylece Firebase oturumu henüz cihazdan yüklenmeden kullanıcı yanlışlıkla çıkış yapmış kabul edilmez.

### 5.2. Backend tarafının sorumluluğu

Frontend her API isteğine aşağıdaki başlığı ekler:

```text
Authorization: Bearer <Firebase ID token>
```

Backend, Firebase Admin SDK ile bu tokenın imzasını, geçerliliğini ve iptal durumunu doğrular. Doğrulama başarılı olursa `uid`, e-posta ve görüntü adı gibi bilgiler güvenilir token içinden elde edilir. İşlemi yapacak kullanıcının rolü ayrıca Firestore’daki profil kaydından okunur.

Frontend’de yapılan `currentUser` veya rol kontrolleri kullanıcı deneyimini düzenler; güvenlik sınırı değildir. Gerçek erişim kontrolü backend’de yapılır. Örneğin frontend ekranı değiştirilerek bir biker işlemi çağrılsa bile backend kullanıcının gerçekten biker olup olmadığını kontrol eder.

## 6. Kayıt ve oturum açma iş akışı

Kayıt ekranında ad, e-posta, parola ve telefon bilgileri alınır. Bu bilgiler URL parametrelerinde taşınmaz; React Context içinde geçici bir kayıt taslağı olarak tutulur. Özellikle parolanın rota parametresinde bulunmaması, hassas verinin geçmişe veya loglara sızmasını önler.

Kayıt işleminin sırası şöyledir:

1. Firebase Authentication üzerinde kullanıcı hesabı oluşturulur.
2. Firebase kullanıcısının görüntü adı güncellenir.
3. Alınan ID token ile backend’e profil oluşturma isteği gönderilir.
4. Backend, kullanıcı profilini `users/{uid}` belgesi olarak Firestore’a kaydeder.
5. Kullanıcı passenger veya biker rolünü seçer ve rolüne ait profil ekranına yönlendirilir.

Firebase hesabı oluşturulduğu hâlde backend profilinin oluşturulması başarısız olursa yeni Firebase kullanıcısı silinir. Bu telafi işlemi, authentication hesabı bulunan fakat uygulama profili bulunmayan yetim hesapların oluşmasını önler.

Girişte Firebase e-posta ve parolayı doğrular. Daha sonra backend’den kullanıcı profili alınır. Profildeki role göre passenger paneli, biker paneli veya rol seçim ekranı açılır. Uygulama açılışını hızlandırmak için son profil AsyncStorage içerisinde önbelleğe alınır. Firebase oturumunun kapalı olduğu anlaşılırsa bu önbellek temizlenir.

## 7. Backend katmanları ve REST API yapısı

Backend, `moto-rescue-backend` klasöründe yer alan Spring Boot uygulamasıdır. Yapı temel olarak aşağıdaki katmanlara ayrılmıştır:

- **Controller katmanı:** HTTP endpoint’lerini tanımlar, Authorization başlığını alır ve istekleri ilgili servise aktarır.
- **Service katmanı:** Rol kontrolü, durum geçişi, transaction, mesafe hesabı ve bildirim gibi iş kurallarını uygular.
- **DTO katmanı:** Frontend ile backend arasında taşınan istek ve cevap biçimlerini tanımlar.
- **Config katmanı:** Firebase Admin, Firestore, CORS ve asenkron bildirim iş parçacıklarını yapılandırır.

Başlıca API grupları şunlardır:

| API grubu | Sorumluluk |
|---|---|
| `/api/users/me` | Profil oluşturma, okuma, güncelleme, rol, fotoğraf, belge, konum ve push token işlemleri |
| `/api/rescues` | Talep oluşturma, açık/aktif talepleri alma, kabul, iptal, başlatma ve tamamlama |
| `/api/reviews` | Tamamlanan yardım için değerlendirme oluşturma ve değerlendirmeleri listeleme |
| `/api/bikers` | Biker arama ve herkese gösterilebilen biker profilini alma |
| `/api/badges/me` | Biker rozet, seviye ve XP bilgisini hesaplama |
| `/api/notifications` | Uygulama içi bildirim kutusunu listeleme ve okundu durumunu değiştirme |
| `/api/places` | Google Places adres önerilerini backend üzerinden alma |
| `/api/directions` | Google Routes üzerinden rota, mesafe ve tahmini süre alma |
| `/api/auth/session` | Gönderilen Firebase oturumunun doğrulanmasını kontrol etme |

DTO alanlarında Jakarta Validation anotasyonları kullanılmıştır. Örneğin telefon biçimi, metin uzunlukları, koordinat aralıkları, değerlendirme puanı ve altı haneli biniş kodu backend’e ulaştığında doğrulanır.

## 8. Firestore veri modeli ve backend otoritesi

Uygulamanın temel Firestore koleksiyonları şöyledir:

| Koleksiyon | İçerik |
|---|---|
| `users` | Ad, e-posta, telefon, rol, online durumu, konum, profil, motosiklet, belge, bildirim ve puan bilgileri |
| `rescueRequests` | Yolcu ve biker bilgileri, başlangıç/hedef koordinatları, aciliyet, kask ihtiyacı ve talep durumu |
| `activeRescueParticipants` | Bir kullanıcının aynı anda ikinci aktif talebe girmesini önleyen kilit belgeleri |
| `reviews` | Tamamlanan taleplere ait puan ve yorumlar |
| `userNotifications` | Kullanıcıya ait kalıcı uygulama içi bildirimler |
| `pushNotificationReceipts` | Expo push gönderimlerinin daha sonra kontrol edilecek teslim kayıtları |

Firestore güvenlik kuralları, uygulama verilerine istemciden doğrudan okuma ve yazmayı reddeder. Frontend profil veya kurtarma talebini Firebase JS SDK ile değiştirmez; backend API üzerinden değiştirir. Firebase Admin SDK, kullanıcı tokenını ve rolünü backend’de doğruladıktan sonra Firestore’a erişir.

Bu yaklaşımın nedeni, kritik iş kurallarının kötü niyetli bir istemci tarafından atlanmasını önlemektir. Örneğin bir kullanıcı frontend kodunu değiştirerek kendisini doğrulanmış biker yapamaz, puanını yükseltemez veya talep durumunu doğrudan `completed` değerine çeviremez.

## 9. Passenger kullanım akışı

Passenger rolündeki kullanıcının temel akışı şöyledir:

1. Dashboard açıldığında mevcut aktif talep backend’den kontrol edilir.
2. Yeni talep ekranında cihaz konumu alınır veya harita üzerinden başlangıç noktası seçilir.
3. Hedef adres Google Places önerilerinden ya da alternatif konum yöntemlerinden belirlenir.
4. Aciliyet nedeni ve kask ihtiyacı seçilir.
5. Backend’e yeni kurtarma talebi gönderilir.
6. Talep `searching` durumunda oluşturulur ve beş dakika geçerli olur.
7. Uygun bir biker kabul ettiğinde passenger bilgilendirilir ve biker’ın adı, telefonu, fotoğrafı ve canlı konumu gösterilir.
8. Passenger ekranında altı haneli biniş kodu gösterilir.
9. Biker doğru kodu girdiğinde yolculuk başlatılır.
10. Biker işlemi tamamladıktan sonra passenger değerlendirme ekranına yönlendirilir.

Passenger talebi yalnızca `searching` veya `accepted` durumundayken iptal edebilir. Yolculuk `in_progress` durumuna geçtikten sonra iptale izin verilmemesi backend iş kuralıdır.

## 10. Biker kullanım akışı

Biker rolündeki kullanıcı profilinde telefon, biyografi, plaka, motosiklet modeli, renk, uygun günler, profil fotoğrafı ve belge alanları bulunur. Biker’ın çevrimiçi olabilmesi için:

- rolünün `biker` olması,
- geçerli bir iletişim telefonunun bulunması,
- belgenin ön ve arka yüzünün yüklenmiş ve doğrulanmış olması gerekir.

Biker çevrimiçi olduğunda arka plan konum takibi başlatılır. Backend yalnızca son iki dakika içinde güncellenmiş konumu taze kabul eder. Açık talepler arasından biker’a en fazla 6 km uzaktaki uygun talepler gösterilir.

Bir talep kabul edilirken uygunluk bilgileri transaction içerisinde yeniden kontrol edilir. Böylece talep ekranda görüntülendikten sonra biker çevrimdışı olmuşsa, konumu eskimişse veya talebi başka biri kabul etmişse geçersiz kabul işlemi engellenir.

Biker talebi kabul ettikten sonra navigasyon ekranına geçer. Passenger’dan aldığı altı haneli kodu girerek binişi doğrular ve talebi `in_progress` durumuna geçirir. Varışta tamamla işlemi yapıldığında talep `completed` olur, biker’ın toplam yardım sayısı artırılır ve iki kullanıcının aktif talep kilitleri kaldırılır.

## 11. Kurtarma talebi durum makinesi

Kurtarma talebi rastgele bir durum değerine geçirilemez. Backend yalnızca belirlenen geçişlere izin verir:

```text
searching -- biker kabul eder --> accepted
searching -- passenger iptal --> cancelled
accepted  -- passenger iptal --> cancelled
accepted  -- doğru biniş kodu --> in_progress
in_progress -- biker tamamlar --> completed
```

Bu durum makinesi sayesinde örneğin tamamlanmış bir talebin tekrar başlatılması, atanmamış bir biker’ın yolculuğu başlatması veya yanlış biniş koduyla ilerlenmesi önlenir.

### Eşzamanlılık problemi ve transaction çözümü

Aynı talebi iki biker aynı anda kabul etmeye çalışabilir. Benzer biçimde bir passenger art arda iki talep oluşturabilir. Sadece frontend’de butonu pasif hâle getirmek bu durumu kesin olarak engellemez; iki istek ağ üzerinden aynı anda backend’e ulaşabilir.

Bu nedenle Firestore transaction ve `activeRescueParticipants/{uid}` kilit belgeleri kullanılmıştır. Talep oluşturma veya kabul sırasında ilgili talep ile kullanıcı kilidi atomik biçimde kontrol edilip güncellenir. İşlemin bir bölümü başarısız olursa tamamı geri alınır. Böylece passenger ve biker aynı anda birden fazla aktif kurtarma sürecine katılamaz.

## 12. Konum ve harita sistemi

Uygulama `expo-location` ile cihaz konum iznini ister. Ön planda mevcut konum harita ve talep oluşturma işlemlerinde kullanılır. Biker çevrimiçi olduğunda `expo-task-manager` ile arka plan konum görevi başlatılır.

Arka plan görevi yaklaşık 10 metrelik hareket aralıklarında ve en az 5 saniyelik ertelenmiş güncelleme ayarıyla çalışır. Güncel koordinat:

- genel biker konumu olarak `/api/users/me/location` endpoint’ine,
- aktif talep varsa o talebin canlı biker konumu olarak `/api/rescues/{id}/biker-location` endpoint’ine gönderilir.

Passenger böylece kabul edilen biker’ın yaklaşmasını harita üzerinde görebilir. Backend koordinatın gerçekten atanmış biker tarafından ve aktif bir talep için gönderildiğini doğrular.

Native mobil uygulamada `react-native-maps` ile Google haritası, işaretçiler ve rota çizgisi gösterilir. Web sürümünde native harita modülü doğrudan çalıştırılmadığı için platforma özel ayrı bir bileşen kullanılır ve kullanıcıya harita ön izlemesinin mobil uygulamada bulunduğu belirtilir. Bu ayrım web derleme hatalarını önler.

## 13. Google Places ve Routes mimarisi

Adres arama ve rota hesaplama için kullanılan web servis anahtarları frontend’e konulmamıştır. `EXPO_PUBLIC_*` değişkenleri uygulama paketinden okunabildiği için gizli kabul edilemez. Bu nedenle iki farklı anahtar kullanım alanı ayrılmıştır:

- Android Maps SDK anahtarı yalnızca telefonda haritayı çizmek için uygulama yapılandırmasına eklenir ve Android paket adı/SHA-1 ile sınırlandırılır.
- Places ve Routes web servis anahtarları backend ortam değişkenlerinde tutulur.

Frontend adres metnini `/api/places/autocomplete` endpoint’ine gönderir. Backend Google Places API’yi çağırır ve sadeleştirilmiş öneri listesini frontend’e döndürür. Seçilen adresin koordinatları yine backend üzerinden alınır.

Rota gerektiğinde başlangıç ve hedef koordinatları `/api/directions` endpoint’ine gönderilir. Backend Google Routes API’den trafik duyarlı rota, encoded polyline, mesafe ve süre alır. Frontend polyline değerini koordinat listesine dönüştürerek haritada çizer.

Bu proxy mimarisi hem API anahtarını korur hem de Google servisinden gelen cevabı uygulamanın ihtiyaç duyduğu ortak DTO biçimine dönüştürür.

## 14. Push bildirim ve aktivite kutusu

Uygulama, Expo Notifications ile fiziksel cihazdan bildirim izni alır ve Expo push token üretir. Token backend’de kullanıcı profiline kaydedilir. Backend aşağıdaki olaylarda bildirim oluşturur:

- yakında yeni yardım talebi oluşması,
- biker’ın talebi kabul etmesi,
- yolculuğun başlaması,
- yolculuğun tamamlanması,
- passenger’ın talebi iptal etmesi.

Bildirim gönderimi ana kurtarma isteğini yavaşlatmamak için 2–4 iş parçacıklı sınırlı bir executor üzerinde asenkron yürütülür. Yakın biker bildirimleri Expo sınırına uygun olarak en fazla 100 öğelik gruplar hâlinde gönderilir.

Expo’nun ilk HTTP cevabının başarılı olması bildirimin kesin olarak cihaza ulaştığını göstermez. Bu nedenle push ticket değerleri `pushNotificationReceipts` koleksiyonunda geçici olarak saklanır ve belirli aralıklarla teslim sonucu sorgulanır. Expo `DeviceNotRegistered` döndürürse artık kullanılmayan token profilden temizlenir.

Push bildirimin kaçırılabilme ihtimaline karşı aynı olaylar `userNotifications` koleksiyonunda kalıcı aktivite kaydı olarak da saklanır. Kullanıcı bildirim kutusunda eski olayları görebilir, tek bir bildirimi veya tüm bildirimleri okundu yapabilir. Belge kimliği kullanıcı, olay tipi ve talep bilgisinden deterministik üretildiği için aynı olay tekrar işlendiğinde kopya bildirim oluşması engellenir.

Frontend ön plan bildirimi, bildirime dokunma ve uygulamanın bildirimle soğuk başlatılması senaryolarını ayrı ayrı ele alır. Push ile periyodik sorgulama aynı talebi aynı anda bulursa tek bir gelen talep ekranı göstermek için sunum kilidi kullanılır. Push ana yöntem, polling ise ağ veya teslim problemi için yedek yöntemdir.

## 15. Profil fotoğrafı ve belge yükleme

Profil fotoğrafları ve biker belgeleri Firebase Storage üzerinde tutulur. Frontend kamera veya galeri aracılığıyla görsel seçer ve oturumdaki kullanıcının `uid` değerine ait sabit klasöre yükler.

Storage kuralları şu sınırları uygular:

- Profil fotoğrafı yalnızca `profilePhotos/{uid}/avatar` yoluna yazılabilir.
- Kullanıcı yalnızca kendi klasörüne yazabilir veya kendi dosyasını silebilir.
- Profil görseli JPEG, PNG veya WebP olmalı ve 5 MB’tan küçük olmalıdır.
- Belge görselleri yalnızca `identityDocuments/{uid}/front` ve `back` yollarına yazılabilir.
- Belgeler JPEG, PNG veya WebP olmalı ve 10 MB’tan küçük olmalıdır.
- Belgeyi yalnızca sahibi okuyabilir.

Dosya Storage’a yüklendikten sonra yol bilgisi backend’e gönderilir. Backend yolun token içindeki `uid` ile gerçekten eşleştiğini kontrol eder ve profil belgesine kaydeder. Böylece kullanıcı başka bir kullanıcının Storage yolunu kendi profiline bağlayamaz.

Mevcut prototipte belge `pending` durumuna alındıktan bir dakika sonra profil tekrar okunduğunda otomatik olarak `verified` yapılmaktadır. Bu davranış test/demonstrasyon amacı taşır. Üretim ortamında manuel yönetici incelemesi, OCR, resmi doğrulama servisi veya güvenilir üçüncü taraf KYC hizmetiyle değiştirilmelidir.

## 16. Değerlendirme, puan ve herkese açık biker profili

Yalnızca tamamlanmış bir talebin passenger kullanıcısı değerlendirme oluşturabilir. Her talep için değerlendirme belge kimliği olarak `rescueId` kullanıldığından aynı talebe ikinci kez yorum yapılamaz.

Değerlendirme transaction içerisinde oluşturulur ve biker profilindeki:

- toplam puan,
- değerlendirme sayısı,
- ortalama puan

alanları aynı işlemde güncellenir. Böylece değerlendirme kaydedilip ortalama puanın güncellenmemesi gibi tutarsızlıklar önlenir.

Passenger kullanıcıları biker listesini arayabilir ve seçilen biker’ın sınırlı herkese açık profilini görebilir. Bu profilde motosiklet bilgileri, biyografi, ortalama puan, toplam yardım sayısı, anonimleştirilmiş değerlendirmeler ve tamamlanan yardım geçmişinin sınırlı bir özeti bulunur. Özel telefon, belge yolu veya tam kullanıcı verisi bu cevapta paylaşılmaz.

## 17. Rozet, seviye ve oyunlaştırma

Rozetler istemciden gelen değerlere göre verilmez; backend tamamlanmış kurtarma kayıtlarını okuyarak hesaplar. Böylece kullanıcı kendi rozet veya XP değerini değiştiremez.

Mevcut sistemde ilk yardım, 5/25/100 yardım, sınav aciliyeti, kask gerektiren yardım, gece yardımı ve yüksek puan gibi başarılar bulunmaktadır. Her tamamlanan yardım 50 XP kazandırır. XP miktarına göre Bronze, Silver, Gold ve Platinum seviyeleri hesaplanır.

Rozet durumu ayrı bir istemci sayacına güvenmek yerine gerçek tamamlanmış talep geçmişinden üretildiği için yeniden hesaplanabilir ve denetlenebilir yapıdadır.

## 18. Dil, yerel veri ve kullanıcı deneyimi

Uygulama Türkçe ve İngilizce dillerini destekler. İlk dil cihaz yerel ayarından belirlenir. Kullanıcının seçimi SecureStore’a kaydedilir; giriş yapılmışsa backend profilindeki `language` alanına da yazılır. Başka cihazda giriş yapıldığında hesap dili cihazla eşitlenebilir.

Profil önbelleği dil tercihinden farklı olarak AsyncStorage’da tutulur. Bunun amacı uygulama açılışında dashboard yönlendirmesini hızlı göstermektir. Buna rağmen backend profili ve Firebase oturumu daha sonra doğrulanır; önbellek güvenlik veya veri otoritesi olarak kullanılmaz.

Hata cevapları API katmanında ortak biçimde işlenir. Backend erişilemiyorsa cihaz ile bilgisayarın aynı ağda bulunması ve API adresi gibi geliştirme ortamına özgü konular kullanıcıya anlaşılır mesajla bildirilir. Backend hata metinlerinin bilinen karşılıkları aktif dile çevrilir.

## 19. Güvenlik önlemleri

Projede uygulanan başlıca güvenlik kararları şunlardır:

- Parolalar backend veritabanında tutulmaz; Firebase Authentication tarafından yönetilir.
- Backend her korunan istekte Firebase ID token doğrular.
- Kullanıcı kimliği request body’den değil doğrulanmış tokendan elde edilir.
- Roller, profil uygunluğu ve durum geçişleri backend’de kontrol edilir.
- Firestore uygulama koleksiyonlarına doğrudan istemci erişimi kapalıdır.
- Storage erişimi oturum ve `uid` tabanlı kurallarla sınırlıdır.
- Google Places ve Routes servis anahtarları mobil pakete eklenmez.
- Firebase servis hesabı JSON dosyası repoda tutulmaz; Application Default Credentials kullanılır.
- CORS yalnızca yapılandırılmış origin değerlerine izin verir.
- İstek DTO’larında alan uzunluğu, biçim, koordinat ve puan doğrulamaları bulunur.
- Hassas kayıt parolası rota parametrelerinde taşınmaz.
- Biniş kodu yalnızca ilgili passenger’a `accepted` aşamasında gösterilir.
- Transaction işlemleri yarış durumlarını ve kısmi veri güncellemelerini azaltır.

Firebase frontend yapılandırmasındaki `apiKey` değerinin istemci paketinde bulunması tek başına servis hesabı anahtarının açığa çıkması anlamına gelmez. Firebase istemci anahtarları uygulamanın Firebase projesini tanıması için kullanılır. Güvenlik; Authentication, Storage/Firestore kuralları, API kısıtları ve backend token doğrulamasıyla sağlanır. Buna karşılık backend servis hesabı ve Google web servis anahtarları gizli tutulmalıdır.

## 20. Test ve kalite çalışmaları

Frontend tarafında Jest testleriyle aşağıdaki konular doğrulanmaktadır:

- native ve web Firebase Auth başlatma davranışı,
- AsyncStorage tabanlı oturum kalıcılığı,
- kayıt başarısız olduğunda Firebase hesabının temizlenmesi,
- kopya e-posta davranışı,
- role ve talep durumuna göre yönlendirme,
- push ve polling sonucunda aynı talebin iki kez gösterilmemesi,
- Google encoded polyline çözme,
- Türkçe–İngilizce metin ve hata çevirileri.

Backend testlerinde ise:

- Bearer token zorunluluğu,
- controller ile servis arasındaki kimlik aktarımı,
- talep durum geçişleri,
- yalnızca passenger’ın iptal ve değerlendirme yapabilmesi,
- doğru biker ve doğru biniş kodu kontrolü,
- biker uygunluğu ve güncel konum şartı,
- bildirim ticket/receipt ayrıştırma,
- eski push token temizliği,
- bildirim kutusunun kullanıcıya göre sınırlandırılması,
- Google rota süresinin dakikaya çevrilmesi,
- public profilde yorumcu adının anonimleştirilmesi

gibi kurallar test edilmektedir.

Projede TypeScript kontrolü, lint, Expo Doctor, npm audit, web/Android Metro export ve backend testleri birlikte kullanılmıştır. Son proje notlarında frontend için 19, backend için 32 başarılı test; sıfır npm audit bulgusu ve hatasız lint/TypeScript sonucu kayıt altına alınmıştır.

## 21. Derleme ve çalışma ortamı

Backend varsayılan olarak `8083` portunda çalışır. Frontend API adresi platforma göre belirlenir:

- web veya iOS simülatöründe `localhost`,
- Android emülatöründe host bilgisayara erişmek için `10.0.2.2`,
- fiziksel cihazda bilgisayarın yerel ağ IP adresi kullanılır.

Android native geliştirme derlemesinde uzun Windows klasör yolu, CMake/Ninja nesne dosyası sınırını aşmıştır. Bunun için kısa bir build mirror yolu ve CMake nesne yolu uzunluğunu sınırlayan Expo config plugin kullanılmıştır.

EAS geliştirme derlemesinde bir başka sorun, yerelde npm 11 ile oluşturulan lockfile’ın EAS üzerindeki npm 10 tarafından aynı biçimde çözülememesi olmuştur. `package.json` override yapısı npm 10 ile uyumlu hâle getirilmiş ve lockfile aynı sürümle yeniden oluşturulmuştur. Bu çalışma, yalnızca uygulama kodunun değil tekrarlanabilir bağımlılık ve CI/build ortamının da önemli olduğunu göstermiştir.

Backend’in Google Cloud Run üzerinde çalışabilecek şekilde ortam değişkenleri ve Application Default Credentials ile yapılandırılması hedeflenmiştir. Mobil geliştirme APK’sı ise Expo EAS development profile ile üretilebilmektedir.

## 22. Karşılaşılan önemli problemler ve kazanımlar

### Problem 1: Authentication sorumluluğunun yanlış anlaşılması

İlk bakışta authentication backend’de olduğu için frontend’de Firebase Auth kullanılmaması gerektiği düşünülebilir. İnceleme sonucunda frontend’in kullanıcıyı Firebase’e giriş yaptırdığı ve token aldığı, backend’in ise bu tokenı doğruladığı anlaşılmıştır. Böylece authentication ile authorization sorumlulukları ayrılmıştır.

### Problem 2: Uygulama yeniden açıldığında oturumun kaybolması

Firebase Auth’ın native tarafta doğru persistence ile başlatılmaması oturumun geri yüklenmesini etkileyebilir. `initializeAuth` ve React Native AsyncStorage persistence kullanılarak oturum kalıcılığı sağlanmış, API çağrılarında auth restorasyonu beklenmiştir.

### Problem 3: Kritik verilerin frontend’den doğrudan değiştirilmesi

Profil, rol ve talep verilerinin istemci tarafından Firestore’a yazılması iş kurallarının atlanmasına neden olabilirdi. Bu veriler backend otoritesine taşınmış ve Firestore istemci kuralları kapatılmıştır.

### Problem 4: Aynı anda birden fazla kabul veya aktif talep

Buton kilitleme yalnızca tek cihazdaki kullanıcı deneyimini düzeltmektedir. Dağıtık yarış durumunu çözmek için Firestore transaction ve kullanıcı başına aktif talep kilidi uygulanmıştır.

### Problem 5: Harita servis anahtarlarının açığa çıkması

Google web servis anahtarlarının frontend’e eklenmesi durumunda uygulama paketinden okunabileceği görülmüştür. Places ve Routes çağrıları backend proxy arkasına taşınmış; yalnızca native harita gösterim anahtarı Android kısıtlarıyla frontend’de bırakılmıştır.

### Problem 6: Push bildirimin tek başına güvenilir kabul edilmesi

Kullanıcı bildirimi kapatabilir, cihaz çevrimdışı olabilir veya teslim başarısız olabilir. Push ticket ve receipt takibi, kalıcı uygulama içi aktivite kutusu ve polling yedeği birlikte kullanılmıştır.

### Problem 7: Platformlar arası native modül farkı

`react-native-maps` native platforma özgü olduğu için web build sürecinde aynı bileşeni kullanmak sorun oluşturmuştur. `.native.tsx` ve `.web.tsx` dosyalarıyla platforma uygun uygulamalar ayrılmıştır.

### Problem 8: Geliştirme ve CI bağımlılık farkları

Farklı npm sürümlerinin lockfile’ı farklı yorumlaması EAS build hatasına neden olmuştur. Bağımlılık ağacının hedef CI sürümüyle yeniden üretilmesi ve temiz kurulumla doğrulanması gerektiği öğrenilmiştir.

## 23. Sonuç

MotoRescue projesinde mobil arayüz geliştirme, REST API tasarımı, Firebase tabanlı kimlik doğrulama, NoSQL veri modeli, harita servisleri, gerçek zamanlı konum, push bildirim, dosya depolama, transaction ve otomatik test konuları birlikte uygulanmıştır.

Projenin en önemli mimari özelliği sorumlulukların ayrılmasıdır. Frontend kullanıcı etkileşimini, cihaz izinlerini ve Firebase istemci oturumunu yönetirken; backend kimlik doğrulama sonucunu kontrol etmekte, rol ve iş kurallarını uygulamakta ve kritik veriler üzerinde tek otorite olarak çalışmaktadır. Firebase ise tek bir görev için değil, Authentication, Firestore ve Storage servisleriyle farklı katmanların altyapısını sağlamaktadır.

Bu çalışma sırasında bir mobil uygulamanın yalnızca ekranlardan oluşmadığı; güvenli kimlik aktarımı, veri tutarlılığı, eşzamanlı istekler, API anahtarlarının korunması, arka plan görevleri, bildirim teslimi ve platformlar arası derleme gibi konuların da ürünün temel parçaları olduğu görülmüştür.

## 24. Staj defterine eklenebilecek kısa özet

> Staj çalışmam kapsamında MotoRescue isimli rol tabanlı mobil yardım uygulamasının frontend ve backend mimarisini inceledim ve geliştirme süreçlerinde yer aldım. Frontend tarafında Expo, React Native ve TypeScript; backend tarafında Java ve Spring Boot kullanıldı. Firebase Authentication ile mobil uygulamada kullanıcı kaydı ve giriş işlemleri gerçekleştirildi. Elde edilen Firebase ID token, Bearer token olarak backend’e gönderildi ve Firebase Admin SDK ile doğrulandı. Kullanıcı profilleri, roller, kurtarma talepleri, değerlendirmeler ve bildirim kayıtları Firestore üzerinde backend otoritesinde tutuldu. Passenger kullanıcıların konum ve hedef bilgisiyle talep oluşturması, 6 km içindeki uygun biker kullanıcıların talebi kabul etmesi, biniş koduyla yolculuğun başlatılması ve tamamlanan yardımın değerlendirilmesi sağlandı. Google Places ve Routes servisleri API anahtarlarını korumak amacıyla backend proxy üzerinden kullanıldı. Expo Notifications ile push bildirim, Task Manager ile arka plan konum takibi, Firebase Storage ile profil ve belge yükleme işlevleri geliştirildi. Firestore transaction yapısıyla aynı kullanıcının birden fazla aktif talebe katılması ve aynı talebin eşzamanlı kabul edilmesi önlendi. Son olarak frontend ve backend otomatik testleri, TypeScript, lint, bağımlılık güvenliği ve mobil derleme süreçleriyle sistem doğrulandı.

## 25. Temel kavramlar sözlüğü

- **Authentication:** Kullanıcının kim olduğunu doğrulama işlemidir.
- **Authorization:** Doğrulanan kullanıcının hangi işlemleri yapabileceğini belirleme işlemidir.
- **ID token:** Firebase’in giriş yapan kullanıcı için ürettiği, backend’in doğrulayabildiği imzalı kimlik bilgisidir.
- **REST API:** Frontend ve backend’in HTTP üzerinden belirli endpoint’lerle haberleşme biçimidir.
- **DTO:** API isteği veya cevabında taşınacak alanların tanımlandığı veri modelidir.
- **Backend-authoritative:** Bir verinin son ve güvenilir karar merciinin backend olmasıdır.
- **Transaction:** Birden fazla veri işleminin tek atomik işlem olarak yürütülmesidir.
- **Race condition:** Eşzamanlı işlemlerin sırasına göre beklenmeyen sonuç oluşmasıdır.
- **Push token:** Expo’nun belirli bir uygulama kurulumuna bildirim göndermek için kullandığı adrestir.
- **Polyline:** Harita üzerindeki rota çizgisini sıkıştırılmış olarak temsil eden metin biçimidir.
- **Proxy:** Frontend’in dış servise doğrudan bağlanmak yerine backend üzerinden erişmesidir.
- **Persistence:** Oturum veya tercihin uygulama kapandıktan sonra da korunmasıdır.
- **Polling:** Frontend’in belirli aralıklarla backend’den yeni veri sorgulamasıdır.
- **CORS:** Web istemcilerinin backend’e hangi origin’lerden erişebileceğini belirleyen güvenlik politikasıdır.

