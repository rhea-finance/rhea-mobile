import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, StyleSheet, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarProvider, useTabBar } from "../contexts/TabBarContext";
import { SolanaWalletBridgeProvider } from "../contexts/SolanaWalletBridgeContext";
import LaunchScreen from "../screens/LaunchScreen";
import EarnScreen from "../screens/EarnScreen";
import BorrowScreen from "../screens/BorrowScreen";
import SwapScreen from "../screens/SwapScreen";
import MyEarnScreen from "../screens/MyEarnScreen";
import TestScreen from "../screens/TestScreen";
import DetailScreen from "../screens/DetailScreen";
import PreloadWebView from "../components/PreloadWebView";
import { WEB_URLS } from "../config/urls";

type DetailParams = { url: string; title: string; callbackId?: string };

type RootStackParamList = {
  Launch: undefined;
  MainTabs: undefined;
  Detail: DetailParams;
};

type EarnStackParamList = {
  EarnMain: undefined;
  Detail: DetailParams;
};

type BorrowStackParamList = {
  BorrowMain: undefined;
  Detail: DetailParams;
};

type SwapStackParamList = {
  SwapMain: undefined;
  Detail: DetailParams;
};

type MyEarnStackParamList = {
  MyEarnMain: undefined;
  Detail: DetailParams;
};

type TestStackParamList = {
  TestMain: undefined;
  Detail: DetailParams;
};

const EarnStackNav = createNativeStackNavigator<EarnStackParamList>();
const BorrowStackNav = createNativeStackNavigator<BorrowStackParamList>();
const SwapStackNav = createNativeStackNavigator<SwapStackParamList>();
const MyEarnStackNav = createNativeStackNavigator<MyEarnStackParamList>();
const TestStackNav = createNativeStackNavigator<TestStackParamList>();

const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: "#ffffff" },
  headerTintColor: "#111827",
  headerTitleStyle: {
    fontWeight: "600" as const,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: "#ffffff" },
};

// Tab Icon Mapping
const TAB_ICONS: Record<string, { default: any; active: any }> = {
  Earn: {
    default: require("../../assets/tab-icons/earn.png"),
    active: require("../../assets/tab-icons/earn-active.png"),
  },
  Borrow: {
    default: require("../../assets/tab-icons/borrow.png"),
    active: require("../../assets/tab-icons/borrow-active.png"),
  },
  Swap: {
    default: require("../../assets/tab-icons/swap.png"),
    active: require("../../assets/tab-icons/swap-active.png"),
  },
  My: {
    default: require("../../assets/tab-icons/my.png"),
    active: require("../../assets/tab-icons/my-active.png"),
  },
  Test: {
    default: require("../../assets/tab-icons/test.png"),
    active: require("../../assets/tab-icons/test-active.png"),
  },
};

function EarnStack() {
  return (
    <EarnStackNav.Navigator screenOptions={stackScreenOptions}>
      <EarnStackNav.Screen
        name="EarnMain"
        component={EarnScreen}
        options={{ headerShown: false }}
      />
    </EarnStackNav.Navigator>
  );
}

function BorrowStack() {
  return (
    <BorrowStackNav.Navigator screenOptions={stackScreenOptions}>
      <BorrowStackNav.Screen
        name="BorrowMain"
        component={BorrowScreen}
        options={{ headerShown: false }}
      />
    </BorrowStackNav.Navigator>
  );
}

function SwapStack() {
  return (
    <SwapStackNav.Navigator screenOptions={stackScreenOptions}>
      <SwapStackNav.Screen
        name="SwapMain"
        component={SwapScreen}
        options={{ headerShown: false }}
      />
    </SwapStackNav.Navigator>
  );
}

function MyEarnStack() {
  return (
    <MyEarnStackNav.Navigator screenOptions={stackScreenOptions}>
      <MyEarnStackNav.Screen
        name="MyEarnMain"
        component={MyEarnScreen}
        options={{ headerShown: false }}
      />
    </MyEarnStackNav.Navigator>
  );
}

function TestStack() {
  return (
    <TestStackNav.Navigator screenOptions={stackScreenOptions}>
      <TestStackNav.Screen
        name="TestMain"
        component={TestScreen}
        options={{ headerShown: false }}
      />
    </TestStackNav.Navigator>
  );
}

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const icons = TAB_ICONS[label];
  if (!icons) return null;
  return (
    <Image
      source={focused ? icons.active : icons.default}
      style={styles.tabIconImage}
      resizeMode="contain"
    />
  );
};

function AppTabs() {
  const { tabBarVisible } = useTabBar();
  const insets = useSafeAreaInsets();
  const [preloadQueue, setPreloadQueue] = useState<string[]>([]);
  const [currentPreload, setCurrentPreload] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreloadQueue([WEB_URLS.BORROW, WEB_URLS.SWAP, WEB_URLS.MY_EARN]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (preloadQueue.length > 0 && !currentPreload) {
      setCurrentPreload(preloadQueue[0]);
    }
  }, [preloadQueue, currentPreload]);

  const handlePreloadComplete = () => {
    setPreloadQueue((prev) => prev.slice(1));
    setCurrentPreload(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            { 
              height: 60 + (insets.bottom || 0),
              paddingBottom: (insets.bottom || 0) + 8
            },
            !tabBarVisible && styles.tabBarHidden,
          ],
          tabBarActiveTintColor: "#1a1a2e",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarLabelStyle: styles.tabBarLabel,
          lazy: false,
          freezeOnBlur: false,
        }}
      >
        <Tab.Screen
          name="Earn"
          component={EarnStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Earn" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Borrow"
          component={BorrowStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Borrow" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Swap"
          component={SwapStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Swap" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="My"
          component={MyEarnStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="My" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Test"
          component={TestStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Test" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
      {currentPreload && (
        <PreloadWebView url={currentPreload} onLoadComplete={handlePreloadComplete} />
      )}
    </View>
  );
}

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <RootStack.Navigator
    screenOptions={{ headerShown: false, ...stackScreenOptions }}
  >
    <RootStack.Screen name="Launch" component={LaunchScreen} />
    <RootStack.Screen name="MainTabs" component={AppTabs} />
    <RootStack.Screen
      name="Detail"
      component={DetailScreen}
      options={({ route }) => ({
        title: (route.params as any)?.title || "",
        headerShown: true,
      })}
    />
  </RootStack.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <SolanaWalletBridgeProvider>
      <TabBarProvider>
        <NavigationContainer theme={appTheme}>
          <RootNavigator />
        </NavigationContainer>
      </TabBarProvider>
    </SolanaWalletBridgeProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    paddingTop: 4,
  },
  tabBarHidden: {
    display: "none",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabIconImage: {
    width: 24,
    height: 24,
  },
});

export default AppNavigator;
