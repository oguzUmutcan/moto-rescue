# Dependency audit

Last reviewed: 26 July 2026

## Current result

`npm audit` reports 0 known vulnerabilities.

The July 26 registry data initially reported 62 findings (45 high and 17
moderate). They were resolved without changing Expo SDK 54 by:

- updating Tailwind/PostCSS-compatible patch releases;
- pinning patched `postcss`, `tar`, and `uuid` versions;
- moving affected `minimatch` consumers to `10.2.5`, which uses patched
  `brace-expansion` `5.0.8`;
- keeping the existing compatible pins for `fast-uri`, `js-yaml`,
  `lightningcss`, `protobufjs`, and `shell-quote`.

The transitive overrides are validated by frontend tests, TypeScript, lint,
Expo Doctor, and Metro exports. They must be revalidated whenever Expo,
React Native, Jest, or ESLint changes.

## Upgrade policy

- Keep Expo SDK 54 until an explicit upgrade branch validates Android Maps,
  background location, notifications, NativeWind, Firebase persistence, and
  the development client.
- Do not run `npm audit fix --force`; its current proposal upgrades Expo and
  React Native across major framework boundaries.
- Re-run `npm audit`, `npm ci`, tests, TypeScript, lint, Expo Doctor, and
  Android/web exports after dependency changes.
