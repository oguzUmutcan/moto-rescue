# Dependency audit plan

Last reviewed: 23 July 2026

## Applied without framework upgrades

The four high-severity transitive findings have compatible patched releases pinned
through npm overrides:

- `brace-expansion`: `1.1.16` for the legacy range and `5.0.7` for the current range
- `fast-uri`: `3.1.4`
- `js-yaml`: `4.3.0` (the Istanbul-specific v3 override remains `3.15.0`)
- `shell-quote`: `1.10.0`

`protobufjs` is also pinned to `7.6.5` to clear its moderate denial-of-service
advisory.

## Deferred migrations

- Keep the application on Expo SDK 54 until an explicit SDK upgrade branch is
  tested with Android Maps, FCM, Expo Router, NativeWind, and the development
  client. npm currently proposes Expo 57 to clear the remaining Expo-family
  advisories; that is a major application upgrade.
- Do not accept npm's proposed NativeWind 5 preview to NativeWind 4 downgrade or
  `react-native-css` 3 to 2 downgrade in this branch. Both change the styling
  toolchain and need their own visual regression pass.
- Re-run `npm audit`, Expo Doctor, TypeScript, lint, Android prebuild, and a physical
  notification test when the Expo upgrade branch is prepared.
