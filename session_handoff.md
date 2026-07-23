# MotoRescue Session Handoff

## 23 Temmuz 2026 - English/Turkish Localization

- English and Turkish can now be selected on the first onboarding screen and in
  both passenger and biker profile/settings screens. Changes apply immediately.
- The selected language is stored in SecureStore and in each Firestore user
  profile. Existing profiles without the field are migrated on their next login.
- After a clean reinstall, the app initially uses the device language because
  Android removes app-local SecureStore data; the saved Firestore preference is
  restored as soon as the user signs in.
- Screens, tabs, alerts, placeholders, dates, Firebase/backend errors, and
  server-generated rescue push notifications are localized.
- Validation passed: 11 frontend tests, 22 backend tests, TypeScript, lint, Expo
  Doctor 18/18, Android Metro export, and `git diff --check`.
- The backend was restarted from `C:\src\MotoRescue` and is listening on port
  8083 with PID `29052`.

## 23 Temmuz 2026 - Rescue Restoration and Push Reliability

- Authoritative checkout remains `C:\src\MotoRescue`; do not run native Android
  builds from the long Desktop path.
- Passenger and biker dashboards now reload the active rescue on focus and expose
  only a real, resumable request. Swiping back no longer strands either role.
- Repeated notification responses are deduplicated, route pushes use canonical
  navigation destinations, and focus-sensitive polling/timers stop off-screen.
- Signed-in users are restored to the dashboard for their backend role.
- Registration now has tested Firebase-user cleanup if backend profile creation
  fails, plus a friendly duplicate-email error.
- Expo push HTTP 200 responses are no longer assumed to mean delivery. The backend
  parses tickets, stores ticket IDs in `pushNotificationReceipts`, checks receipts
  after 15 minutes, expires pending checks after 24 hours, and conditionally removes
  stale `DeviceNotRegistered` tokens.
- Android Firebase config is restored through
  `moto-rescue-frontend/google-services.json` and `android.googleServicesFile`.
- Automated validation: 18 backend tests and 6 frontend tests pass; TypeScript,
  lint, Expo Doctor (18/18), and `git diff --check` pass.
- npm audit high findings were reduced from 4 to 0 with compatible transitive
  patches. The remaining 21 moderate findings require an Expo/NativeWind migration;
  see `DEPENDENCY_AUDIT.md`.
- Still manual: accepted/started/completed/cancelled push delivery across two
  devices and one cold-start login restoration check.
- Reviews are now private to the signed-in user: passengers see reviews they
  wrote and bikers see reviews they received. The former global latest-review
  feed was removed.
- Authenticated users can search verified bikers from the Reviews tab and open a
  public biker profile. Public profiles show biker-owned profile fields,
  anonymized reviews, and sanitized completion history without passenger IDs,
  photos, contact data, coordinates, route labels, or rescue IDs.

## 22 Temmuz 2026 - Android Maps ve Development Build Durumu

- Android `MapView` acilisindaki `API key not found` crash'i giderildi.
- `moto-rescue-frontend/app.config.js`, Maps key'ini `GOOGLE_MAPS_ANDROID_API_KEY` veya `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` ortam degiskeninden alip `expo.android.config.googleMaps.apiKey` alanina yaziyor.
- Aktif yerel degisken `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`. Key'in sonundaki hatali `p` karakteri kaldirildi; key degeri bu dosyaya yazilmamalidir.
- Expo SDK 54 ile uyumlu `react-native-maps` surumu `1.20.1`. Bu surum ayri bir Expo config plugin export etmedigi icin `expo.plugins` altina `react-native-maps` eklenmemeli; SDK 54'un dahili Maps entegrasyonu `android.config.googleMaps.apiKey` uzerinden manifest metadata'sini uretiyor.
- Uretilen `AndroidManifest.xml` icinde `com.google.android.geo.API_KEY` metadata'si ve duzeltilmis key dogrulandi.
- Yerel x86_64 debug APK basariyla olusturuldu, `emulator-5554` uzerine kuruldu ve acildi. Logcat'te `FATAL EXCEPTION`, `API key not found` veya MotoRescue process crash gorulmedi.
- Emulator'daki onceki APK farkli imzaya sahip oldugu icin kaldirildi; emulator-local uygulama verisi sifirlandi.

