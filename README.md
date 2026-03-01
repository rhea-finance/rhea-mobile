# Rhea Mobile

Rhea Mobile is the native mobile gateway for Rhea Finance, bringing seamless Web3 DeFi experience to mobile users. Built as a hybrid application using Expo and React Native, it provides native navigation with WebView-embedded dApps on Solana.

## Key Features

- **🔐 Solana Wallet Integration**: Native Mobile Wallet Adapter support with `window.solanaWallet` API
- **🌉 WebView Bridge**: Bidirectional communication between native and web
- **🧪 Test Tab**: Debug any dApp URL without rebuilding
- **🎨 Unified Launch**: Seamless splash-to-launch screen transition
- **🔄 Pull-to-Refresh**: Dapp-controlled refresh (disabled by default)
- **📐 Safe Area**: Proper TabBar spacing for modern devices

## Tech Stack

- **Expo SDK 54** + React Native 0.81
- **@wallet-ui/react-native-web3js** - Solana Mobile Wallet Adapter
- **@react-navigation** - Native navigation
- **react-native-webview** - Web content rendering
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Android device or emulator (requires custom native modules)

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server
npx expo start

# Run on Android (requires Expo Dev Client)
npx expo run:android
```

**Note**: Cannot use Expo Go due to custom native modules (Solana MWA). Must build development client.

### Build APK

```bash
# Cloud build via EAS (no local Android SDK required)
eas build -p android --profile preview
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Detailed technical documentation
- **[BUILD.md](BUILD.md)** - Build and deployment guide
- **[web-demo/](web-demo/)** - Bridge and Wallet API examples
