# MotoRescue Session Handoff

## 16 Temmuz 2026 - Guncel Durum

Zorunlu Firebase SMS kaydi kaldirildi. Bootloader acik/rootlu cihazlarin Firebase Play Integrity kontrolu nedeniyle kayit disi kalmasi urun gereksinimine uygun bulunmadi. Kayit akisi yeniden Firebase JS SDK email/password hesabi + backend profil olusturma modeline donduruldu.

Telefon numarasi artik dogrulanmis kimlik kaniti degil, profil iletisim verisidir. Yeni profiller `phoneVerified: false` ile olusur. Gelecekte telefon dogrulamasi gerekiyorsa Play Integrity'ye bagli olmayan ayri bir backend OTP saglayicisi tasarlanmalidir.

## Guncel Calisma Bicimi

- `moto-rescue-frontend/app/(auth)/verify-creds.tsx` SMS istemez. Kullanici bilgilerini onaylayinca Firebase email/password hesabini ve backend profilini olusturur.
- Backend `UserService.create`, Firebase ID token icinde `phone_number` claim'i zorunlu tutmaz.
- Passenger ve biker profil ekranlarinda iletisim telefonu tekrar duzenlenebilir.
- `@react-native-firebase/app`, `@react-native-firebase/auth` ve `expo-dev-client` kaldirildi.
- Expo config'ten RNFirebase pluginleri ve `android.googleServicesFile` kaldirildi.
- `moto-rescue-frontend/google-services.json` repodan silindi.
- `npm start`, `expo start --go --lan` calistirir. Uygulama Expo Go ile calistirilabilir; yeni development APK gerekmez.
- Onceki native SMS APK'si `application-e2860996-767e-42d7-8720-55ad9e3deb75.apk` yalnizca yerel untracked dosyadir ve commit edilmemelidir.

## Git Durumu

- Remote: `https://github.com/oguzUmutcan/moto-rescue.git`
- Aktif branch: `feat/backend-api-consolidation`
- Son gorulen commitler:
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

Bu dogrulamalar zorunlu SMS kaldirildiktan sonraki son otomatik kontroldur:

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
- `npm audit` push notification paketleri eklendikten sonra 17 moderate vulnerability bildiriyor.
- Kalan audit fix onerileri Expo 57 major upgrade veya NativeWind/react-native-css major/downgrade gerektirdigi icin otomatik uygulanmadi.
- 16 Temmuz 2026 saat 12:21 civarinda backend test, TypeScript ve lint yeniden basarili calisti.
- Expo Go uzerinde email/password kayit, profil olusturma, role selection, passenger/biker profil telefon guncelleme ve review akislari manuel olarak dogrulandi.
- Backend veya Metro uzun sureli servis olarak baslatilmadi.

## Acik Isler

1. Foreground disi canli location tracking yok.
2. Uygulama ici rota/polyline ve gercek ETA yok; Google Maps deep link kullaniliyor.
3. Kalan 17 moderate `npm audit` uyarisi Expo SDK 57 major upgrade veya NativeWind/react-native-css major/downgrade gerektirdigi icin ayri planlanmali.
4. Push notification akisi fiziksel cihazda manuel olarak dogrulanmali.
5. Degisiklikler feature branch uzerinde commitlenip pushlanmali; dogrudan `master` kullanilmamali.

## Google Cloud API Key Durumu

- Frontend `.env` icindeki Firebase key, `Browser key (auto created by Firebase)` ile eslesiyor.
- Browser key API allowlist'i Auth ve Storage icin gerekli Firebase API'lerine daraltildi: Firebase Management, Cloud Logging, Identity Toolkit, Token Service, Firebase Rules ve Cloud Storage for Firebase.
- Browser key icin application restriction eklenmedi; Expo Go / React Native JS SDK akisi sabit browser referrer veya native Android package header'i saglamadigi icin bu kısıt kayit akisini kirabilir.
- Artik runtime'da kullanilmayan Android key, `com.oguzumutcan.motorescue` paketi ve Firebase'deki mevcut EAS SHA-1 fingerprint'i ile application-restricted hale getirildi.
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

Frontend'i Expo Go icin baslat:

```powershell
cd "C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue\moto-rescue-frontend"
npm start
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
