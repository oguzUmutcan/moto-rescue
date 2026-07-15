# MotoRescue Değişiklik Günlüğü

Bu belge projede yapılan teknik değişiklikleri, değişikliklerin gerekçelerini ve doğrulama sonuçlarını kalıcı olarak kayıt altına alır. Yeni çalışmalar tarih sırasıyla bu dosyaya eklenecektir.

## 15 Temmuz 2026 — Backend proxy üzerinden Google Places Autocomplete

### Sorun neydi?

Pickup ve destination araması yalnızca cihazın yerel geocoder'ını kullanıyordu. Okul, AVM ve işletme gibi POI adları eksik yazıldığında sonuç bulunamıyor veya aynı yer için zayıf/tekrarlı adres sonuçları çıkabiliyordu. Google Places billing daha önce etkin olmadığı için gerçek autocomplete eklenmemişti.

### Neden bu sorun çıktı?

Yerel geocoder tam metin adres çözümleme için uygundur ancak yazarken POI tahmini sunan bir autocomplete servisi değildir. Google Places anahtarını doğrudan Expo public environment'ına koymak anahtarı mobil bundle içinde açığa çıkaracağı için güvenli bir backend katmanı da gerekiyordu.

### Çözüm yöntemi neler?

- Places API (New) anahtarını yalnızca backend environment'ında tutmak.
- Firebase Bearer token gerektiren autocomplete ve details proxy endpoint'leri oluşturmak.
- Aramaları kullanıcının pickup konumuna 50 km location bias ile yakınlaştırmak.
- Aynı yazma/seçme akışında session token kullanmak.
- Autocomplete tahmini seçildiğinde Place Details ile kesin koordinatı almak.
- Google kullanılamadığında mevcut cihaz geocoder ve harita seçimini fallback olarak korumak.
- Google tahminleri gösterildiğinde gerekli attribution metnini göstermek.

### Nasıl Çözüldü?

- `POST /api/places/autocomplete` ve `GET /api/places/{placeId}` endpoint'leri eklendi.
- Backend Google'a yalnızca gerekli field mask'lerle çağrı yapıyor; API key response veya mobil bundle içine girmiyor.
- Input uzunluğu, koordinatlar, session token ve place ID alanları validation ile sınırlandı.
- Frontend debounce akışı önce Google Places sonuçlarını kullanıyor; servis yapılandırılmamış veya geçici olarak erişilemezse cihaz geocoder'ına düşüyor.
- Places tahminleri gerçek place adı, ikincil adres ve Google'ın origin mesafesiyle gösteriliyor.
- Tahmin seçimi Details endpoint'inden gelen kesin koordinatı pickup/destination state'ine yazıyor.
- `Powered by Google` attribution yalnızca Google kaynaklı sonuç bulunduğunda gösteriliyor.
- Places API (New) `motorescue-d4abc` projesinde etkinleştirildi.
- Yalnızca Places servis hedeflerine izinli ayrı `MotoRescue Places Backend` anahtarı oluşturuldu ve repo dışında Windows kullanıcı environment'ına `GOOGLE_MAPS_API_KEY` olarak kaydedildi.
- İlk oluşturma aracının progress çıktısında görünen geçici key derhal iptal edildi; uygulama yalnızca sessiz oluşturulan replacement key'i kullanıyor.
- Backend README ve application properties environment yapılandırmasıyla güncellendi.

### Test ve doğrulama

```text
mvnw.cmd test                  başarılı — 6 test
npx tsc --noEmit              başarılı
npm run lint                  başarılı — 0 hata, 0 uyarı
Places Autocomplete canlı test  HTTP 200 — 5 prediction
Place Details canlı test        HTTP 200 — location mevcut
Backend :8083                   dinliyor
```

## 15 Temmuz 2026 — Özel biker ehliyet belgesi yükleme ve inceleme durumu

### Sorun neydi?

Biker profil düzenleme ekranındaki ehliyet yükleme düğmesi yalnızca Storage'ın daha sonra etkinleştirileceğini belirten bir uyarı gösteriyordu. Profil sekmesi ise gerçek belge durumuna bakmadan her biker'ı `Verified` olarak gösteriyordu. Backend'de belge yollarını doğrulayan bir başvuru endpoint'i bulunmuyordu.

### Neden bu sorun çıktı?

Firebase Storage billing ve ürün kurulumu daha önce tamamlanamadığı için belge akışı kapatılmıştı. Eski UI tek bir boolean değerle “yüklenmiş” durumunu temsil ediyor, belgenin iki yüzünü ve `not_submitted / pending / verified / rejected` yaşam döngüsünü güvenilir biçimde ayırmıyordu.

### Çözüm yöntemi neler?

- Ehliyetin ön ve arka yüzünü sabit, kullanıcıya özel Storage yollarında ayrı tutmak.
- Her iki dosya yüklenmeden backend başvurusu oluşturmamak.
- Backend'in yolları doğrulanmış token UID'si ve biker rolüyle kontrol etmesini sağlamak.
- İstemcinin yalnızca `pending` başvurusu oluşturabilmesini, kendisini `verified` yapamamasını sağlamak.
- Belge dosyalarını diğer uygulama kullanıcılarına kapatmak.
- Profil ekranında gerçek backend durumunu göstermek.

### Nasıl Çözüldü?

- `identityDocuments/{uid}/front` ve `identityDocuments/{uid}/back` sabit yolları tanımlandı.
- Ortak belge upload bileşeni ön/arka görsel seçimi, MIME kontrolü, yüz başına 10 MB sınırı, yarım kalan upload'ı metadata ile geri yükleme ve iki yüz tamamlanınca submit davranışını uyguluyor.
- `POST /api/users/me/identity-document` endpoint'i eklendi.
- Backend yalnızca biker rolünü, token UID'sine ait tam iki yolu ve mevcut durumun `verified` olmadığını doğruladıktan sonra `pending` durumunu ve submit zamanını yazıyor.
- User profile response'a iki özel Storage yolu ve `identityDocumentSubmittedAt` eklendi.
- Biker profil sekmesindeki sabit `Verified` metni kaldırıldı; gerçek `Upload`, `Pending`, `Verified` veya `Rejected` durumu gösteriliyor.
- Pending ve verified belgelerin istemciden tekrar yüklenmesi kilitlendi; rejected durumda yeniden başvuru yapılabiliyor.
- Storage rules dosya adını, sahipliği, izinli MIME tiplerini ve boyut sınırını doğrulayacak şekilde sıkılaştırıldı; belge okuması yalnızca sahibine açık tutuldu.
- Storage kuralları `motorescue-d4abc` projesine başarıyla deploy edildi ve backend yeniden başlatıldı.

### Test ve doğrulama

```text
mvnw.cmd test      başarılı — 6 test
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
Firebase Storage rules compile/deploy başarılı
Backend :8083 dinleme kontrolü başarılı
```

## 15 Temmuz 2026 — Firebase Storage tabanlı profil fotoğrafı sistemi

### Sorun neydi?

Passenger ve biker profilleri yalnızca emoji gösteriyordu. Kullanıcı gerçek bir profil fotoğrafı seçemiyor, yükleyemiyor, değiştiremiyor veya kaldıramıyordu. Backend profil modelinde fotoğraf metadata alanı ve Storage için profil fotoğrafı güvenlik kuralı yoktu.

### Neden bu sorun çıktı?

Firebase Storage billing daha önce etkinleştirilemediği için dosya özellikleri kapalı tutulmuştu. ImagePicker paketi projede bulunsa da Firebase Storage istemcisi başlatılmamış, profil ekranlarına bağlanmamış ve backend arbitrary download URL kabul etmeden güvenli metadata saklayacak şekilde genişletilmemişti.

### Çözüm yöntemi neler?

- Her kullanıcı için sabit `profilePhotos/{uid}/avatar` Storage yolu kullanmak.
- Yalnızca JPEG, PNG ve WebP görselleri, en fazla 5 MB olacak şekilde kabul etmek.
- Storage yazma/silme işlemlerini yalnızca dosya sahibine açmak.
- Backend'e download URL yerine UID ile doğrulanabilen sabit Storage yolunu kaydetmek.
- Passenger ve biker profilinde ortak seçme, değiştirme ve kaldırma bileşeni kullanmak.

### Nasıl Çözüldü?

- Firebase istemci yapılandırmasına `getStorage` eklendi.
- Expo ImagePicker config plugin'i yalnızca fotoğraf kitaplığı açıklamasıyla eklendi; gereksiz kamera ve mikrofon izinleri kapatıldı.
- Ortak `ProfilePhoto` bileşeni fotoğraf seçimi, kare crop, MIME/boyut kontrolü, upload, download URL çözümleme, değiştirme ve silme davranışlarını uyguluyor.
- Passenger ve biker profil avatarları gerçek fotoğrafı gösterecek şekilde bağlandı; fotoğraf yoksa mevcut emoji fallback'i korunuyor.
- Backend `profilePhotoPath` alanını profile response'a ekledi.
- `PATCH /api/users/me/profile-photo` yalnızca token UID'sine ait tam sabit yolu kabul ediyor.
- `DELETE /api/users/me/profile-photo` profil metadata alanını kaldırıyor.
- Storage kurallarına authenticated read, owner-only create/update/delete, sabit dosya adı, 5 MB ve izinli görsel MIME kontrolleri eklendi.

### Test ve doğrulama

```text
mvnw.cmd test      başarılı — 6 test
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
```

İlk canlı rules deploy denemesi Firebase projesinde Storage ürünü henüz oluşturulmadığı için durmuştu:

```text
Firebase Storage has not been set up on project 'motorescue-d4abc'.
```

Firebase Console → Storage → Get Started adımı tamamlandıktan sonra aşağıdaki komut yeniden çalıştırıldı:

```powershell
npx firebase-tools deploy --only storage --project motorescue-d4abc
```

Storage kuralları başarıyla derlendi ve `motorescue-d4abc` projesine yayınlandı. Backend yeni profil fotoğrafı endpoint'leriyle yeniden başlatıldı; `8083` portu ve kimliksiz isteğe beklenen `401` yanıtı doğrulandı.

## 15 Temmuz 2026 — Boarding code TextInput NativeWind çalışma zamanı hatasının düzeltilmesi

### Sorun neydi?

Biker'ın aktif kabul edilmiş rescue kaydı bulunduğunda login sonrasında navigation ekranı otomatik açılıyor ve `TypeError: path.split is not a function (it is undefined)` component hatası oluşuyordu. Aynı hata yeni istek kabulünün hemen ardından da görülebiliyordu.

### Neden bu sorun çıktı?

ADB React Native component stack kaydı hatanın router'da değil `BikerNavigationScreen` içindeki boarding code `TextInput` bileşeninde oluştuğunu gösterdi. TextInput'a verilen NativeWind arbitrary `tracking-[8px]` sınıfı Android çalışma zamanında style/path çözümleme hatasına neden oluyordu. Önceki route parametresi sağlamlaştırması gerekli bir koruma olmakla birlikte bu component hatasının doğrudan kaynağı değildi.

### Çözüm yöntemi neler?

- NativeWind arbitrary class kullanımını problemli TextInput'tan kaldırmak.
- Aynı görsel özellikleri React Native'in tip güvenli doğrudan `style` nesnesiyle vermek.
- Gerçek component stack'i ADB logcat üzerinden doğrulamak.

### Nasıl Çözüldü?

