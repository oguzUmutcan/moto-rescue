# MotoRescue Session Handoff

Son güncelleme: 15 Temmuz 2026, PC yeniden başlatılmadan hemen önce  
Workspace: `C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue`

## Kullanıcının çalışma kuralları

- Her değişiklik kökteki `DEGISIKLIK_GUNLUGU.md` dosyasına kaydedilmeli.
- Değişiklikler feature branch üzerinde commit edilip pushlanmalı; doğrudan `master` kullanılmamalı.
- Firebase service-account JSON ve gerçek secret değerleri repoya eklenmemeli. `google-services.json` Android istemci yapılandırmasıdır ve bu çalışmada repoya eklendi.
- Kullanıcı genellikle fiziksel telefonu passenger, Android emülatörünü biker olarak test ediyor.
- Kullanıcı bu session sonunda PC'yi yeniden başlatacak; SMS akışı için hiçbir manuel test yapılmadı.

## Git durumu

- Remote: `https://github.com/oguzUmutcan/moto-rescue.git`
- Aktif branch: `feat/backend-api-consolidation`
- Son push edilen commit: `cffd367 feat: verify registrations with Firebase SMS`
- Son önemli commitler:
  - `cffd367` Firebase SMS ile kayıt telefonu doğrulaması
  - `4a5cd6c` rescue akışında iki yönlü profil fotoğrafları
  - `17bb10a` profil iletişim telefonu ve online kontrolü
  - `c583ca1` passenger'ın atanmış biker'ı araması
  - `cb3dc30` passenger rescue detayları, gerçek harita/review/fotoğraf
  - `4672a8f` sabit biker alert sayısının kaldırılması
  - `fb54948` 6 km zone ve canlı biker konumu
- Çalışma ağacında yalnızca backend restart sırasında üretilen şu untracked loglar olabilir; commit edilmemeli:
  - `moto-rescue-backend/backend.stdout.log`
  - `moto-rescue-backend/backend.stderr.log`

## Güncel mimari

- Frontend: Expo SDK 54, React Native, Expo Router.
- Backend: Spring Boot 4.1, Java 21+, Firebase Admin ve Firestore; varsayılan port `8083`.
- Firebase JS SDK mevcut email/password oturumu, Firebase Storage ve API tokenları için kullanılmaya devam ediyor.
- Firebase Phone Auth için native `@react-native-firebase/app` ve `@react-native-firebase/auth` eklendi.
- Native modüller nedeniyle uygulama artık SMS testi için Expo Go ile çalışmaz; Expo development build gerekir.
- Profil, rol, rescue, review, badge ve online uygunluğu backend-authoritative.
- Rescue zone yarıçapı 6 km; biker konum freshness sınırı 2 dakika.
- Rescue state: `searching -> accepted -> in_progress -> completed`; passenger sürüş başlamadan önce iptal edebilir.

## SMS kayıt akışı — kod tamamlandı, cihaz testi yapılmadı

`moto-rescue-frontend/app/(auth)/verify-creds.tsx` iki aşamalı hâle getirildi:

1. Firebase Phone Auth ile SMS kodu gönderilir.
2. Kullanıcı 6 haneli kodu girer; yeniden gönderme için 60 saniye bekleme vardır.
3. Kod doğrulanınca native telefon kullanıcısı oluşur.
4. Email/password credential aynı Firebase kullanıcısına `linkWithCredential` ile bağlanır.
5. Native oturum kapatılır; Firebase JS SDK aynı email/password ile aynı UID'ye giriş yapar.
6. ID token yenilenir ve backend profili oluşturulur.
7. Backend `UserService.create` Firebase ID token içindeki doğrulanmış `phone_number` claim'ini zorunlu tutar ve request numarasıyla birebir eşleştirir.

Doğrulanmış telefon profil ekranlarında salt okunur. Numara değiştirmek için ileride ayrı bir yeniden SMS doğrulama akışı gerekir.

### Firebase/Expo yapılandırması

- Android package: `com.oguzumutcan.motorescue`
- `moto-rescue-frontend/google-services.json` mevcut ve commit edildi.
- `app.json` içinde `android.googleServicesFile` tanımlı.
- Expo pluginleri:
  - `@react-native-firebase/app`
  - `@react-native-firebase/auth`
- Development client: `expo-dev-client`
- EAS project ID: `c9089634-a2e3-4fdd-980f-cf5d278e8087`

Firebase Console'da kullanıcı tarafından ayrıca doğrulanması gerekenler:

- Authentication > Sign-in method > Phone etkin olmalı.
- Authentication > Settings > SMS region policy içinde test ülkesi açık olmalı.
- Android SHA-1/SHA-256 fingerprint'leri development build imzasından alınıp Firebase Android app'e eklenmeli. Bu henüz yapılmadı.

## EAS development build durumu

- Build ID: `2cf0915d-6907-42d1-9e9e-144f8b572537`
- Son kontrol edilen durum: `IN_QUEUE`
- Commit: `cffd367c9044e987164d6941d6bc393679250617`
- Build sayfası: `https://expo.dev/accounts/oguzumutcan/projects/moto-rescue/builds/2cf0915d-6907-42d1-9e9e-144f8b572537`