### Zorunlu Yerel Calisma Yolu ve Toolchain

- Eski Desktop yolu native CMake/Ninja path limitini asiyor. Frontend artik fiziksel olarak kisa checkout'tan calistirilmalidir: `C:\src\MotoRescue\moto-rescue-frontend`.
- `subst` ile drive alias kullanilamaz; React Native codegen gercek `C:` yollarini cozup mixed-root hatasi uretiyor.
- Eski `C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue` kopyasindan Android build baslatilmamali. IDE yeni `C:\src\MotoRescue` klasorunde acilmalidir.
- Sistem Java 25 ile `com.facebook.react.settings` cozumlemesi Kotlin tarafinda `IllegalArgumentException: 25.0.3` ile kiriliyor. Android Studio JBR (Java 21) kullanilmali.
- Gerekli PowerShell ortam ayarlari:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

### EAS Internal Development Build

- `eas.json` development profili dogru: `developmentClient: true`, `distribution: internal`, Android `buildType: apk`.
- Firebase icin 6 ve Google Maps icin 1 olmak uzere toplam 7 adet `EXPO_PUBLIC_*` degisken, EAS `development` environment'ina `sensitive` visibility ile kaydedildi.
- Android internal development build ID: `8855d994-1317-4523-b393-3c0be42f96c9`.
- Build sayfasi: https://expo.dev/accounts/oguzumutcan/projects/moto-rescue/builds/8855d994-1317-4523-b393-3c0be42f96c9
- Bu handoff guncellenirken build durumu `IN_QUEUE`. Tamamlaninca ayni install URL/QR iki Android cihaza da kurulabilir.
- Development client kurulduktan sonra Metro yeni kisa yoldan baslatilmali:

```powershell
cd C:\src\MotoRescue\moto-rescue-frontend
npx expo start --dev-client --lan --port 8082
```
- EAS upload arsivi 341 MB idi. Build icin gereksiz `dist` ve diger uretilen dosyalar daha sonra `.easignore` ile dislanmali.

## 16 Temmuz 2026 - Guncel Durum

Zorunlu Firebase SMS kaydi kaldirildi. Bootloader acik/rootlu cihazlarin Firebase Play Integrity kontrolu nedeniyle kayit disi kalmasi urun gereksinimine uygun bulunmadi. Kayit akisi yeniden Firebase JS SDK email/password hesabi + backend profil olusturma modeline donduruldu.

Telefon numarasi artik dogrulanmis kimlik kaniti degil, profil iletisim verisidir. Yeni profiller `phoneVerified: false` ile olusur. Gelecekte telefon dogrulamasi gerekiyorsa Play Integrity'ye bagli olmayan ayri bir backend OTP saglayicisi tasarlanmalidir.

## Guncel Calisma Bicimi

- `moto-rescue-frontend/app/(auth)/verify-creds.tsx` SMS istemez. Kullanici bilgilerini onaylayinca Firebase email/password hesabini ve backend profilini olusturur.
- Backend `UserService.create`, Firebase ID token icinde `phone_number` claim'i zorunlu tutmaz.
- Passenger ve biker profil ekranlarinda iletisim telefonu tekrar duzenlenebilir.
- `@react-native-firebase/app` ve `@react-native-firebase/auth` kaldirildi. `expo-dev-client`, Android Maps/push ve coklu cihaz development testi icin yeniden projede mevcut.
- Expo config'ten RNFirebase pluginleri ve `android.googleServicesFile` kaldirildi.
- `moto-rescue-frontend/google-services.json` repodan silindi.
- `npm start`, `expo start --go --lan` calistirir ve Expo Go ile temel akislarda kullanilabilir. Native Maps metadata, remote push ve iki cihaz testi icin development APK + `npm run start:dev-client` gerekir.
- Onceki native SMS APK'si `application-e2860996-767e-42d7-8720-55ad9e3deb75.apk` yalnizca yerel untracked dosyadir ve commit edilmemelidir.

## Git Durumu