- Boarding code TextInput yüksekliği, radius, renk, hizalama, font ve letter spacing değerleri doğrudan React Native style nesnesine taşındı.
- TextInput üzerinde NativeWind class çözümlemesi ortadan kaldırıldı.
- Biker login sonrası aktif rescue restore akışının neden doğrudan bu ekrana geldiği doğrulandı.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
ADB component stack: hata kaynağı BikerNavigationScreen > TextInput olarak doğrulandı
```

## 15 Temmuz 2026 — Biker kabul sonrası Expo Router path hatasının düzeltilmesi

### Sorun neydi?

Biker incoming rescue ekranında isteği kabul ettiğinde işlem sonrasında `TypeError: path.split is not a function (it is undefined)` hatası oluşabiliyordu ve navigation ekranına güvenilir şekilde geçilemiyordu.

### Neden bu sorun çıktı?

Expo Router local search parametresi çalışma zamanında `string`, `string[]` veya `undefined` olabilmesine rağmen yalnızca string kabul edilmiş ve doğrudan object tabanlı router params değerine aktarılmıştı. Geçersiz parametre şekli router'ın path çözümleme katmanına ulaşabiliyordu. Kabul düğmesi ayrıca istek yüklenmeden veya işlem sürerken tekrar çalıştırılabiliyordu.

### Çözüm yöntemi neler?

- Route parametresini kullanmadan önce tek bir string değere normalize etmek.
- Kabul sonrası hedefi object params yerine encode edilmiş tam string URL olarak vermek.
- Rescue detayı yüklenene kadar kabul düğmesini kapatmak.
- Kabul isteği sürerken ikinci dokunmayı engellemek.

### Nasıl Çözüldü?

- `requestId` için `string | string[] | undefined` çalışma zamanı şekilleri açıkça ele alındı.
- Kabul sonrası route `/(biker)/navigation?requestId=<encoded-id>` biçiminde oluşturuldu.
- `accepting` state'i eklenerek düğme işlem sırasında kilitlendi ve kullanıcıya `Accepting...` durumu gösterildi.
- API hatasında kilit kaldırılıyor ve mevcut açıklayıcı hata bildirimi korunuyor.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
```

## 15 Temmuz 2026 — Emülatörde geçici GPS erişilemezlik hatasının giderilmesi

### Sorun neydi?

Android Emulator'da location servisi açık, Expo Go precise location iznine sahip ve GPS koordinatı provider'a ulaşmış olmasına rağmen dashboard açılışında `Current location is unavailable` hatası yakalanmamış Promise hatası olarak uygulamayı kesiyordu.

### Neden bu sorun çıktı?

Passenger ve biker dashboard'ları `Location.getCurrentPositionAsync` çağrısını hata yakalama olmadan çalıştırıyordu. Emülatör wipe/boot sonrasında fused location provider ilk ölçümü kısa süre içinde sunamazsa çağrı reddediliyor ve kullanılabilir son GPS ölçümü kontrol edilmiyordu.

### Çözüm yöntemi neler?

- Location servisinin açık olduğunu ölçümden önce kontrol etmek.
- Önce dengeli doğrulukta güncel ölçüm istemek.
- Güncel ölçüm geçici olarak alınamazsa yalnızca iki dakikadan yeni ve kabul edilebilir doğruluktaki son bilinen ölçümü kullanmak.
- Dashboard başlangıcındaki hatayı yakalayıp haritayı güvenli bir başlangıç bölgesiyle açmak.
- Rescue formunda da aynı ortak konum çözümleyicisini kullanmak.

### Nasıl Çözüldü?

