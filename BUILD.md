# APK Build Guide

## Requirements

- Node.js 16+
- npm / yarn / pnpm
- Expo account (free signup: https://expo.dev/signup)

**No need to install Java, Android SDK, or NDK locally.** All compilation happens in Expo cloud.

## Development Workflow

### Option 1: Local Development (Recommended for UI Debugging)

For fast iteration during development, use Expo Dev Client with hot reload:

#### First Time Setup

1. Build a development APK (once):
```bash
eas build --profile development --platform android
```

2. Wait ~10-15 minutes, download and install the APK on your phone

#### Daily Development

1. Start development server:
```bash
npm start
# or with cache cleared
npm run dev
```

2. On your phone:
   - Open the Development version app
   - Scan the QR code or enter the dev server URL
   - Code changes will hot reload in seconds

**When to rebuild:**
- Modifying native code (`app.json`, adding native modules)
- Pure JS/TS changes (UI, logic) don't require rebuild

### Option 2: Cloud Build (For Testing Complete Builds)

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

## Build APK (Cloud)

### Preview Build (For Internal Testing)

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

## Install APK on Phone

After downloading APK:

1. Transfer APK to Android phone (USB / WeChat / Cloud drive)
2. Tap APK file to install
3. If "Unknown source" warning appears, allow installation from unknown apps in system settings

## Build Profiles

`eas.json` contains three profiles:

| Profile | Purpose | Use Case | Output |
|---------|---------|----------|--------|
| development | Local dev with hot reload | UI debugging, rapid iteration | Dev client APK |
| preview | Internal testing | Testing complete features | Standard APK |
| production | Official release | Distribution | Production APK |

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

### Why not use Expo Go?

Expo Go doesn't support custom native modules (WebView, Solana MWA). Use Development build instead for full feature testing.
