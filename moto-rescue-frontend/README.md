# MotoRescue Frontend

Expo SDK 54 app using Expo Router, Firebase JS SDK, backend-authoritative profiles/rescues, and Expo push notifications.

## Environment

Create `.env` from `.env.example`.

Firebase JS SDK values are required for auth and storage:

```powershell
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Android development/production builds also require a native Google Maps SDK key:

```powershell
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=
```

Use a Google Maps SDK for Android key restricted to:

- Android package: `com.oguzumutcan.motorescue`
- SHA-1 certificate fingerprint for the build being installed

This is separate from `EXPO_PUBLIC_FIREBASE_API_KEY` and from the backend `GOOGLE_MAPS_API_KEY` used for Places.

## Run

Expo Go:

```powershell
npm start
```

Development build:

```powershell
npm run start:dev-client
```

After changing `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`, rebuild and reinstall the Android development APK. Native API keys are compiled into the Android manifest and cannot be fixed by only restarting Metro.

For local native rebuilds:

```powershell
npx expo prebuild --clean --platform android
npx expo run:android
```

For EAS development builds, set `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` or `GOOGLE_MAPS_ANDROID_API_KEY` in the EAS build environment and run:

```powershell
eas build --profile development --platform android
```