- `utils/device-location.ts` ortak konum yardımcısı eklendi.
- Passenger dashboard, biker dashboard ve rescue formundaki konum çağrıları bu yardımcıya taşındı.
- Dashboard başlangıç çağrıları `try/catch` içine alındı; GPS provider geç hazırlandığında artık yakalanmamış Promise hatası oluşmuyor.
- Emülatörün location mode, provider, Expo Go permission ve son GPS ölçümü ADB üzerinden doğrulandı.
- Test emülatörüne İstanbul koordinatı gönderildi.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
ADB location mode açık, Expo Go fine/coarse permission granted
GPS/fused last location 41.0082, 28.9784
```

## 15 Temmuz 2026 — Doğrulanmış passenger boarding code sistemi

### Sorun neydi?

Biker, passenger'ın gerçekten doğru araca bindiğini doğrulamadan yalnızca kendi onay penceresine dokunarak rescue kaydını `accepted` durumundan `in_progress` durumuna geçirebiliyordu. Önceki safety code prototipi kaldırılmış fakat yerine backend tarafından doğrulanan bir mekanizma eklenmemişti.

### Neden bu sorun çıktı?

İlk kabul sonrası akış UI durumlarını backend durum makinesiyle eşlemeye odaklanmıştı. Start endpoint'i request body almıyor ve yalnızca atanmış biker kimliği ile mevcut durumu kontrol ediyordu. Bu kontroller doğru biker'ın işlem yaptığını kanıtlasa da doğru passenger'ın araca bindiğini kanıtlamıyordu.

### Çözüm yöntemi neler?

- Biker kabulü sırasında backend'de tahmin edilmesi zor, altı haneli ve rescue'ya özel kod üretmek.
- Kodu yalnızca ilgili passenger'ın API yanıtında göstermek; biker ve diğer kullanıcılardan gizlemek.
- Start endpoint'inin altı haneli kod kabul etmesini ve transaction içinde doğrulamasını zorunlu kılmak.
- Doğru kod doğrulanmadan rescue durumunun ve başlangıç zamanının değiştirilmesini engellemek.
- Passenger ve biker ekranlarını kod paylaşma/girme akışına bağlamak.

### Nasıl Çözüldü?

- Rescue kabul transaction'ı `SecureRandom` ile altı haneli `boardingCode` üretiyor.
- API response kişiselleştirmesi kodu yalnızca rescue passenger'ına ve yalnızca `accepted` durumunda döndürüyor.
- `POST /api/rescues/{requestId}/start` artık `boardingCode` gövdesini zorunlu tutuyor ve biçimi validation ile kontrol ediyor.
- Start transaction'ı atanmış biker, mevcut durum ve boarding code kontrollerinin tamamı geçmeden `in_progress`, `boardingVerifiedAt` ve `startedAt` alanlarını yazmıyor.
- Passenger ride ekranı kodu ve güvenli paylaşım uyarısını gösteriyor.
- Biker navigation ekranına yalnızca altı rakam kabul eden kod alanı eklendi; eksik ve yanlış kodlarda sürüş başlatılmıyor.
- Controller testi start isteğinin doğrulanmış token ve boarding code ile service katmanına aktarıldığını kapsayacak şekilde genişletildi.

### Test ve doğrulama

```text
mvnw.cmd test      başarılı — 6 test
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
```

## 14 Temmuz 2026 — Güvenlik, kimlik doğrulama ve kurtarma akışı düzeltmeleri

### 1. Firebase servis hesabı anahtarının kaynak kodda bulunması

#### Sorun neydi?

Backend içinde gerçek bir Firebase servis hesabı JSON dosyası bulunuyordu. Dosya `private_key` ve `private_key_id` alanlarını içeriyordu. Maven derlemesi bu dosyayı ayrıca `target/classes` klasörüne kopyalıyordu.

#### Neden bu sorun çıktı?

Firebase Admin SDK geliştirme sırasında doğrudan indirilen JSON dosyasından başlatılmış ve dosyanın kaynak dizinine konulması tercih edilmişti. Kaynak dizinindeki resource dosyaları Maven tarafından otomatik olarak derleme çıktısına eklenir. Böylece hassas anahtar hem kaynak paketinde hem de üretilen uygulama paketinde yer alır.

Servis hesabı özel anahtarı, istemci tarafındaki Firebase API anahtarından farklıdır. Firebase istemci yapılandırması genel olarak uygulama paketinde bulunabilir; servis hesabı özel anahtarı ise yönetici yetkisi verebildiği için kesinlikle kaynak kodda veya mobil uygulamada bulunmamalıdır.

#### Çözüm yöntemi nelerdi?

- JSON anahtarını kaynak koddan ve derleme çıktısından kaldırmak.
- Dosya adını `.gitignore` kapsamına almak.
- Backend’i Google Application Default Credentials (ADC) ile çalıştırmak.
- Kimlik bilgisi yüklenemezse uygulamanın sessizce devam etmesini engellemek.
- Daha önce açığa çıkmış olabilecek anahtarı Google Cloud tarafında iptal etmek.

#### Nasıl çözüldü?

- `src/main/resources/firebase-service-account.json` kaldırıldı.
- Derlenmiş kopyası `target/classes` içinden kaldırıldı.
- Backend `.gitignore` dosyasına servis hesabı, `.env` ve `target` kuralları eklendi.
- `FirebaseConfig`, sabit dosya yolu yerine `GoogleCredentials.getApplicationDefault()` kullanacak şekilde değiştirildi.
- Firebase başlatma hatasının yalnızca loglanıp yutulması kaldırıldı; hatalı yapılandırmada uygulama artık açık şekilde başarısız oluyor.

> Operasyonel not: Eski özel anahtarın Google Cloud Console üzerinden iptal edilmesi gerekir. Dosyanın yerel projeden silinmesi anahtarın kendisini geçersiz kılmaz.

### 2. Backend’de düz metin parola ve sahte JWT kullanılması

#### Sorun neydi?

Backend kullanıcı parolalarını hashlemeden veritabanına kaydediyor ve giriş sırasında düz metin olarak karşılaştırıyordu. Giriş ve kayıt yanıtlarında gerçek JWT yerine `jwt-` veya `temp-jwt-` önekli rastgele UUID değerleri dönülüyordu.

#### Neden bu sorun çıktı?

Backend akışı prototip aşamasında geçici olarak hazırlanmıştı. Ancak geçici parola ve token kodu gerçek kimlik doğrulama katmanına dönüşmeden projede kalmıştı. Aynı zamanda frontend zaten Firebase Authentication kullandığı için iki ayrı kimlik sistemi oluşmuştu.

Parola hashleme tek yönlü olmalıdır. Gerçek bir JWT ise sunucu tarafından imzalanmalı, süre ve kullanıcı bilgisi içermeli ve her korumalı istekte doğrulanmalıdır. Rastgele UUID’nin başına `jwt-` yazılması ona JWT veya güvenlik özelliği kazandırmaz.

#### Çözüm yöntemi nelerdi?

- Firebase Authentication’ı tek kullanıcı kimliği kaynağı olarak kullanmak.
- Backend’de ikinci bir parola veritabanı tutmamak.
- Backend’e gelen Firebase ID token’larını Firebase Admin SDK ile doğrulamak.
- İptal edilmiş token’ları da reddetmek.
- Kullanılmayan JPA kullanıcı modelini ve datasource bağımlılığını kaldırmak.

#### Nasıl çözüldü?

- Parola kaydeden `User` entity’si ve `UserRepository` kaldırıldı.
- Register/login DTO ve endpoint’leri kaldırıldı.
- Mock token üretimi tamamen kaldırıldı.
- Backend `/api/auth/session` endpoint’i Bearer Firebase ID token doğrulayacak şekilde oluşturuldu.
- Token doğrulamasında `verifyIdToken(idToken, true)` kullanılarak iptal kontrolü etkinleştirildi.
- Kullanılmayan JPA bağımlılıkları kaldırıldığı için eksik datasource nedeniyle oluşan başlangıç hatası ortadan kaldırıldı.

### 3. Telefon doğrulamasının yanlış kullanıcıya uygulanabilmesi

#### Sorun neydi?

Backend Firebase token’ındaki `phone_number` claim’ini okuyordu ancak bu bilgiyi kullanıcıyla ilişkilendirmeden, istek gövdesinden gelen e-posta adresini doğrulanmış olarak işaretliyordu.

#### Neden bu sorun çıktı?

Doğrulanan kimlik ile değiştirilen kullanıcı kaydı arasında güvenli bağ kurulmamıştı. İstemciden gelen e-posta gibi değiştirilebilir alanlar güvenilir kimlik kanıtı olarak kabul edilmişti.

Kimlik doğrulamada temel kural, yetkilendirmenin istemcinin iddia ettiği kullanıcıya göre değil, doğrulanmış token’ın `uid` değerine göre yapılmasıdır.

#### Çözüm yöntemi nelerdi?

- İstekten kullanıcı e-postası kabul etmemek.
- Kullanıcı kimliğini yalnızca doğrulanmış Firebase token’ından çıkarmak.
- Telefon oturumu için token’da gerçek `phone_number` claim’i bulunmasını zorunlu kılmak.

#### Nasıl çözüldü?

- Eski e-posta tabanlı telefon doğrulama endpoint’i kaldırıldı.
- `/api/auth/phone-session` endpoint’i doğrulanmış token içinde `phone_number` bulunmadığında isteği reddedecek şekilde oluşturuldu.
- Yanıtlardaki kullanıcı kimliği Firebase token’ının `uid` değerinden alınıyor.

### 4. Açık CORS yapılandırması

#### Sorun neydi?

Backend controller üzerinde `@CrossOrigin(origins = "*")` kullanılıyordu.

#### Neden bu sorun çıktı?

Geliştirme kolaylığı için tüm origin’lere geçici izin verilmişti. Bu ayar production ortamına taşındığında herhangi bir web sitesinin backend’e tarayıcı üzerinden istek göndermesine izin verir.

#### Çözüm yöntemi nelerdi?

- CORS yönetimini merkezi yapılandırmaya taşımak.
- İzin verilen origin listesini environment değişkeniyle yönetmek.
- İzin verilen method ve header’ları açıkça sınırlandırmak.

#### Nasıl çözüldü?

- Controller üzerindeki genel `@CrossOrigin` kaldırıldı.
- `WebConfig` oluşturuldu.
- Origin listesi `CORS_ALLOWED_ORIGINS` üzerinden yapılandırılabilir hale getirildi.
- Yalnızca gerekli HTTP methodları ile `Authorization` ve `Content-Type` header’larına izin verildi.

### 5. Parolanın Expo Router parametresi olarak taşınması

#### Sorun neydi?

Kayıt ekranı ad, telefon, e-posta ve parolayı doğrulama ekranına route parametreleriyle gönderiyordu.

#### Neden bu sorun çıktı?

Ekranlar arası veri aktarmanın kolay yolu olarak Router parametreleri kullanılmıştı. Ancak route parametreleri navigation state, deep link, hata raporu ve geliştirme araçlarında görülebilir. Parola gibi hassas bilgiler URL veya route state içine konulmamalıdır.

#### Çözüm yöntemi nelerdi?

- Hassas kayıt taslağını URL’den kaldırmak.
- Parolayı kalıcı depolamaya yazmadan yalnızca uygulama belleğinde tutmak.
- Taslağı kayıt tamamlanınca hemen temizlemek.

#### Nasıl çözüldü?

- `RegistrationProvider` ve `useRegistration` oluşturuldu.
- Kayıt bilgileri kısa ömürlü React Context belleğine taşındı.
- Doğrulama route’una artık hiçbir kişisel bilgi veya parola parametresi gönderilmiyor.
- Kayıt başarıyla tamamlanınca taslak bellekten temizleniyor.
- Doğrulama ekranına taslak olmadan doğrudan gidilirse kullanıcı kayıt ekranına yönlendiriliyor.

### 6. Kurtarma isteği ve eşleştirmenin yalnızca simülasyon olması

#### Sorun neydi?

Yolcu “Request Rescue” düğmesine bastığında veri kaydedilmeden arama ekranına geçiliyordu. Yedi saniyelik timer sonunda sabit bir biker bulunmuş gibi gösteriliyordu. Biker ekranındaki gelen istek de sabit verilerden oluşuyordu.

#### Neden bu sorun çıktı?

Ekranlar önce UI prototipi olarak hazırlanmış, fakat ekranları birbirine bağlayan kalıcı veri modeli ve eşzamanlı durum yönetimi eklenmemişti.

Gerçek zamanlı eşleştirme sistemlerinde ortak bir istek kaydı bulunmalı ve taraflar aynı kaydın durumunu dinlemelidir. Aynı isteğin iki biker tarafından kabul edilmesini engellemek için kabul işlemi atomik olmalıdır.

#### Çözüm yöntemi nelerdi?

- Firestore’da `rescueRequests` koleksiyonu oluşturmak.
- Yolcunun gerçek konumunu izin alarak kaydetmek.
- Yolcu ve biker ekranlarını aynı belge üzerinde canlı dinleyiciyle senkronize etmek.
- Biker kabul işlemini Firestore transaction ile gerçekleştirmek.
- İstek durumlarını `searching`, `accepted`, `cancelled` gibi açık değerlerle yönetmek.

#### Nasıl çözüldü?

- Yolcu isteği gerçek GPS konumu, aciliyet, kask ihtiyacı, oluşturulma ve sona erme zamanıyla Firestore’a kaydediliyor.
- Arama ekranı ilgili belgeyi `onSnapshot` ile canlı dinliyor.
- Timer ile sahte eşleşme kaldırıldı.
- Biker dashboard’u açık `searching` isteklerini canlı dinliyor.
- Biker kabul işlemi transaction içinde yalnızca istek hâlâ `searching` durumundaysa gerçekleştiriliyor.
- Kabul edilen isteğe biker kimliği ve kabul zamanı yazılıyor.
- Yolcu isteği iptal ettiğinde belge `cancelled` durumuna geçiriliyor.

### 7. Kimlik belgesi yükleme işleminin sahte olması

#### Sorun neydi?

“Upload Driver’s License” düğmesi dosya seçmeden yalnızca `hasUploadedID = true` yapıyordu. Kullanıcı gerçek belge göndermeden yükleme yapılmış gibi görünebiliyordu.

#### Neden bu sorun çıktı?

Belge yükleme ekranı UI prototipi olarak hazırlanmış ve Firebase Storage bağlantısı tamamlanmamıştı. Boolean alan, belge yüklenmesi ve belgenin doğrulanması kavramlarını birbirine karıştırıyordu.

Belge yüklenmiş olması, belgenin doğrulandığı anlamına gelmez. Güvenli akışta en az `pending`, `verified` ve `rejected` gibi ayrı durumlar bulunmalıdır.

#### Çözüm yöntemi nelerdi?

- Kullanıcıdan gerçek görsel seçmek.
- Dosyayı kullanıcıya özel Storage yoluna yüklemek.
- Firestore’da yalnızca `pending` inceleme durumu oluşturmak.
- Kullanıcının kendi durumunu `verified` yapmasını güvenlik kurallarıyla engellemek.

#### Nasıl çözüldü?

- Expo Image Picker ile gerçek belge seçimi eklendi.
- Dosya `identityDocuments/{uid}` yoluna Firebase Storage üzerinden yükleniyor.
- Firestore profiline belge URL’si ve `identityDocumentStatus: "pending"` yazılıyor.
- Eski `hasUploadedID` yazımı kaldırıldı.
- Storage kuralları dosya sahibini, görsel MIME tipini ve 10 MB boyut sınırını kontrol ediyor.
- Firestore kuralları kullanıcının doğrulama durumunu yalnızca `pending` yapabilmesine izin veriyor; `verified` yetkisi istemciye verilmiyor.

### 8. Firestore ve Storage yetkilendirme kurallarının eksik olması

#### Sorun neydi?

Repo içinde uygulanabilir Firestore ve Storage güvenlik kuralları bulunmuyordu. Yeni kurtarma isteği ve belge yükleme akışlarının yalnızca UI kontrollerine güvenmesi yeterli değildi.

#### Neden bu sorun çıktı?

Firebase istemci SDK’sı doğrudan veritabanına eriştiği için gerçek güvenlik sınırı uygulama ekranları değil Firebase Security Rules’dur. UI’de bir düğmeyi gizlemek kötü niyetli bir istemcinin doğrudan API çağrısı yapmasını engellemez.

#### Çözüm yöntemi nelerdi?

- Kullanıcı profillerini yalnızca sahibine açmak.
- Kurtarma isteğini yalnızca sahibi yolcunun oluşturabilmesini sağlamak.
- Açık istekleri yalnızca biker rolünün okuyabilmesini sağlamak.
- Kabul işlemini uygun durum geçişi ve biker kimliğiyle sınırlandırmak.
- Belge yollarını kullanıcı kimliği ve dosya özellikleriyle korumak.

#### Nasıl çözüldü?

- `firestore.rules`, `storage.rules` ve `firebase.json` oluşturuldu.
- Yolcu oluşturma/iptal, biker okuma/kabul ve katılımcı okuma koşulları tanımlandı.
- Silme işlemleri kurtarma kayıtlarında kapatıldı.
- Canlı deploy denendi ancak Firebase CLI oturumunun OAuth kimliği geçersiz olduğu için Google API `401` döndürdü.

Canlı deploy için çalıştırılması gereken komutlar:

```powershell
npx firebase-tools login --reauth
npx firebase-tools deploy --only "firestore:rules,storage" --project motorescue-d4abc
```

### 9. TypeScript, lint ve route hataları

#### Sorun neydi?

- TypeScript kontrolü başarısız oluyordu.
- Lint 4 hata ve 7 uyarı üretiyordu.
- Bazı route’lar var olmayan `/(passenger)/dashboard` ve `/(biker)/dashboard` adreslerine gidiyordu.
- Kullanılmayan `app-example` klasörü TypeScript kapsamına giriyordu.
- Hook dependency ve kullanılmayan state uyarıları bulunuyordu.

#### Neden bu sorun çıktı?

Expo Router typed routes gerçek dosya yapısıyla uyuşmayan adresleri tespit etti. TypeScript yapılandırmasındaki geniş `**/*.ts` ve `**/*.tsx` kapsamı eski örnek projeyi de derlemeye dahil etti. UI geliştirmesi sırasında bazı geçici state ve hook bağımlılıkları temizlenmemişti.

#### Çözüm yöntemi nelerdi?

- Route’ları gerçek dosya tabanlı adreslerle eşleştirmek.
- Örnek klasörü TypeScript kapsamından çıkarmak.
- Lint hatalarını ve hook bağımlılıklarını düzeltmek.
- Kullanılmayan state’leri kaldırmak veya gerçek davranışa bağlamak.

#### Nasıl çözüldü?

- Dashboard yönlendirmeleri `/(passenger)/(tabs)/dashboard` ve `/(biker)/(tabs)/dashboard` olarak düzeltildi.
- `app-example` ve `node_modules`, `tsconfig.json` içindeki `exclude` listesine eklendi.
- JSX içindeki kaçış gerektiren karakterler düzeltildi.
- Hook dependency listeleri tamamlandı.
- Kullanılmayan konum state’leri kaldırıldı.
- Aciliyet seçimi gerçek state değişimine bağlandı.

### 10. Web build sırasında `react-native-maps` hatası

#### Sorun neydi?

Expo web export, `react-native-maps` paketinin native-only React Native iç modülünü import etmesi nedeniyle başarısız oluyordu.

#### Neden bu sorun çıktı?

`react-native-maps` doğrudan route bileşenlerinden import edilmişti. Metro web bundler route ağacındaki import’u işlerken platforma özel native modülleri web paketine eklemeye çalıştı.

React Native ve Expo, `.native.tsx` ve `.web.tsx` uzantılarıyla platforma özel bileşen seçimini destekler. Native bağımlılıklar ortak route dosyası yerine platform dosyasında tutulmalıdır.

#### Çözüm yöntemi nelerdi?

- Harita kullanımını ortak bir arayüz arkasına almak.
- Mobil platformlarda gerçek `react-native-maps` bileşenini kullanmak.
- Web platformunda native modülü import etmeyen güvenli fallback göstermek.

#### Nasıl çözüldü?

- `location-map.native.tsx`, `location-map.web.tsx`, ortak tipler ve TypeScript deklarasyonu oluşturuldu.
- Passenger ve biker dashboard’larından doğrudan `react-native-maps` import’u kaldırıldı.
- Native sürüm gerçek haritayı ve `animateToRegion` metodunu koruyor.
- Web sürümü kullanıcıya mobil uygulamada harita bulunduğunu belirten fallback gösteriyor.

### 11. Doğrulama ve Git kayıtları

#### Sorun neydi?

Başlangıçta frontend lint ve TypeScript kontrolleri, backend testi ve web export başarısızdı. Ayrıca backend klasörü bağımsız bir Git deposu değildi.

#### Neden bu sorun çıktı?

Projede otomatik kalite kapılarının düzenli çalıştırılmadığı ve frontend ile backend’in ayrı klasörlerde fakat farklı Git durumlarında tutulduğu görüldü.

#### Çözüm yöntemi nelerdi?

- Her ana değişiklikten sonra statik kontrol, lint, build/export ve backend testlerini çalıştırmak.
- Push kapsamını açıkça kontrol etmek.
- Başarısız dış ortam işlemlerini ayrıca raporlamak.

#### Nasıl çözüldü?

Aşağıdaki kontroller başarıyla tamamlandı:

```text
npx tsc --noEmit              başarılı
npm run lint                  başarılı
npx expo export --platform web başarılı
mvnw.cmd clean test           başarılı
```

Frontend Git commitleri:

- `ebbc9f0` — `fix: clarify registration name placeholder`
- `94ed286` — `fix: secure auth and persist rescue workflow`

Her iki commit de `origin/master` branch’ine push edildi.

Backend değişiklikleri yerel olarak uygulanmış ve test edilmiştir. Ancak `moto-rescue-backend` klasöründe `.git` ve remote bulunmadığı için backend değişiklikleri frontend deposuna yapılan push’a dahil değildir.

## 14 Temmuz 2026 — Monorepo kökünün düzeltilmesi

### Sorun neydi?

GitHub’daki `moto-rescue` reposunun yerel Git kökü yanlışlıkla yalnızca `moto-rescue-frontend` klasörüydü. Bir üstte bulunan `motorescue` klasörü ve yanındaki `moto-rescue-backend` Git tarafından takip edilmiyordu. Bu nedenle backend aynı GitHub reposuna push edilemiyordu.

### Neden bu sorun çıktı?

İlk Git clone veya `git init` işlemi proje üst klasörü yerine frontend klasöründe yapılmıştı. Git yalnızca `.git` klasörünün bulunduğu dizini ve onun alt dizinlerini takip eder; kardeş veya üst dizinlerdeki dosyaları takip edemez.

Tek repoda frontend ve backend tutulan yapıya genellikle monorepo denir. Monorepo kullanılacaksa `.git` klasörü her iki projenin de ortak üst dizininde bulunmalıdır.

### Çözüm yöntemi nelerdi?

- Mevcut Git geçmişini ve `origin` remote’unu korumak.
- `.git` metadata klasörünü ortak proje köküne taşımak.
- Frontend ve backend’i ayrı alt klasörler olarak aynı Git index’ine eklemek.
- Kök seviyede her iki teknoloji yığınını da kapsayan `.gitignore` kullanmak.
- Commit öncesinde secret, frontend ve backend kontrollerini yeniden çalıştırmak.

### Nasıl çözüldü?

- Git metadata’sı `moto-rescue-frontend/.git` konumundan ortak `motorescue/.git` konumuna taşındı.
- Mevcut `master` branch’i, commit geçmişi ve `https://github.com/oguzUmutcan/moto-rescue.git` remote’u korundu.
- Repo yapısı `moto-rescue-frontend/` ve `moto-rescue-backend/` alt projelerini içerecek hale getirildi.
- Kök `.gitignore` dosyasına Node, Expo, Maven, IDE, environment ve özel anahtar kuralları eklendi.
- Frontend için TypeScript ve ESLint, backend için Maven clean test yeniden çalıştırıldı ve başarılı oldu.
- Kaynaklarda özel anahtar bulunmadığı tekrar doğrulandı.

