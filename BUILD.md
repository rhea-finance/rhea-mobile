# APK Build Guide

## Requirements

- Node.js 16+
- npm / yarn / pnpm
- Expo account (free signup: https://expo.dev/signup)

**No need to install Java, Android SDK, or NDK locally.** All compilation happens in Expo cloud.

## 1. Install Dependencies

```bash
npm install
```

## 2. Install EAS CLI

```bash
npm install -g eas-cli
```

## 3. Login to Expo Account

```bash
eas login
```

If you don't have an account, register at https://expo.dev/signup (free).

## 4. Build APK (Cloud)

### Preview Build (Recommended for Testing)

```bash
eas build --profile preview --platform android
```

- Build takes ~10-15 minutes (first time)
- Download link appears in terminal after completion
- Can also find builds in Dashboard at https://expo.dev
- Download `.apk` file and install on Android phone

### Production Build

```bash
eas build --profile production --platform android
```

## 5. Install on Phone

After downloading APK:

1. Transfer APK to Android phone (USB / WeChat / Cloud drive)
2. Tap APK file to install
3. If "Unknown source" warning appears, allow installation from unknown apps in system settings

## Build Configuration

`eas.json` contains three profiles:

| Profile | Purpose | Output |
|---------|---------|--------|
| development | Dev/Debug | Dev client |
| preview | Internal testing | APK |
| production | Official release | APK |

## FAQ

### How long does first build take?

First build takes ~10-15 minutes (cloud environment setup), subsequent builds are faster.

### Are there limits on free account?

Expo free account has 30 builds per month, sufficient for testing.

### How to check build status?

```bash
eas build:list
```

Or visit Dashboard at https://expo.dev.

### Local Development Preview (No APK Build Needed)

Install Expo Go app on phone (search "Expo Go" on Google Play), then:

```bash
npm start
```

Scan QR code in terminal to preview on phone in real-time.

**Note**: WebView may have limitations in Expo Go, use EAS Build APK for complete testing.