- Remote: `https://github.com/oguzUmutcan/moto-rescue.git`
- Aktif branch: `feat/backend-api-consolidation`
- Son gorulen commitler:
  - `c70eee1 feat: add rescue push notifications`
  - `9af65e4 docs: clean handoff formatting`
  - `d1102ba docs: refresh SMS verification handoff`
  - `cffd367 feat: verify registrations with Firebase SMS`
  - `4a5cd6c fix: show profile photos across rescue flow`
  - `17bb10a feat: manage profile contact phone`
- Calisma agacinda commitlenmemis degisiklikler var.
- Commit edilmemesi gereken yerel dosyalar:
  - `application-e2860996-767e-42d7-8720-55ad9e3deb75.apk`
  - `moto-rescue-backend/backend.stdout.log`
  - `moto-rescue-backend/backend.stderr.log`

## Guncel Mimari

- Frontend: Expo SDK 54, React Native, Expo Router.
- Backend: Spring Boot 4.1, Java 21+, Firebase Admin ve Firestore; varsayilan port `8083`.
- Firebase JS SDK email/password oturumu, Firebase Storage ve API tokenlari icin kullanilmaya devam ediyor.
- Profil, rol, rescue, review, badge ve online uygunlugu backend-authoritative.
- Rescue zone yaricapi 6 km.
- Biker konum freshness siniri 2 dakika.
- Rescue state: `searching -> accepted -> in_progress -> completed`.
- Passenger, surus baslamadan once rescue istegini iptal edebilir.

## Son Dogrulama

Bu dogrulamalar 16 Temmuz'da zorunlu SMS kaldirildiktan sonraki otomatik kontroldur; 22 Temmuz Android build dogrulamasi yukaridaki yeni bolumde tutulur:

```text
Backend tests       basarili - 10 test, 0 failure/error
npx tsc --noEmit    basarili
npm run lint        basarili - 0 hata, 0 uyari
npx expo-doctor     basarili - 18/18
Expo public config  basarili - native Firebase plugin/googleServicesFile yok
git diff --check    basarili
```

Notlar:

- Expo, Doctor'in bekledigi uyumlu patch surumu olan `~54.0.36` duzeyine yukseltildi.
- 22 Temmuz temiz `npm ci`, 21 moderate ve 4 high olmak uzere 25 vulnerability bildiriyor; otomatik `npm audit fix --force` uygulanmadi.
- Kalan audit fix onerileri Expo 57 major upgrade veya NativeWind/react-native-css major/downgrade gerektirdigi icin otomatik uygulanmadi.
- 16 Temmuz 2026 saat 12:21 civarinda backend test, TypeScript ve lint yeniden basarili calisti.
- Expo Go uzerinde email/password kayit, profil olusturma, role selection, passenger/biker profil telefon guncelleme ve review akislari manuel olarak dogrulandi.
- Backend veya Metro uzun sureli servis olarak baslatilmadi.

## Acik Isler

1. Foreground disi canli location tracking yok.
2. Uygulama ici rota/polyline ve gercek ETA yok; Google Maps deep link kullaniliyor.
3. Kalan 25 `npm audit` uyarisi (21 moderate, 4 high) bagimlilik uyumlulugu korunarak ayri planlanmali.
4. Push notification akisi EAS development APK iki fiziksel cihaza kurulduktan sonra manuel olarak dogrulanmali.
5. Degisiklikler feature branch uzerinde commitlenip pushlanmali; dogrudan `master` kullanilmamali.

## Google Cloud API Key Durumu

- Frontend `.env` icindeki Firebase key, `Browser key (auto created by Firebase)` ile eslesiyor.
- Browser key API allowlist'i Auth ve Storage icin gerekli Firebase API'lerine daraltildi: Firebase Management, Cloud Logging, Identity Toolkit, Token Service, Firebase Rules ve Cloud Storage for Firebase.
- Browser key icin application restriction eklenmedi; Expo Go / React Native JS SDK akisi sabit browser referrer veya native Android package header'i saglamadigi icin bu kısıt kayit akisini kirabilir.
- Android Maps key artik `react-native-maps` tarafindan runtime'da kullaniliyor. Google Cloud'da Maps SDK for Android acik olmali; key `com.oguzumutcan.motorescue` paketi ve kullanilan local/EAS signing SHA-1 fingerprint'leri ile application-restricted tutulmali.
- `MotoRescue Places Backend` key'i ayri kaldi ve yalnizca Places API hedeflerine kisitli oldugu dogrulandi.