## 14 Temmuz 2026 — Kurtarma ve eşleştirme akışının backend'e taşınması

### Sorun neydi?

Yolcu kurtarma isteğini doğrudan Firebase istemci SDK'sı ile Firestore'a yazıyor, biker açık istekleri doğrudan sorguluyor ve kabul işlemini mobil uygulama içinden gerçekleştiriyordu. Spring Boot backend yalnızca Firebase token doğruluyor, uygulamanın ana iş akışına katılmıyordu.

### Neden bu sorun çıktı?

İlk çalışan prototipte Firebase'in gerçek zamanlı istemci SDK'sı en kısa geliştirme yolu olarak seçilmişti. Security Rules temel erişim kontrolü sağlasa da iş kuralları farklı ekranlara ve istemci koduna dağılmıştı.

İstemci güvenilir bir çalışma ortamı değildir. Değiştirilmiş bir uygulama veya doğrudan API isteği, UI kontrollerini tamamen atlayabilir. Eşleştirme gibi kritik bir akışta rol kontrolü, sahiplik, geçerli durum geçişi ve aynı isteğin yalnızca bir biker tarafından kabul edilmesi sunucu tarafında uygulanmalıdır. Bu yaklaşıma server-authoritative state denir.

### Çözüm yöntemi nelerdi?

- Firebase Authentication'ı kullanıcı kimliği sağlayıcısı olarak korumak.
- Mobil uygulamanın aldığı Firebase ID token'ını backend'e Bearer token olarak göndermek.
- Kullanıcı kimliğini istek gövdesinden değil yalnızca doğrulanmış token'ın `uid` alanından almak.
- Firestore işlemlerini Firebase Admin SDK kullanan Spring Boot servisine taşımak.
- Yolcu ve biker rollerini backend'de `users/{uid}.role` profilinden doğrulamak.
- Kabul ve iptal işlemlerini Firestore transaction ile atomik gerçekleştirmek.
- Kurtarma koleksiyonuna doğrudan istemci erişimini Security Rules ile tamamen kapatmak.

### Nasıl çözüldü?

Backend'e aşağıdaki endpoint'ler eklendi:

```text
POST /api/rescues
GET  /api/rescues/{requestId}
GET  /api/rescues/open
POST /api/rescues/{requestId}/accept
POST /api/rescues/{requestId}/cancel
```

- `CreateRescueRequest` ve `RescueResponse` API modelleri oluşturuldu.
- Koordinat, hedef ve aciliyet alanlarına Jakarta Validation sınırları eklendi.
- `AuthService.authenticate`, Authorization header içindeki Firebase ID token'ını doğruluyor.
- `RescueService`, kurtarma isteklerini Firebase Admin Firestore API ile oluşturuyor ve okuyor.
- Yolcu yalnızca `passenger` rolüyle istek oluşturabiliyor.
- Biker yalnızca `biker` rolüyle açık istekleri listeleyip kabul edebiliyor.
- Bir isteği yalnızca isteğin sahibi yolcu iptal edebiliyor.
- Kabul işlemi, istek hâlâ `searching` durumunda ve süresi dolmamışsa transaction içinde tamamlanıyor. Böylece iki biker aynı isteği eşzamanlı olarak kabul edemiyor.
- Katılımcı olmayan kullanıcıların istek detayına erişimi backend tarafından reddediliyor.
- Firebase yapılandırması `FirebaseApp` ve `Firestore` Spring bean'leri sağlayacak şekilde düzenlendi.
- Merkezi API hata işleyicisi yetkisiz istekleri HTTP 401 olarak döndürüyor.

Frontend'de ortak `api/rescues.ts` istemcisi oluşturuldu:

- Her istekten önce güncel Firebase ID token alınıyor.
- Token `Authorization: Bearer` header'ıyla backend'e gönderiliyor.
- Yolcu istek oluşturma ve iptal işlemleri backend API'ye geçirildi.
- Yolcu arama ekranı istek durumunu backend'den periyodik olarak yeniliyor.
- Biker dashboard açık istekleri backend'den alıyor.
- Biker kabul işlemi backend endpoint'ine taşındı.
- Android emulator için varsayılan `10.0.2.2:8080`, web/iOS simulator için `localhost:8080` adresi tanımlandı.
- Fiziksel cihaz ve deployment ortamları için `EXPO_PUBLIC_API_URL` yapılandırması eklendi.

Firestore güvenlik kurallarında `rescueRequests` koleksiyonu için bütün istemci okuma ve yazmaları kapatıldı. Firebase Admin SDK bu kuralları yalnızca güvenilir backend ortamında bypass eder.

Backend'in çalışması için Application Default Credentials gerekir. Yerel geliştirmede workspace dışındaki bir credential dosyası `GOOGLE_APPLICATION_CREDENTIALS` ile gösterilmeli; Google Cloud deployment ortamında JSON anahtar yerine runtime service account kullanılmalıdır.

### Test ve doğrulama

```text
mvnw.cmd clean test             başarılı — 5 test
npx tsc --noEmit                başarılı
npm run lint                    başarılı
npx expo export --platform web  başarılı
```

Token header reddetme ve rescue controller delegasyonu için yeni backend testleri eklendi. Çalışma ayrı `feat/backend-rescue-workflow` branch'inde yapıldı.

## 14 Temmuz 2026 — Profil, geçmiş ve sürüş durumlarının backend'de merkezileştirilmesi

### Sorun neydi?

Kurtarma isteği backend'e taşınmış olmasına rağmen kullanıcı profili oluşturma, rol seçme, profil güncelleme ve hesap silme işlemleri mobil uygulamadan doğrudan Firestore'a yapılıyordu. Geçmiş ekranları örnek veri gösteriyordu. Sürüşü başlatma/tamamlama ve yolcunun sürüş ekranındaki iptal işlemleri yalnızca yerel ekran durumunu değiştiriyordu.

### Neden bu sorun çıktı?

Prototip geliştirme sırasında Firebase istemci SDK'sı ve ekran içi state hızlı sonuç verdi. Ancak istemci tarafındaki kontrol güvenlik sınırı değildir: değiştirilmiş bir uygulama iş kurallarını aşabilir ve UI ile kalıcı veri birbirinden kopabilir. İş akışının tek doğruluk kaynağı backend olmadığında farklı cihazlarda tutarsız durumlar oluşur.

Teorik olarak bu problem “server-authoritative state” yaklaşımıyla çözülür. Kimlik doğrulama istemcide başlayabilir fakat yetkilendirme, sahiplik ve durum makinesi geçişleri güvenilir sunucuda uygulanır. Bu sürümde durum akışı `searching -> accepted -> in_progress -> completed` şeklindedir; uygun aşamalarda yolcu `cancelled` durumuna geçebilir.

### Çözüm yöntemi neler?

- Firebase Authentication'ı koruyup profil verilerini Admin SDK kullanan backend üzerinden yönetmek.
- Token, header ve hata işleme kodunu ortak frontend API istemcisinde toplamak.
- Kullanıcı kimliğini yalnızca doğrulanmış Firebase token'ından almak.
- Geçmişi role göre backend'de sorgulamak.
- Sürüş geçişlerinde rol, atanmış biker ve mevcut durum kontrollerini transaction içinde yapmak.
- Ücretli Firebase Storage yerine sağlayıcı seçilene kadar kimlik görseli yüklemeyi kapalı tutmak.

### Nasıl Çözüldü?

Backend'e kullanıcı profil servisi ve şu API işlemleri eklendi:

```text
POST/GET/PATCH/DELETE /api/users/me
PATCH  /api/users/me/role
GET    /api/rescues/history
POST   /api/rescues/{requestId}/start
POST   /api/rescues/{requestId}/complete
```

