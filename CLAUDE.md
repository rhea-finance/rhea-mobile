# Rhea Mobile

Expo React Native Android App with 4 native bottom tabs + WebView hybrid architecture.

## Tech Stack

- Expo SDK 54 + React Native 0.81
- TypeScript
- @react-navigation/native + bottom-tabs + native-stack
- react-native-webview
- EAS Build (cloud build, no local Android SDK required)

## Project Structure

```
src/
├── components/
│   ├── WebViewScreen.tsx      # WebView wrapper (Bridge injection, pull-to-refresh, forwardRef)
│   ├── BottomModal.tsx        # Bottom modal (Animated slide-in + overlay)
│   └── PreloadWebView.tsx     # Hidden WebView for preloading pages
├── contexts/
│   ├── TabBarContext.tsx                # TabBar visibility state Context
│   └── SolanaWalletBridgeContext.tsx    # Solana Wallet Bridge management
├── navigation/
│   └── AppNavigator.tsx       # Navigation config + custom icons + TabBar visibility
├── screens/
│   ├── LaunchScreen.tsx       # Launch screen with progress bar
│   ├── EarnScreen.tsx         # Earn Tab
│   ├── BorrowScreen.tsx       # Borrow Tab
│   ├── SwapScreen.tsx         # Swap Tab
│   ├── MyEarnScreen.tsx       # My Tab
│   ├── TestScreen.tsx         # Test Tab (URL input for debugging)
│   └── DetailScreen.tsx       # Detail page (full-screen push)
assets/
├── tab-icons/
│   ├── earn.png / earn-active.png
│   ├── borrow.png / borrow-active.png
│   ├── swap.png / swap-active.png
│   ├── my.png / my-active.png
│   └── test.png / test-active.png
├── launch/
│   ├── bg.svg                 # Launch background blob
│   └── logo.svg               # Launch logo
├── splash-icon.png            # Full launch screen image (1284x2778)
├── icon.png                   # App icon (1024x1024)
└── adaptive-icon.png          # Android adaptive icon (1024x1024)
web-demo/
├── index.html                 # Bridge usage demo
├── modal-content.html         # Modal content example
└── solana-wallet-test.html    # Solana Wallet integration test page
polyfill.js                    # Crypto polyfill for @solana/web3.js
```

## Navigation Architecture

- Bottom Tab Navigator: Earn / Borrow / Swap / My / Test
- Each Tab embeds a Native Stack Navigator, all support navigation to Detail pages
- Android hardware back button supports WebView internal back navigation

## WebView Communication

WebView automatically injects two global objects: `window.RheaBridge` and `window.solanaWallet`.

### RheaBridge API

```javascript
// Open detail page with callback support
RheaBridge.navigate(url, { title?, callback? })

// Open bottom modal with callback support
RheaBridge.openModal({ title, url?, data?, callback? })

// Go back and pass data to callback
RheaBridge.goBack(data?)

// Close current modal
RheaBridge.closeModal()

// Notify pull-to-refresh complete
RheaBridge.refreshDone()

// Control TabBar visibility
RheaBridge.setTabBarVisible(visible)

// Enable/disable pull-to-refresh (default: disabled)
RheaBridge.setRefreshEnabled(enabled)
```

### Pull to Refresh

**Default**: Pull-to-refresh is disabled by default. Dapp must explicitly enable it.

```javascript
// Enable pull-to-refresh
RheaBridge.setRefreshEnabled(true);

// Listen to refresh event
window.addEventListener("rheaRefresh", function () {
  fetchData().then(function () {
    RheaBridge.refreshDone(); // Auto rebound after 5s timeout
  });
});

// Disable when not needed
RheaBridge.setRefreshEnabled(false);
```

### Bridge Ready Event

```javascript
window.addEventListener("RheaBridgeReady", function () {
 // Bridge is ready
});
```

## Solana Wallet Integration

App integrates Solana Mobile Wallet Adapter, dapps in WebView can directly call wallet functions via `window.solanaWallet`.

### Solana Wallet API

