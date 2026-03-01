import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { clusterApiUrl } from "@solana/web3.js";
import AppNavigator from "./src/navigation/AppNavigator";

const CHAIN = "solana:mainnet";
const ENDPOINT = clusterApiUrl("mainnet-beta");
const IDENTITY = {
  name: "Rhea Finance",
  uri: "https://rhea.finance",
  icon: "favicon.png",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileWalletProvider
        chain={CHAIN}
        endpoint={ENDPOINT}
        identity={IDENTITY}
      >
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={true} />
        <AppNavigator />
      </MobileWalletProvider>
    </SafeAreaProvider>
  );
}