- Kayıt, rol seçimi, girişte rol okuma, profil düzenleme ve hesap silme `userApi` üzerinden backend'e geçirildi.
- Frontend'deki doğrudan Firestore/Storage kullanımı kaldırıldı; Firebase istemcisinde yalnızca Authentication bırakıldı.
- `api/client.ts` güncel ID token'ını Bearer header'a ekliyor ve API hatalarını merkezileştiriyor.
- Yolcu ve biker geçmiş ekranları backend verisini gösteriyor.
- Biker'ın başlatma/tamamlama işlemleri backend durum makinesine bağlandı; yalnızca atanmış biker geçiş yapabiliyor.
- Yolcu sürüş ekranı durumu yeniliyor ve gerçek cancel endpoint'ini çağırıyor.
- Kimlik görseli yükleme, ücretsiz ve güvenli bir obje depolama sağlayıcısı seçilene kadar devre dışı bırakıldı; Firestore dosya deposu olarak kullanılmadı.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
git diff --check     başarılı
```

## 15 Temmuz 2026 — Google Places yanıt dönüşümü düzeltmesi

### Sorun neydi?

Adres araması Google Places servisleri etkin ve API anahtarı tanımlı olmasına rağmen sonuç göstermiyordu. Backend, autocomplete isteğinde HTTP 500 hatası üretiyordu.

### Neden bu sorun çıktı?

Spring Boot 4, JSON dönüşümü için Jackson 3'ün `tools.jackson` paketini kullanırken Places servisi eski Jackson 2 `com.fasterxml.jackson` paketindeki `JsonNode` sınıfını kullanıyordu. RestClient bu soyut tipi uygun dönüştürücüyle oluşturamıyordu.

### Çözüm yöntemi neler?

- Places yanıt tipini Spring Boot 4 ile gelen Jackson 3 tipiyle uyumlu hâle getirmek.
- Backend testlerini çalıştırıp güncel servisi yeniden başlatmak.
- Canlı adres araması sırasında backend logunu doğrulamak.

### Nasıl çözüldü?

- `PlacesService` içindeki `JsonNode` importu `tools.jackson.databind.JsonNode` olarak değiştirildi.
- Google Cloud tarafında `places.googleapis.com` ve `places-backend.googleapis.com` servislerinin etkin olduğu doğrulandı.
- `GOOGLE_MAPS_API_KEY` değişkeninin Windows kullanıcı ortamında kayıtlı olduğu, anahtar değeri açığa çıkarılmadan doğrulandı.

### Test ve doğrulama

```text
mvnw.cmd test       başarılı — 6 test
Güncel backend      başarılı — 8083 portunda PID 32796
Places servisleri  etkin — places.googleapis.com ve places-backend.googleapis.com
API anahtarı        Windows User scope içinde tanımlı
```

## 15 Temmuz 2026 — Adres önerilerinin ilk karakterde başlaması

### Sorun neydi?

Passenger adres alanındaki Google Places önerileri ancak üç karakter yazıldıktan sonra başlıyordu. Kullanıcı önerilerin ilk karakterden itibaren görünmesini istedi.

### Neden bu sorun çıktı?

Adres önerisi hook'unda sorgu uzunluğu için sabit olarak üç karakterlik alt sınır uygulanmıştı.

### Çözüm yöntemi neler?

- Minimum sorgu uzunluğunu bir karaktere düşürmek.
- Mevcut debounce, oturum tokenı ve fallback geocoder davranışını korumak.
- TypeScript ve lint kontrolleriyle değişikliği doğrulamak.

### Nasıl çözüldü?

- `useAddressSuggestions` içindeki minimum sorgu uzunluğu kontrolü `3` değerinden `1` değerine indirildi.
- Boş veya yalnızca boşluk içeren sorgular için öneri üretilmemesi korundu.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 15 Temmuz 2026 — Biker profil fotoğrafı ve belge kamera seçeneği

### Sorun neydi?

Biker profil oluşturma ekranında yalnızca emoji avatar seçilebiliyor, güvenli profil fotoğrafı yükleme alanı görünmüyordu. Ehliyet ön/arka yükleme alanına basıldığında ise kullanıcıya kaynak seçimi sunulmadan doğrudan galeri açılıyordu.

### Neden bu sorun çıktı?

Ortak `ProfilePhoto` bileşeni biker'ın sekmeli profil ekranında kullanılmış ancak onboarding ekranına bağlanmamıştı. Belge yükleme bileşeni yalnızca `launchImageLibraryAsync` kullanıyordu ve Expo ImagePicker yapılandırmasında kamera izni kapalıydı.

### Çözüm yöntemi neler?

- Biker onboarding profilini mevcut güvenli profil fotoğrafı akışına bağlamak.
- Ehliyetin her iki yüzü için kamera veya galeri seçimi sunmak.
- Kamera ve medya izinlerini yalnızca kullanıcı ilgili kaynağı seçtiğinde istemek.
- Mevcut dosya türü, boyut ve Firebase Storage güvenlik kontrollerini korumak.

### Nasıl çözüldü?

- Biker profil oluşturma ekranına `ProfilePhoto` eklendi ve backend profilindeki `profilePhotoPath` ile bağlandı.
- Emoji seçimi, fotoğraf bulunmadığında kullanılacak fallback olarak korundu.
- Ehliyet alanına `Take photo`, `Choose from gallery` ve `Cancel` seçenekleri eklendi.
- Kamera seçiminde `requestCameraPermissionsAsync` ve `launchCameraAsync` kullanıldı.
- Expo ImagePicker kamera izin açıklaması uygulama yapılandırmasına eklendi.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 15 Temmuz 2026 — Profil fotoğrafı kamerası ve kayıt yönlendirmesi

### Sorun neydi?

Passenger ve diğer profil ekranlarında profil fotoğrafına basıldığında yalnızca galeri açılıyordu. Ayrıca kullanıcı `verify-creds` ekranında hesabı başarıyla oluşturduktan sonra rol seçimine ilerlemek yerine yeniden hesap oluşturma ekranına dönüyordu.

### Neden bu sorun çıktı?

Ortak `ProfilePhoto` bileşeni yalnızca medya kütüphanesini başlatıyordu. Kayıt akışında ise başarı sonrasında draft temizlenince `verify-creds` guard effect'i bunu eksik kayıt verisi olarak algılıyor ve `profile-select` yönlendirmesiyle aynı anda `register` yönlendirmesi başlatıyordu.

### Çözüm yöntemi neler?

- Ortak profil fotoğrafı bileşeninde kamera ve galeri kaynaklarını açıkça sunmak.
- Seçilen kaynağa özgü izni istemek ve mevcut güvenli yükleme kontrollerini korumak.
- Başarıyla tamamlanan kayıt sırasında eksik-draft guard'ının devreye girmesini engellemek.
- Draft içindeki parolayı rol seçimine geçerken bellekten temizlemeye devam etmek.

### Nasıl çözüldü?

- `ProfilePhoto` aksiyonlarına `Take photo`, `Choose from gallery`, opsiyonel `Remove photo` ve `Cancel` eklendi.
- Kamera için `requestCameraPermissionsAsync` ve `launchCameraAsync` kullanıldı.
- Başarılı kayıt tamamlanırken `isCompletingRegistration` ref'i ayarlanarak draft temizliğinin yanlış geri yönlendirme üretmesi önlendi.
- Expo kamera izin açıklaması profil ve doğrulama fotoğraflarını kapsayacak şekilde güncellendi.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 15 Temmuz 2026 — Ehliyetsiz biker'ın online olmasının engellenmesi

### Sorun neydi?

Biker, sürücü belgesinin ön ve arka yüzünü yüklemeden dashboard üzerinden kendisini online yapabiliyordu. Online tercihi yalnızca cihazdaki SecureStore'a kaydedildiği için backend bu durumu doğrulamıyordu.

### Neden bu sorun çıktı?

Dashboard online durumunu yerel UI tercihi olarak yönetiyordu. Backend profil güncelleme endpoint'i de `online=true` talebinde rol veya kimlik belgesi durumunu kontrol etmiyordu.

### Çözüm yöntemi neler?

- Online durumunu backend-authoritative hâle getirmek.
- Hem belge durumu hem ön/arka belge yolları mevcut değilse backend'de online talebini reddetmek.
- Frontend'de kullanıcıya anlaşılır uyarı ve belge yükleme ekranına geçiş sunmak.
- Eski yerel online kaydı nedeniyle belgesiz online görünen hesapları dashboard açılışında offline yapmak.

### Nasıl çözüldü?

- Backend `online=true` güncellemesinde biker rolü, `pending`/`verified` belge durumu ve iki belge yolu zorunlu kılındı.
- Biker dashboard online durumunu SecureStore yerine `/api/users/me` profilinden okumaya ve güncellemeye başladı.
- Belgesi olmayan kullanıcı online düğmesine bastığında belge yükleme CTA'sı gösteriliyor.
- Eski veride belgesiz olup `online=true` kalan hesaplar dashboard yüklenirken backend üzerinden offline yapılıyor.
- Belge uygunluk kombinasyonları için backend birim testi eklendi.

### Test ve doğrulama

```text
mvnw.cmd test       başarılı — 7 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```

## 15 Temmuz 2026 — Passenger'ın atanan biker'ı arayabilmesi

Passenger'ın `Biker on the way` ekranında atanan biker ile telefon üzerinden iletişim kurabileceği bir işlem bulunmuyordu.

- Biker rescue isteğini kabul ettiğinde profilindeki telefon numarası rescue kaydına ekleniyor ve `RescueResponse` içinde yalnızca rescue katılımcılarına ulaşıyor.
- Accepted durumundaki passenger ride ekranına telefon ikonlu arama butonu eklendi.
- Numara cihazın telefon uygulamasına `tel:` bağlantısıyla aktarılıyor; numara yoksa veya telefon uygulaması açılamazsa kullanıcıya açıklayıcı uyarı gösteriliyor.
- Yolculuk başladıktan sonra arama butonu gizleniyor.

### Doğrulama

```text
mvnw.cmd test       başarılı — 9 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
```

## 15 Temmuz 2026 — Kamera sonrası görünmeyen kaydet düğmesi

### Sorun neydi?

Profil veya ehliyet fotoğrafı kamerayla çekildikten sonra Android edit/kırpma ekranı açılıyor ancak emülatör ekranında kaydet/onay düğmesi görünmüyordu. Kullanıcı çektiği fotoğrafla yükleme akışına devam edemiyordu.

### Neden bu sorun çıktı?

Kamera ve galeri aynı ImagePicker seçeneklerini kullanıyor, her iki kaynakta da `allowsEditing: true` gönderiliyordu. Bu değer Android'in sistem kırpma arayüzünü açıyordu; arayüzün onay kontrolü mevcut emülatör ekranına düzgün yerleşmiyordu.

### Çözüm yöntemi neler?

- Kamera çekiminde sistem edit/kırpma ekranını atlamak.
- Çekilen fotoğrafı doğrudan mevcut doğrulama ve yükleme akışına vermek.
- Galeriden seçimde kırpma özelliğini korumak.

### Nasıl çözüldü?

- Profil ve kimlik belgesi ImagePicker seçeneklerinde `allowsEditing`, yalnızca kaynak `library` olduğunda etkin olacak şekilde değiştirildi.
- Kamera kaynağı artık çekim onayından sonra ekstra edit ekranı açmadan uygulamaya dönüyor.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 15 Temmuz 2026 — Bir dakikalık otomatik ehliyet doğrulaması

### Sorun neydi?

Projede gerçek bir admin paneli bulunmadığı için `pending` ehliyet belgelerini onaylayacak kullanıcı yoktu. Önceki geçici kural `pending` durumundaki biker'ın online olmasına izin veriyor, dolayısıyla onay şartı gerçekte uygulanmıyordu.

### Neden bu sorun çıktı?

Belge yükleme ve özel saklama akışı hazırlanmış ancak admin doğrulama iş akışı prototip kapsamına alınmamıştı. Onay durumunu otomatik ilerletecek bir mekanizma ve frontend durum yenilemesi de yoktu.

### Çözüm yöntemi neler?

- Prototip ortamında belge gönderiminden 60 saniye sonra otomatik doğrulama uygulamak.
- Frontend ekranlarını kısa aralıklarla yenileyerek durum değişikliğini kullanıcıya yansıtmak.
- Online olmayı yalnızca `verified` durumuna izin verecek şekilde sıkılaştırmak.
- Yeniden belge gönderiminde biker'ı güvenli biçimde offline yapmak.

### Nasıl çözüldü?

- Backend profil okunurken `pending` belgenin gönderim zamanı 60 saniyeyi geçtiyse durum atomik güncellemeyle `verified` yapılıyor.
- Identity upload, biker dashboard ve biker profil ekranları pending durumunda profili üç saniyede bir yeniliyor.
- Online uygunluğu yalnızca iki belge yolu bulunan `verified` biker'lar için geçerli hâle getirildi.
- Belge yeniden gönderildiğinde backend `online=false` kaydediyor.
- 60 saniye sınırı ve online uygunluğu için backend testleri genişletildi.

### Test ve doğrulama

```text
mvnw.cmd test       başarılı — 8 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```

## 15 Temmuz 2026 — Kalıcı badge doğrulaması, gerçek biker istatistikleri ve community reviews

### Sorun neydi?

Badge'lerin reinstall sonrasında sıfırlanabileceği düşünülüyordu. Biker history özetlerinde toplam, kilometre, ortalama süre ve XP; biker profilinde ise rating, seviye, rescue sayısı, kilometre, üyelik tarihi ve motosiklet bilgileri sabit örnek değerlerdi. Review'ları da yalnızca passenger kendi gönderdiği liste üzerinden görebiliyordu.

### Neden bu sorun çıktı?

Badge ekranı backend'e bağlı olmasına rağmen kalıcılık modeli UI'da açık değildi. History ve profil tasarımları prototip verileriyle bırakılmıştı. Review backend'i yalnızca `mine` sorgusu sunduğu için iki rolün ortak yorum akışına erişimi yoktu.

### Çözüm yöntemi neler?

- Badge sisteminin Firestore rescue ve rating verisinden hesaplanmaya devam ettiğini doğrulamak.
- History ve profil özetlerini gerçek rescue koordinatları, timestamp'leri, user profili ve badge özetiyle üretmek.
- Giriş yapmış passenger ve biker'lara son community review'larını sunan ortak endpoint ve ekran oluşturmak.

### Nasıl çözüldü?

- Badge'lerin cihaz depolamasında tutulmadığı; `/api/badges/me` üzerinden Firestore verisinden hesaplandığı doğrulandı.
- Biker history sahte kayıt şablonundan ayrıldı; toplam rescue, Haversine mesafesi, ortalama süre ve rescue başına 50 XP gerçek veriden hesaplanıyor.
- Biker profili gerçek rating, level, rescue sayısı, kilometre, üyelik tarihi, motosiklet modeli/rengi ve belge doğrulama durumuna bağlandı.
- Kimliği doğrulanmamış biker'da sabit `VERIFIED` etiketi kaldırıldı.
- `GET /api/reviews` ile son 100 community review giriş yapmış kullanıcılara açıldı.
- Passenger Reviews sekmesi community akışına çevrildi ve biker tab barına aynı Reviews ekranı eklendi.

### Test ve doğrulama

```text
mvnw.cmd test       başarılı — 8 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```

## 15 Temmuz 2026 — 6 km zone eşleştirmesi ve canlı biker konumu

### Sorun neydi?

Açık rescue istekleri mesafeden bağımsız olarak tüm biker'lara gösteriliyor ve passenger atanmış biker'ın canlı konumunu göremiyordu. Kullanıcıların kendi konum marker'ı dışında güvenli, rescue'a özel bir canlı takip hattı yoktu.

### Neden bu sorun çıktı?

User ve rescue modellerinde güncel biker koordinatı bulunmuyor, `/open` sorgusu yalnızca status alanına göre filtreleniyor ve harita bileşeni yalnızca hedef marker destekliyordu.

### Çözüm yöntemi neler?

- Zone yarıçapını 6 km olarak backend'de sabitlemek.
- Yalnızca online, doğrulanmış ve son iki dakika içinde konum paylaşmış biker'lara yakındaki istekleri sunmak.
- Zone kontrolünü kabul işleminde de tekrar ederek istemci tarafından atlanmasını önlemek.
- Aktif rescue boyunca katılımcıya özel canlı biker konumu yayınlamak.

### Nasıl çözüldü?

- User konumu için doğrulanmış `PATCH /api/users/me/location` endpoint'i eklendi.
- Aktif rescue için yalnızca atanmış biker'ın kullanabildiği `POST /api/rescues/{id}/biker-location` endpoint'i eklendi.
- `/api/rescues/open` sonuçları Haversine mesafesiyle pickup'a 6 km içinde filtreleniyor.
- Zone dışı veya iki dakikadan eski konumla kabul backend tarafından reddediliyor.
- Online dashboard 5 saniyede/20 metrede, aktif navigation 2.5 saniyede/10 metrede foreground konum yayınlıyor.
- Passenger ride haritasına atanmış biker için ayrı yeşil canlı marker eklendi; cihazın kendi konumu mevcut mavi sistem marker'ıyla görünmeye devam ediyor.
- Konum paylaşımı ekran kapanınca veya rescue terminal duruma geçince subscription cleanup ile duruyor.

### Test ve doğrulama

```text
mvnw.cmd test       başarılı — 9 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
```

## 15 Temmuz 2026 — Model geçişi için session handoff dokümanı

### Sorun neydi?

Uzun geliştirme oturumunda repo mimarisi, kullanıcı çalışma kuralları, environment ayarları, tamamlanan akışlar ve bilinen sınırlamalar birçok konuşma adımına dağılmıştı. Farklı bir modele geçildiğinde bu bağlamın kaybolma riski vardı.

### Neden bu sorun çıktı?

Commit geçmişi yapılan değişiklikleri gösterse de kararların gerekçesini, yerel çalıştırma koşullarını, test senaryosunu ve sıradaki teknik borçları tek başına açıklamaz. Sohbet bağlamı da yeni model oturumuna eksiksiz aktarılmayabilir.

### Çözüm yöntemi neler?

- Repo kökünde tek bir handoff dokümanı oluşturmak.
- Git durumu, mimari, endpoint'ler, environment ve test komutlarını belgelemek.
- Tamamlanan özelliklerle bilinen sınırlamaları ayrı listelemek.
- Secret veya credential içeriğini dokümana koymamak.

### Nasıl Çözüldü?

- Repo kökünde `session_handoff.md` oluşturuldu.
- Aktif branch/commit, monorepo yapısı, backend/frontend çalıştırma adımları ve Firebase ADC gereksinimi kaydedildi.
- Users, rescues, reviews ve badges API sözleşmeleri özetlendi.
- İki cihazlı passenger/biker test akışı ve tamamlanan frontend davranışları aktarıldı.
- Place autocomplete, canlı GPS, safety code, storage, pagination ve entegrasyon testi gibi bilinen sınırlamalar kaydedildi.
- Yeni modelin işe başlama sırası ve kullanıcının her değişikliği günlüğe kaydetme/feature branch'e push etme kuralları açıkça belirtildi.
- Dokümana hiçbir API key, Firebase credential veya secret eklenmedi.

## 15 Temmuz 2026 — Backend kontrollü rider badge ve seviye sistemi

### Sorun neydi?

Biker badges ekranındaki kazanımlar, 127 rescue, XP, level ve tarihler sabit örnek verilerdi. Gerçek sürüş tamamlandığında ilerleme değişmiyor ve badge kazanımı backend tarafından doğrulanmıyordu.

### Neden bu sorun çıktı?

Badge kriterlerini hesaplayan veri modeli ve API bulunmuyordu. UI prototipi gerçek rescue geçmişi ve review rating verileriyle bağlantı kurulmadan hazırlanmıştı. İstemci tarafında hesaplama yapılması da değiştirilmiş uygulamanın sahte badge göstermesine yol açabilirdi.

### Çözüm yöntemi neler?

- Badge kriterlerini tamamlanmış rescue ve rider rating verilerinden backend'de deterministik hesaplamak.
- Her badge için progress, target, earned ve earnedAt döndürmek.
- XP ve seviyeyi tamamlanan rescue sayısından üretmek.
- Eski tamamlanmış rescue kayıtlarını da hesaplamaya dahil etmek.
- Frontend statik listelerini gerçek badge API response'uyla değiştirmek.

### Nasıl Çözüldü?

- Backend'e `BadgeController`, `BadgeService` ve badge DTO'ları eklendi.
- `GET /api/badges/me` yalnızca biker rolü için badge özeti döndürüyor.
- Sekiz gerçek kriter tanımlandı: ilk rescue, 5/25/100 rescue, 5 exam rescue, helmet gereken 10 rescue, 10 gece rescue ve en az 5 review ile 4.8+ rating.
- Gece rescue hesabı uygulamanın `Europe/Istanbul` saat dilimine göre 20:00–06:00 aralığında yapılıyor.
- Kazanım tarihi, ilgili hedefi tamamlayan rescue'nun `completedAt` timestamp'inden hesaplanıyor.
- Her tamamlanmış rescue 50 XP sağlıyor; Bronze, Silver, Gold ve Platinum seviyeleri sırasıyla 0, 500, 1500 ve 3000 XP eşiklerini kullanıyor.
- Statik badge ekranı kaldırıldı; kazanılmış kartlar, kilitli kriterler, gerçek progress bar, XP ve level bilgisi API'den gösteriliyor.
- Rating kriterinde review sayısı tamamlanıp ortalama düşükse ekran açıkça `Raise rating to 4.8+` mesajı gösteriyor.
- Sürüş completion'ından sonra badge özeti yenileniyor; son 60 saniyede kazanılan badge varsa rider'a adı ve açıklamasıyla unlock penceresi gösteriliyor.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
git diff --check     başarılı
```