```javascript
// Connect wallet (opens Phantom/Solflare etc.)
await window.solanaWallet.connect()

// Disconnect
await window.solanaWallet.disconnect()

// Sign message
const message = new TextEncoder().encode("Hello Solana")
const signature = await window.solanaWallet.signMessage(message)

// Sign transaction
const signedTx = await window.solanaWallet.signTransaction(transaction)

// Sign multiple transactions
const signedTxs = await window.solanaWallet.signAllTransactions([tx1, tx2])

// Get public key
const pubkey = window.solanaWallet.publicKey?.toBase58()

// Check connection status
if (window.solanaWallet.connected) {
  console.log("Wallet connected")
}
```

### Listen to Wallet Events

```javascript
window.solanaWallet.on('connect', () => {
  console.log('Wallet connected')
})

window.solanaWallet.on('disconnect', () => {
  console.log('Wallet disconnected')
})

window.solanaWallet.on('accountChanged', (data) => {
  console.log('Account changed:', data.publicKey)
})
```

### Wallet Ready Event

```javascript
window.addEventListener('solanaWalletReady', function() {
  // Solana Wallet is ready
  console.log('Wallet available:', window.solanaWallet)
})
```

### Solana Wallet Adapter Integration

`window.solanaWallet` implements wallet-specific methods from `@solana/wallet-adapter-base` standard.

**Important**: Dapp must create its own Connection instance:

```javascript
import { Connection } from '@solana/web3.js';

// Initialize your own connection
const connection = new Connection('https://rpc');

// Use window.solanaWallet for wallet operations
const { publicKey, sendTransaction } = window.solanaWallet;

// Example: Send transaction
const transaction = new Transaction().add(/* instructions */);
const signature = await sendTransaction(transaction, connection, options);
```

## Development Commands

```bash
npm install               # Install dependencies
npx expo start            # Start dev server
npx expo start --android  # Debug on Android device
npx expo start --web      # Debug in web mode
```

## Build APK

Due to Solana Mobile Wallet Adapter (Kotlin native modules), must build custom development build:

```bash
# Development build (requires Android device or emulator)
npx expo run:android

# Production build (via EAS Build)
eas build -p android --profile preview
```

**Note**: Cannot use Expo Go, must build full APK with native modules.

## Tab URL Configuration

- Earn: `src/screens/EarnScreen.tsx` → `EARN_URL`
- Borrow: `src/screens/BorrowScreen.tsx` → `BORROW_URL`
- Swap: `src/screens/SwapScreen.tsx` → `SWAP_URL`
- My: `src/screens/MyEarnScreen.tsx` → `MY_EARN_URL`
- Test: User input for debugging

## Tab Icons

Icon files in `assets/tab-icons/`, naming convention:

- `{name}.png` — Inactive state
- `{name}-active.png` — Active state
- Recommended size: 48x48px, PNG with transparent background

## Test Solana Wallet Integration

1. Ensure MWA-compatible wallet (Phantom, Solflare) is installed on device
2. Open test page in browser: `web-demo/solana-wallet-test.html`
3. Click "Connect Wallet" should open wallet authorization
4. Test sign message and transaction functions

## Launch Screen

App uses a unified launch experience:
- **Splash Screen**: Uses `splash-icon.png` with `#F4F4F4` background
- **Launch Screen**: Shows same image + animated progress bar
- **Manual Control**: `SplashScreen.preventAutoHideAsync()` in App.tsx, `hideAsync()` in LaunchScreen
- **Seamless Transition**: User sees one continuous screen with progress animation

## Test Tab Usage

The 5th Tab (Test) allows you to:
1. Enter any URL (local dev server, staging, production)
2. Click "Load" button
3. WebView loads the page with full Bridge + Solana Wallet integration
4. Perfect for debugging dApps without rebuilding the app

## Dependencies

Core dependencies:

- `@wallet-ui/react-native-web3js` - Solana Mobile Wallet Adapter
- `react-native-quick-crypto` - Crypto polyfill for React Native
- `@solana/web3.js` - Solana JavaScript SDK
- `expo-dev-client` - Custom development build support
- `expo-splash-screen` - Manual splash screen control

## Key Features

- **Solana Wallet Integration**: Native MWA support with `window.solanaWallet` API
- **Pull-to-Refresh Control**: Dapp-controlled refresh (disabled by default)
- **TabBar Safe Area**: Properly handles device notches and gesture bars
- **Launch Screen Preloading**: Preloads first tab during launch animation
- **Test Tab**: Quick URL testing without rebuilding
- **WebView Bridge**: Bidirectional communication for navigation and modals
