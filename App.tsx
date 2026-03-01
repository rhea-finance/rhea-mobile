import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { clusterApiUrl } from "@solana/web3.js";
import AppNavigator from "./src/navigation/AppNavigator";
import PreloadWebView from "./src/components/PreloadWebView";
import { WEB_URLS } from "./src/config/urls";

SplashScreen.preventAutoHideAsync();

const CHAIN = "solana:mainnet";
const ENDPOINT = clusterApiUrl("mainnet-beta");
const IDENTITY = {
  name: "Rhea Finance",
  uri: "https://rhea.finance",
  icon: "favicon.png",
};

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <MobileWalletProvider
        chain={CHAIN}
        endpoint={ENDPOINT}
        identity={IDENTITY}
      >
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={true} />
        {isReady ? (
          <AppNavigator />
        ) : (
          <View style={{ flex: 1 }}>
            <PreloadWebView url={WEB_URLS.EARN} />
          </View>
        )}
      </MobileWalletProvider>
    </SafeAreaProvider>
  );
}