## 14 Temmuz 2026 — Google Maps turn-by-turn rota ve login doğrulaması

### Sorun neydi?

Biker ekranında pickup ve destination haritada marker olarak görünse de sürücünün mevcut konumundan hedefe gerçek yol tarifi başlatılamıyordu. Emülatör login denemelerinde de hatalı e-posta biçimi `auth/invalid-email`, yanlış hesap/şifre ise `auth/invalid-credential` olarak Firebase stack trace üretiyordu.

### Neden bu sorun çıktı?

Uygulama içindeki MapView yalnızca hedefi görselleştiriyordu; Google Maps navigasyonuna deep link bağlantısı kurulmamıştı. Login formu e-posta biçimini Firebase çağrısından önce doğrulamıyor ve beklenen kullanıcı hatalarını console error olarak yazıyordu.

### Çözüm yöntemi neler?

- Aktif hedef koordinatını Google Maps navigation URI ile açmak.
- Google Maps uygulaması bulunmadığında web directions URL'ine düşmek.
- Pickup ve destination aşamalarında aynı düğmenin farklı aktif hedefi kullanmasını sağlamak.
- E-postayı trim/lowercase ile normalize edip Firebase öncesi biçim doğrulaması yapmak.
- Yanlış credential durumunda biker hesabına özel anlaşılır mesaj göstermek.

### Nasıl Çözüldü?

- Biker navigasyonuna `Open in Google Maps` düğmesi eklendi.
- `accepted` aşamasında route destination olarak passenger pickup koordinatı kullanılıyor.
- `in_progress` aşamasında aynı düğme rescue destination koordinatına rota başlatıyor.
- Android'de `google.navigation:q=<lat>,<lng>&mode=d`, iOS'ta Google Maps scheme kullanılıyor; uygulama açılamazsa Google Maps web directions fallback'i devreye giriyor.
- Login e-postası küçük harfe çevriliyor ve eksik/bozuk biçim Firebase'e gönderilmeden reddediliyor.
- `invalid-credential` artık biker e-posta/şifresini veya password reset seçeneğini kontrol etmeyi söyleyen açık mesaj gösteriyor.
- Beklenen credential hatası console'a gereksiz stack trace olarak yazılmıyor.

## 15 Temmuz 2026 — Yakın place sonuçları ve dengeli klavye yerleşimi

### Sorun neydi?

Destination aramasında çoğunlukla tek sonuç çıkıyor, sonuç kullanıcıya en yakın şube olacak şekilde sıralanmıyor ve birden fazla sonuç geldiğinde ayrı bir kaydırılabilir liste alanı bulunmuyordu. Android klavyesi açıldığında bottom sheet klavyenin arkasında kalmıyordu ancak bu kez ekranın fazla yukarısına taşınıyordu.

### Neden bu sorun çıktı?

Cihaz geocoder'ı yalnızca ham sorguyla bir kez çağrılıyor ve dönen sıra doğrudan kullanılıyordu. Kullanıcının mevcut bölgesi arama bağlamına eklenmiyor, sonuçlara mesafe hesaplanmıyordu. Klavye düzeltmesinde sheet'in maksimum yüksekliği klavye üstündeki alanın neredeyse tamamını kapladığı için form görsel olarak tepeye yaslanıyordu.

### Çözüm yöntemi neler?

- Ham place sorgusu ile mevcut şehir/bölge bağlamı eklenmiş sorgunun sonuçlarını birleştirmek.
- Yinelenen koordinatları temizlemek ve Haversine mesafesiyle kullanıcıya yakınlığa göre sıralamak.
- Sonuçları sabit maksimum yüksekliğe sahip nested ScrollView içinde göstermek.
- Her sonuçta place adı, açık adres ve metre/kilometre uzaklığını ayrı göstermek.
- Klavye açıkken sheet yüksekliğini kullanılabilir alanın bir bölümünde sınırlamak.

### Nasıl Çözüldü?

- Arama, kullanıcının reverse-geocode edilmiş yerel bölgesini ikinci bir bağlam sorgusu olarak kullanıyor ve sonuçları tek listede birleştiriyor.
- Yakınlık mevcut pickup koordinatına göre hesaplanıyor; en yakın sonuç en üstte gösteriliyor.
- En fazla sekiz benzersiz sonuç 220–240 px yüksekliğinde bağımsız kaydırılabilir listede gösteriliyor.
- Place adı ana satırda, açık adres alt satırda, mesafe sağ tarafta gösteriliyor.
- Klavye açık sheet maksimum yüksekliği, klavye üstünde kalan alanın `%82`si yapıldı; böylece alan klavyenin arkasında kalmadan daha dengeli konumlanıyor.
- Ücretsiz public Nominatim servisi, resmî politikasında client-side autocomplete'i yasakladığı için projeye eklenmedi. Google Places entegrasyonu billing/API anahtarı kararı verilene kadar opsiyonel sonraki adım olarak bırakıldı.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 15 Temmuz 2026 — Tamamlanan sürüş için rider review ve yıldız sistemi

### Sorun neydi?

Sürüş tamamlandıktan sonra passenger rider'ı değerlendiremiyor, reviews sekmesi yalnızca statik örnek yorumlar gösteriyor ve rider profilindeki rating gerçek sürüşlerden güncellenmiyordu.