PC açıldıktan sonra durum kontrolü:

```powershell
cd "C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue\moto-rescue-frontend"
npx eas-cli build:view 2cf0915d-6907-42d1-9e9e-144f8b572537
```

Build tamamlanırsa APK'yı indirip emülatöre kur. Ardından development server:

```powershell
npx expo start --dev-client --clear --lan
```

Yerel `npx expo run:android` denendi ancak önce Java 25 uyumsuzluğu, sonra eksik Android SDK path ve son olarak internet kesintisi/Google Maven indirme hatası yaşandı. Android Studio JBR Java 21 uyumlu:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

Generated `android/` klasörü `.gitignore` kapsamındadır. Yerel SDK yolu `android/local.properties` içine yazılmıştı ancak PC/re-prebuild sonrasında gerekirse tekrar oluşturulabilir:

```text
sdk.dir=C:\\Users\\umuto\\AppData\\Local\\Android\\Sdk
```

## PC yeniden başladıktan sonra çalışma sırası

1. `session_handoff.md` ve `DEGISIKLIK_GUNLUGU.md` son bölümlerini oku.
2. `git status`, branch ve `cffd367` commit'ini doğrula.
3. EAS build durumunu yukarıdaki komutla kontrol et.
4. Firebase Console'da Phone provider ve SMS region policy ayarlarını kullanıcıyla doğrula.
5. Build bittiyse development APK'yı emülatöre kur.
6. Build imzasının SHA-1/SHA-256 fingerprint'lerini Firebase Android app'e ekle.
7. Backend'i güncel environment değişkenleriyle `8083` portunda başlat.
8. Metro'yu `npx expo start --dev-client --clear --lan` ile başlat.
9. Önce Firebase test phone number/code ile, sonra gerçek numarayla kayıt testini yap.
10. Şu durumları doğrula: SMS gönderme, yanlış kod, doğru kod, resend cooldown, email çakışması, aynı telefon çakışması, backend profile create, role selection ve tekrar login.
11. Test sonuçlarını `DEGISIKLIK_GUNLUGU.md` ve bu handoff dosyasına kaydet; gerekiyorsa düzeltme commit/push yap.

## Çalıştırma komutları

Backend (PC restart sonrası environment değerleri yeni terminale aktarılmalı):

```powershell
cd "C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue\moto-rescue-backend"
.\mvnw.cmd spring-boot:run
```

Gerekli backend environment değişkenleri kullanıcı environment'ında kayıtlı olmalı:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_PROJECT` veya `FIREBASE_PROJECT_ID`
- `GOOGLE_MAPS_API_KEY`
- Backend varsayılan portu: `8083`

Kontroller:

```powershell
cd moto-rescue-backend
.\mvnw.cmd test

cd ..\moto-rescue-frontend
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Son doğrulanan otomatik sonuçlar:

- Backend: 11 test, 0 failure/error.
- TypeScript: başarılı.
- ESLint: 0 hata, 0 uyarı.
- Expo Doctor: 18/18 başarılı.
- Expo config: başarılı.
- Gerçek SMS/device testi: **yapılmadı**.
- Development APK: **henüz doğrulanmadı; EAS build sırada**.

## Son dönemde tamamlanan diğer özellikler

- 6 km içindeki online/fresh biker'lar rescue görebilir ve kabul edebilir.
- Biker foreground konumu backend'e yayınlanır; passenger canlı biker marker'ını görür.
- Ehliyet iki yüzü yüklenmeden ve otomatik 1 dakikalık doğrulama tamamlanmadan biker online olamaz.
- Biker için geçerli iletişim telefonu yoksa online olamaz.
- Passenger accepted aşamasında biker'ı telefon uygulamasıyla arayabilir.
- Passenger ve biker profil fotoğrafları rescue oluşturma/kabul sırasında rescue belgesine snapshot olarak kaydedilir ve karşı tarafa gösterilir.
- Passenger searching ekranı gerçek pickup haritası gösterir; sabit 2 biker/3 km metinleri kaldırıldı.
- Passenger history gerçek review puanını, süreyi ve biker fotoğrafını gösterir; örnek veriler kaldırıldı.
- Boarding code backend tarafından üretilir ve biker start sırasında doğrulanır.
- Badge, profile stats, rescue history ve community reviews backend verisine bağlıdır.

## Bilinen önemli sınırlamalar

- Push notification henüz yok; rescue keşfi polling ile çalışıyor.
- Foreground dışı canlı location tracking yok.
- Uygulama içi rota/polyline ve gerçek ETA yok; Google Maps deep link kullanılıyor.
- Incoming ekranında bazı prototip sabitleri hâlâ olabilir (ör. rating/ETA/distance); ayrıca taranmalı.
- SMS özelliği Expo Go'da çalışmaz.
- Eski Firebase kullanıcılarının token'ında `phone_number` claim'i yoktur; yeni zorunlu kayıt akışını test etmek için yeni hesap kullanılmalı veya ayrı migration/reverification uygulanmalı.
- EAS build tamamlanmadan ve SHA fingerprint Firebase'e eklenmeden gerçek SMS başarısı varsayılmamalı.
