# MotoRescue Değişiklik Günlüğü

Bu belge projede yapılan teknik değişiklikleri, değişikliklerin gerekçelerini ve doğrulama sonuçlarını kalıcı olarak kayıt altına alır. Yeni çalışmalar tarih sırasıyla bu dosyaya eklenecektir.

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