### Neden bu sorun çıktı?

Review için backend veri modeli, yetkilendirme kuralları ve API endpoint'i bulunmuyordu. Completion akışı doğrudan history/dashboard'a dönüyor, rescue ile review arasında tekillik ilişkisi kurulmamıştı.

### Çözüm yöntemi neler?

- Yalnızca tamamlanmış rescue'nun passenger'ına review oluşturma yetkisi vermek.
- Rescue ID'yi review belge ID'si yaparak sürüş başına tek review'u atomik garanti etmek.
- 1–5 yıldız doğrulaması ve sınırlı opsiyonel yorum alanı eklemek.
- Rider puan toplamı, puan sayısı ve ortalamasını Firestore transaction içinde güncellemek.
- Completion sonrasında passenger'ı review formuna yönlendirmek.
- Reviews sekmesini gerçek backend verisine bağlamak.

### Nasıl Çözüldü?

- Backend'e `ReviewController`, `ReviewService` ve review DTO'ları eklendi.
- `POST /api/reviews/rescue/{rescueId}` endpoint'i 1–5 yıldız ve en fazla 500 karakter yorum kabul ediyor.
- Backend rescue'nun `completed` olduğunu, token sahibinin passenger olduğunu ve atanmış rider bulunduğunu doğruluyor.
- Aynı rescue için ikinci review HTTP 409 ile reddediliyor.
- Rider'ın `ratingTotal`, `ratingCount` ve `rating` alanları review ile aynı transaction içinde güncelleniyor.
- Sürüş tamamlanınca rider'ın `totalRescues` değeri atomik artırılıyor.
- `GET /api/reviews/mine` passenger'ın gönderdiği rider değerlendirmelerini listeliyor.
- Passenger completion akışı yıldız ve yorum formuna yönlendiriliyor; yorum opsiyonel, yıldız zorunlu ve `Not now` seçeneği mevcut.
- Statik reviews sekmesi kaldırılıp rider adı, yıldız, yorum ve tarih gösteren gerçek API ekranına dönüştürüldü.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
git diff --check     başarılı
```

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 14 Temmuz 2026 — Adres önerileri ve haritadan konum seçimi

### Sorun neydi?

Destination metin alanı klavye açıldığında ekranın altında kalabiliyordu. Ayrıca kullanıcı pickup veya destination için adresin tamamını kendisi yazmak zorundaydı; arama önerisi ya da haritada nokta seçme seçeneği bulunmuyordu.

### Neden bu sorun çıktı?

Formun scroll alanı Android klavyesine göre yeniden boyutlandırılmıyordu. Adres alanları yalnızca submit sırasında geocode ediliyor, yazma sırasında sonuç üretilmiyordu. Ortak harita bileşeni de dokunma koordinatı ve seçili marker desteğine sahip değildi.

### Çözüm yöntemi neler?

- Keyboard-aware form yüksekliği ve otomatik scroll kullanmak.
- Kullanıcı yazarken debounce ile geocoding çalıştırıp reverse geocoding sonucunu öneri olarak göstermek.
- Her konum alanına harita seçimi eklemek.
- Harita dokunuşunu koordinat olarak alıp marker göstermek ve seçimi okunabilir adrese çevirmek.

### Nasıl Çözüldü?

- Android'de `KeyboardAvoidingView` height davranışı, iOS'ta padding davranışı etkinleştirildi; ScrollView klavye inset'lerini otomatik ayarlıyor.
- Üç karakterden sonra 550 ms debounce ile en fazla beş konum sonucu aranıyor ve yinelenen sonuçlar eleniyor.
- Öneriye dokunulduğunda hem adres etiketi hem koordinat saklanıyor; submit sırasında tekrar belirsiz arama yapılmıyor.
- Pickup ve destination alanlarına harita butonu eklendi.
- Tam ekran harita seçiminde kullanıcı istediği noktaya dokunabiliyor, marker ile seçimi görüyor ve `Use this location` ile onaylıyor.
- Ortak native harita bileşeni seçili koordinat, marker ve harita dokunma callback'i destekleyecek şekilde genişletildi.

### Ek düzeltme — Android klavye yüksekliğinin doğrudan uygulanması

İlk keyboard-aware düzen bazı Android cihazlarda transparent modal pencerenin yeniden boyutlandırılmaması nedeniyle yeterli olmadı. Klavyenin gerçek yüksekliği `keyboardDidShow` olayıyla ölçülüp formun alt boşluğuna doğrudan uygulanarak bottom sheet klavyenin üzerine taşındı. Görünür form yüksekliği ekran yüksekliği eksi klavye yüksekliği olarak sınırlandı ve destination odaklandığında ScrollView ilgili alana programatik olarak kaydırılıyor. Standalone Android build'leri için `softwareKeyboardLayoutMode: resize` da etkinleştirildi.

### Ek düzeltme — Place adının korunması

Adres önerisinde reverse-geocode sonucu ana etiket yapıldığı için `Erasta AVM` gibi bir place araması seçildiğinde textbox'a işletme/yer adı yerine uzun açık adres yazılıyordu. Aranan ifade artık place adı olarak korunuyor ve önerinin ana satırında gösteriliyor; açık adres yalnızca aynı isimli sonuçları ayırt etmek için ikinci satırda yardımcı bilgi olarak sunuluyor. Öneri seçildiğinde textbox ve rescue kaydında place adı kalıyor, koordinat ise seçilen sonuca ait oluyor.

## 14 Temmuz 2026 — Biker onay ekranının otomatik açılması

### Sorun neydi?

Biker dashboard backend'deki açık rescue isteğini algılıyor ve “A passenger needs help nearby” yazısını gösteriyordu fakat incoming/onay ekranı açılmıyordu. Ekrandaki işlem düğmesi de hâlâ prototipten kalan “Simulate Incoming Request” metnini taşıyordu. Incoming ekranındaki yolcu ve rota bilgileri sabit örnek veriydi.

### Neden bu sorun çıktı?

Polling sonucu yalnızca `pendingRequestId` state'ine yazılmıştı. Incoming route'una yönlendirme sadece manuel simülasyon düğmesinin `onPress` fonksiyonunda bulunuyordu; yeni istek algılanmasına bağlı bir yönlendirme yoktu.

### Çözüm yöntemi neler?

- Yeni bir request ID ilk kez görüldüğünde incoming ekranını otomatik açmak.
- Polling devam ederken aynı ekranın tekrar tekrar açılmasını request ID ile engellemek.
- Manuel tekrar görüntüleme düğmesini korumak.
- Incoming ekranında rescue detayını API'den getirip gerçek veriyi göstermek.

### Nasıl Çözüldü?

- Dashboard polling akışı yeni request ID için `/(biker)/incoming` route'una otomatik yönlendirme yapıyor.
- Son gösterilen ID ref içinde tutulduğu için aynı istek yalnızca bir kez otomatik açılıyor.
- Düğme adı `View Rescue Request` olarak değiştirildi ve manuel yeniden açma davranışı korundu.
- Incoming ekranı `/api/rescues/{requestId}` üzerinden gerçek yolcu adı, pickup koordinatı, destination place adı, urgency ve helmet ihtiyacını gösteriyor.
- Kabul süresi daha kullanılabilir olması için 15 saniyeden 30 saniyeye çıkarıldı.
- Kabul hataları ekranı sessizce kapatmak yerine kullanıcıya gerçek API hata mesajını gösteriyor.

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

## 14 Temmuz 2026 — Aday biker'ın incoming rescue detayına erişimi

### Sorun neydi?

Biker dashboard açık rescue isteğini listeleyebiliyor ve incoming ekranını açabiliyordu ancak ekran `/api/rescues/{requestId}` detayını istediğinde backend HTTP 403 Forbidden dönüyordu.

### Neden bu sorun çıktı?

Rescue detay endpoint'i yalnızca `passengerId` veya `bikerId` ile eşleşen katılımcılara izin veriyordu. İstek henüz `searching` durumundayken hiçbir biker atanmamış olduğu için `bikerId` null'dı. Böylece backend bir taraftan biker'a açık isteği listeliyor, diğer taraftan karar vermesi için gereken detayı yasaklıyordu.

### Çözüm yöntemi neler?

- Incoming ekranına liste response'unu route parametresiyle taşımak.
- Açık isteğin detayını tüm kimliği doğrulanmış kullanıcılara açmak.
- Yalnızca biker rolündeki kullanıcıya, yalnızca `searching` ve süresi dolmamış istek için kontrollü detay erişimi vermek.

### Nasıl Çözüldü?

- Detay yetkilendirmesine sınırlı “candidate biker” kuralı eklendi.
- Passenger ve atanmış biker katılımcı olarak her zamanki erişimini koruyor.
- Katılımcı olmayan kullanıcı ancak profili `biker` rolündeyse, istek hâlâ `searching` durumundaysa ve süresi dolmamışsa detayı görebiliyor.
- Kabul, başlatma ve tamamlama sahiplik kuralları değiştirilmedi; detay görmek isteği kabul etme yetkisi sağlamıyor.

## 14 Temmuz 2026 — Kabul sonrası rescue akışının iki taraf için tamamlanması

### Sorun neydi?

Backend kabul, başlatma ve tamamlama durumlarını desteklese de passenger ve biker ekranları bu durumları tam yansıtmıyordu. Passenger ekranında sabit biker, rota, süre ve sahte safety code vardı. Biker navigasyonu sabit pickup/destination metinleri gösteriyordu. Uygulama yenilenirse aktif rescue kayboluyor, geçmiş ekranları devam eden istekleri yanlışlıkla iptal edilmiş gibi gösteriyordu.

### Neden bu sorun çıktı?

Backend durum makinesi ile ilk UI prototipinde kullanılan `arriving/active` state adları eşleşmiyordu. Ekranlar API response'unun yalnızca küçük bir bölümünü kullanıyor ve route state'inin uygulama ömrü boyunca korunacağını varsayıyordu. Pickup için okunabilir etiket backend modelinde ayrıca saklanmıyordu.

### Çözüm yöntemi neler?

- Frontend'i backend'in `searching -> accepted -> in_progress -> completed` durum makinesiyle birebir eşlemek.
- Her iki cihazın rescue detayını düzenli yenileyerek durum değişikliklerini algılamasını sağlamak.
- Pickup ve destination etiket/koordinatlarını gerçek haritalarda göstermek.
- Kritik start/complete işlemlerinden önce kullanıcı onayı almak.
- Uygulama yeniden açıldığında kullanıcıya ait aktif rescue'yu backend'den geri yüklemek.
- Geçmişte yalnızca terminal durumları göstermek ve süreyi backend timestamp'lerinden hesaplamak.

### Nasıl Çözüldü?

- Rescue modeline `pickupLabel` eklendi; eski kayıtlar koordinat etiketiyle geriye uyumlu okunuyor.
- Passenger arama ekranı gerçek biker adını gösteriyor ve `in_progress` durumunda ride ekranına geçiyor.
- Passenger ride ekranı biker'ın geliş/sürüş durumunu, gerçek destination place adını ve harita marker'ını gösteriyor.
- Biker navigasyonu önce gerçek pickup'a, start işleminden sonra gerçek destination'a geçiyor.
- Start ve complete düğmelerine yanlış dokunmayı önleyen doğrulama pencereleri eklendi.
- Passenger iptali biker ekranında algılanıyor; completed durumu iki tarafta da başarı mesajı ve history/dashboard seçeneği gösteriyor.
- `GET /api/rescues/active` endpoint'i eklendi. Passenger ve biker dashboard uygulama yenilendiğinde devam eden akışı otomatik geri yüklüyor.
- Devam eden rescue kayıtları geçmişten filtrelendi; tamamlanan sürüş süresi `startedAt` ve `completedAt` farkından hesaplanıyor.
- API istemcisi boş başarılı response gövdelerini güvenli işliyor.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
git diff --check     başarılı
```

### Test ve doğrulama

```text
npx tsc --noEmit  başarılı
npm run lint      başarılı — 0 hata, 0 uyarı
git diff --check  başarılı
```

Frontend kaynaklarında doğrudan Firestore veya Firebase Storage çağrısı kalmadığı doğrulandı. Çalışma `feat/backend-api-consolidation` branch'inde yapıldı.

## 14 Temmuz 2026 — Backend portunun 8083'e taşınması