## Manuel Test Plani

Backend'i baslat:

```powershell
cd "C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue\moto-rescue-backend"
.\mvnw.cmd spring-boot:run
```

Gerekli backend environment degiskenleri kullanici environment'inda kayitli olmali:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_PROJECT` veya `FIREBASE_PROJECT_ID`
- `GOOGLE_MAPS_API_KEY`

Frontend development client'i baslat:

```powershell
cd "C:\src\MotoRescue\moto-rescue-frontend"
npm run start:dev-client -- --port 8082
```

Manuel olarak dogrulananlar:

1. Yeni email/password kaydi.
2. Backend profil olusturma.
3. Role selection gecisi.
4. Passenger profil tamamlama ve telefon guncelleme.
5. Biker profil tamamlama, telefon guncelleme ve belge yukleme durumu.
6. Passenger review verme akisi.
7. Biker Reviews sekmesinde yalnizca gelen yorumlarin gorunmesi.
8. Passenger Reviews sekmesinde yalnizca verilen yorumlarin gorunmesi.
9. Review kartlarinda profil fotograflarinin gorunmesi.

Henuz ozellikle tekrar kontrol edilebilecek durumlar:

1. Ayni e-posta ile tekrar kayit hatasi.
2. Backend profil olusturma basarisiz olursa Firebase kullanici cleanup davranisi.
3. Login ve mevcut profil restore akisi.

## Otomatik Kontrol Komutlari

```powershell
cd moto-rescue-backend
.\mvnw.cmd test

cd ..\moto-rescue-frontend
npx tsc --noEmit
npm run lint
npx expo-doctor
```

## Son Donemde Tamamlanan Ozellikler

- 6 km icindeki online/fresh biker'lar rescue gorebilir ve kabul edebilir.
- Biker foreground konumu backend'e yayinlanir; passenger canli biker marker'ini gorur.
- Ehliyet iki yuzu yuklenmeden ve otomatik 1 dakikalik dogrulama tamamlanmadan biker online olamaz.
- Biker icin gecerli iletisim telefonu yoksa online olamaz.
- Passenger accepted asamasinda biker'i telefon uygulamasiyla arayabilir.
- Passenger ve biker profil fotograflari rescue olusturma/kabul sirasinda rescue belgesine snapshot olarak kaydedilir ve karsi tarafa gosterilir.
- Passenger searching ekrani gercek pickup haritasi gosterir; sabit 2 biker/3 km metinleri kaldirildi.
- Biker incoming rescue ekrani gercek pickup haritasi gosterir; sabit passenger rating, pickup mesafesi ve ETA metinleri kaldirildi.
- Biker dashboard `Today` sayaci gercek completed rescue history verisinden hesaplanir.
- Notification preference switch'leri backend'e yazilir; kapatilinca push token temizlenir, acilinca token yeniden kaydedilir.
- Backend Expo Push API ile yeni yakindaki rescue isteklerini online/fresh biker'lara, accept/start/complete/cancel durumlarini ilgili tarafa bildirir.
- Notification tap data'si Expo Router ile ilgili rescue ekranina yonlendirilir.
- Android Expo Go, SDK 53+ ile remote push token desteklemedigi icin push token kaydi Expo Go'da devre disi birakilir; gercek push testi development veya production build gerektirir.
- Passenger history gercek review puanini, sureyi ve biker fotografini gosterir; ornek veriler kaldirildi.
- Boarding code backend tarafindan uretilir ve biker start sirasinda dogrulanir.
- Badge, profile stats, rescue history ve community reviews backend verisine baglidir.

## Bilinen Sinirlamalar

- Polling push notification icin foreground/fallback mekanizmasi olarak korunuyor.
- Android Expo Go remote push desteklemez; push token ve teslimat testi development/production build ile yapilmalidir.
- Foreground disi canli location tracking yok.
- Uygulama ici rota/polyline ve gercek ETA yok; Google Maps deep link kullaniliyor.
- Telefon numarasi su anda dogrulanmis kimlik kaniti degildir.
