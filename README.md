# Rhea Mobile

## Project Background

Rhea Mobile is the native mobile gateway for Rhea Finance, designed to bring our seamless Web3 DeFi experience—including Yield Earning, Borrowing, and Swapping—to iOS and Android users. Built as a hybrid application using Expo and React Native, it enables a smooth fusion between high-performance native navigation and our rich web-based decentralized applications (dApps) on the Solana ecosystem.

This project is developed for the Solana Hackathon to demonstrate how complex Solana dApps can achieve native-level mobile experiences without duplicating business logic.

## Technical Documentation

Rhea Mobile utilizes a custom lightweight JavaScript Bridge (`RheaBridge`) to seamlessly connect the React Native host with the encapsulated Web dApp.

### Architecture

- **Framework**: React Native (via Expo)
- **Routing**: `react-navigation` (Native Stack & Bottom Tabs)
- **Web Engine**: `react-native-webview`
- **Bridge Injection**: A transparent JS-bridge injected on runtime to allow the web frontend to communicate with the native device.

### Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Start the Metro bundler:
   \`\`\`bash
   pnpm start
   \`\`\`

3. Run on your desired platform (iOS Simulator or Android Emulator) via the Expo CLI prompts.