### Sorun neydi?

Spring Boot backend varsayılan `8080` portunda başlamaya çalışıyordu fakat bu port başka bir süreç tarafından kullanıldığı için uygulama başlatılamıyordu.

### Neden bu sorun çıktı?

TCP üzerinde aynı IP ve port birleşimini aynı anda yalnızca bir süreç dinleyebilir. Spring Boot'ta ayrıca bir port belirtilmezse gömülü web sunucusu varsayılan olarak `8080` kullanır. Port dolu olduğunda sunucu bind işlemi başarısız olur.

### Çözüm yöntemi neler?

- `8080` portunu kullanan süreci kapatmak.
- Backend'i boş bir porta taşımak.
- Portu environment değişkeniyle yapılandırılabilir tutmak.
- Frontend API adreslerini backend'in yeni portuyla eşlemek.

### Nasıl Çözüldü?

- Backend varsayılan portu `server.port=${SERVER_PORT:8083}` ile `8083` yapıldı.
- Gerektiğinde `SERVER_PORT` environment değişkeniyle farklı port kullanılabilmesi sağlandı.
- Frontend'in web/iOS, Android emulator ve örnek environment API adresleri `8083` olarak güncellendi.
- Backend README yapılandırma bilgisi yeni portu gösterecek şekilde düzeltildi.

## 14 Temmuz 2026 — Firebase Admin proje kimliğinin açıkça yapılandırılması

### Sorun neydi?

Application Default Credentials oluşturulduktan sonra backend kimlik bilgisini bulabiliyor, fakat Firestore istemcisi hangi Google Cloud/Firebase projesine bağlanacağını belirleyemediği için uygulama başlangıcı duruyordu.

### Neden bu sorun çıktı?

`gcloud config set project` yalnızca gcloud CLI'ın aktif yapılandırmasını değiştirir. Firebase Admin SDK tarafından okunan Application Default Credentials dosyasının her türü proje ID bilgisini doğrudan taşımaz. Bu nedenle geçerli kimlik bilgisi bulunmasına rağmen Firestore için ayrıca proje ID gerekir.

### Çözüm yöntemi neler?

- Her terminal oturumunda `GOOGLE_CLOUD_PROJECT` environment değişkenini tanımlamak.
- Service account kimliği kullanarak proje bilgisinin credential üzerinden gelmesini sağlamak.
- Proje ID'sini uygulama yapılandırmasından `FirebaseOptions` nesnesine açıkça aktarmak.

### Nasıl Çözüldü?

- `firebase.project-id` ayarı eklendi ve varsayılan değer `motorescue-d4abc` olarak tanımlandı.
- Ayar sırasıyla `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT` veya varsayılan proje ID değerinden okunacak şekilde yapılandırıldı.
- `FirebaseConfig`, proje ID'sini `FirebaseOptions.setProjectId` ile Admin SDK'ya açıkça iletiyor.
- README içine `FIREBASE_PROJECT_ID` yapılandırması eklendi.

## 14 Temmuz 2026 — Fiziksel cihazdan backend'e erişim hatasının düzeltilmesi

### Sorun neydi?

Firebase ile giriş tamamlandıktan sonra profil rolünü okumak için yapılan backend isteği `TypeError: Network request failed` hatası veriyordu. Backend `8083` portunda çalışmasına ve bilgisayardan erişilebilmesine rağmen mobil uygulama API'ye ulaşamıyordu.

### Neden bu sorun çıktı?

Frontend Android için varsayılan olarak `10.0.2.2:8083` kullanıyordu. `10.0.2.2`, yalnızca Android emülatörünün ana bilgisayara erişmek için sunduğu özel adrestir. Expo Go ile çalışan fiziksel telefonda bu adres bilgisayarı göstermez. Benzer şekilde telefondaki `localhost` da geliştirme bilgisayarı değil telefonun kendisidir.

### Çözüm yöntemi neler?

- Fiziksel cihazda bilgisayarın LAN IP adresini `EXPO_PUBLIC_API_URL` ile açıkça vermek.
- Geliştirme ortamında Expo Metro sunucusunun host adresini okuyup backend adresini otomatik üretmek.
- Web, Android emülatörü ve production ortamı için güvenli fallback adreslerini korumak.
- Ham `Network request failed` yerine denenen API adresini içeren açıklayıcı hata göstermek.

### Nasıl Çözüldü?

- API adres çözümleyicisi Expo'nun `hostUri` bilgisinden geliştirme bilgisayarının erişilebilir adresini alıp `http://<metro-host>:8083` oluşturacak şekilde güncellendi.
- `EXPO_PUBLIC_API_URL` tanımlıysa en yüksek öncelikle kullanılmaya devam ediyor.
- Web için `localhost:8083`, Android emülatörü için `10.0.2.2:8083` fallback'leri korundu.
- Ağ hataları artık kullanılan backend adresini ve aynı ağ kontrolünü kullanıcıya bildiriyor.
- Login ekranı backend kaynaklı hata mesajını genel giriş hatasıyla gizlemek yerine gösteriyor.
- Backend'in hem localhost hem LAN arayüzünden `8083` üzerinde yanıt verdiği doğrulandı.
- Kullanıcı ve rescue API çağrıları yeniden tarandı; frontend ve backend endpoint sözleşmelerinin eşleştiği doğrulandı.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
LAN :8083 erişimi    başarılı
git diff --check     başarılı
```

## 14 Temmuz 2026 — Rescue konum ve urgency seçimlerinin işlevsel hâle getirilmesi

### Sorun neydi?

Passenger rescue formundaki pickup ve destination alanları sabit metinlerden oluşuyordu ve kullanıcı tarafından değiştirilemiyordu. Form gönderildiğinde pickup her zaman cihaz GPS'inden yeniden alınıyor, destination ise kod içine yazılmış sabit bir ad olarak backend'e gönderiliyordu. Urgency alanına dokunulduğunda seçenek listesi açılmak yerine iki değer arasında anında geçiş yapıyordu.

### Neden bu sorun çıktı?

Form ilk aşamada görsel prototip olarak hazırlanmış, alanların seçim state'i ve adres çözümleme davranışı uygulanmamıştı. Backend modeli de destination için yalnızca açıklama metni saklıyor, hedef koordinatlarını taşımıyordu. Bu nedenle UI gerçek bir rota talebi üretemiyordu.

### Çözüm yöntemi neler?

- Pickup için mevcut GPS konumu ile manuel adres arasında açık seçim sunmak.
- GPS koordinatını reverse geocoding ile okunabilir adrese dönüştürmek.
- Manuel pickup ve destination adreslerini geocoding ile koordinata çevirmek.
- Urgency alanında seçenekleri görünür bir liste olarak göstermek ve yalnızca seçilen değeri kaydetmek.
- Destination koordinatlarını API ve Firestore modeline eklemek.

### Nasıl Çözüldü?

- Pickup bölümüne `My location` ve `Enter address` seçenekleri eklendi.
- Mevcut konum seçildiğinde GPS koordinatı ve okunabilir adres gösteriliyor.
- Manuel pickup ve destination için düzenlenebilir metin alanları eklendi; belirsiz veya bulunamayan adreslerde istek gönderilmiyor ve açıklayıcı hata gösteriliyor.
- Urgency alanı altı seçenekli açılır listeye dönüştürüldü: akademik, sağlık, iş/görüşme, seyahat, resmi randevu ve diğer acil ihtiyaç.
- Form gönderimi sırasında pickup ve destination koordinatları çözülüp backend'e gönderiliyor.
- `CreateRescueRequest`, `RescueResponse` ve Firestore rescue belgesi destination koordinatlarını içerecek şekilde genişletildi.
- Eski Firestore kayıtlarında destination koordinatı bulunmaması response dönüşümünde geriye uyumlu olarak ele alındı.

### Test ve doğrulama

```text
mvnw.cmd clean test  başarılı — 5 test
npx tsc --noEmit     başarılı
npm run lint         başarılı — 0 hata, 0 uyarı
git diff --check     başarılı
```
## 15 Temmuz 2026 — Passenger arama ekranındaki sabit biker sayısının kaldırılması

Passenger rescue oluşturulduktan sonra arama ekranı, backend gerçek bir bildirim alıcısı sayısı döndürmediği hâlde `2 bikers alerted nearby` yazıyordu. Ayrıca ekrandaki zone açıklaması backend'in kullandığı 6 km yerine 3 km gösteriyordu.

- Sabit biker sayısı kaldırılarak `Nearby verified bikers alerted` durum metni kullanıldı.
- Arama yarıçapı açıklaması backend ile uyumlu olacak şekilde 6 km olarak güncellendi.

## 15 Temmuz 2026 — Passenger rescue akışındaki dinamik biker verileri ve gerçek harita

Passenger rescue oluşturulduktan sonraki searching, active ride ve review ekranları biker'ın profil fotoğrafı yerine sabit motosiklet emojisi gösteriyordu. Searching ekranının arka planı gerçek harita yerine çizgilerden oluşan bir mock'tu. Passenger history içinde kullanılmayan örnek sürüşler bulunuyor ve gerçek review puanları her kayıt için `null` atanıyordu.

- Biker rescue isteğini kabul ederken güncel `profilePhotoPath` rescue kaydına ekleniyor ve `RescueResponse` üzerinden passenger'a dönüyor.
- Ortak, salt okunur `ProfileAvatar` bileşeni Firebase Storage yolunu gerçek fotoğrafa çeviriyor; fotoğraf yoksa motosiklet simgesine geri düşüyor.
- Searching, ride, review ve passenger history ekranları biker'ın gerçek profil fotoğrafını gösteriyor.
- Searching ekranındaki mock çizgiler kaldırıldı; gerçek pickup koordinatını gösteren `LocationMap` eklendi.
- Passenger history, rescue history ile kullanıcının review listesini `rescueId` üzerinden eşleştirerek gerçek puanı gösteriyor.
- Kullanılmayan örnek passenger sürüş kayıtları tamamen kaldırıldı.

### Doğrulama

```text
mvnw.cmd test       başarılı — 9 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```

## 15 Temmuz 2026 — Düzenlenebilir iletişim telefonu ve biker online kontrolü

Kayıt sırasında telefon numarası alınmasına rağmen biker ve passenger profil düzenleme ekranlarında numarayı sonradan ekleme veya değiştirme alanı bulunmuyordu. Eski biker hesapları telefon alanı olmadan online olabildiği için passenger arama düğmesi kullanılamayabiliyordu.

- Backend profil güncelleme sözleşmesine doğrulanan `phone` alanı eklendi; yalnızca isteğe bağlı `+` ve 7–15 rakam kabul ediliyor.
- Biker ve passenger profil ekranları mevcut numarayı yüklüyor, düzenlemeye ve backend'e kaydetmeye izin veriyor.
- Geçerli iletişim numarası bulunmayan biker'ın online olma talebi backend tarafından reddediliyor.
- Profil kaydetme hatalarında backend'in açıklayıcı mesajı kullanıcıya gösteriliyor.
- Telefon uygunluğu için backend birim testi eklendi.

### Doğrulama

```text
mvnw.cmd test       başarılı — 10 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```

## 15 Temmuz 2026 — Rescue akışında iki yönlü profil fotoğrafı

Rescue modelinde yalnızca biker profil fotoğrafı yolu bulunuyor ve bu alan kabul sırasında kaydediliyordu. Passenger profil fotoğrafı rescue oluşturulurken taşınmadığı için biker incoming request, navigation ve history ekranları gerçek fotoğraf yerine sabit emoji gösteriyordu.

- Passenger rescue oluşturduğunda güncel `profilePhotoPath` rescue belgesine kaydediliyor.
- `RescueResponse` ve frontend `RescueRequest` sözleşmelerine `passengerProfilePhotoPath` eklendi.
- Biker incoming request, navigation ve history ekranları ortak `ProfileAvatar` bileşeniyle passenger'ın gerçek fotoğrafını gösteriyor.
- Passenger tarafındaki biker fotoğraf akışı korunarak iki yönlü görüntüleme tamamlandı.
- Fotoğrafı olmayan hesaplarda rol bazlı emoji fallback'i kullanılmaya devam ediyor.

### Doğrulama

```text
mvnw.cmd test       başarılı — 10 test
npx tsc --noEmit    başarılı
npm run lint        başarılı — 0 hata, 0 uyarı
git diff --check    başarılı
```
