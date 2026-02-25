import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, StyleSheet, Platform } from "react-native";

import { TabBarProvider, useTabBar } from "../contexts/TabBarContext";
import LaunchScreen from "../screens/LaunchScreen";
import EarnScreen from "../screens/EarnScreen";
import BorrowScreen from "../screens/BorrowScreen";
import SwapScreen from "../screens/SwapScreen";
import MyEarnScreen from "../screens/MyEarnScreen";
import DetailScreen from "../screens/DetailScreen";

type DetailParams = { url: string; title: string; callbackId?: string };

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

const EarnStackNav = createNativeStackNavigator<EarnStackParamList>();
const BorrowStackNav = createNativeStackNavigator<BorrowStackParamList>();
const SwapStackNav = createNativeStackNavigator<SwapStackParamList>();
const MyEarnStackNav = createNativeStackNavigator<MyEarnStackParamList>();

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
};

function EarnStack() {
  return (
    <EarnStackNav.Navigator screenOptions={stackScreenOptions}>
      <EarnStackNav.Screen
        name="EarnMain"
        component={EarnScreen}
        options={{ headerShown: false }}
      />
      <EarnStackNav.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerShown: true,
        })}
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
      <BorrowStackNav.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerShown: true,
        })}
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
      <SwapStackNav.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerShown: true,
        })}
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
      <MyEarnStackNav.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerShown: true,
        })}
      />
    </MyEarnStackNav.Navigator>
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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, !tabBarVisible && styles.tabBarHidden],
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
          tabBarIcon: ({ focused }) => <TabIcon label="My" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

const RootStack = createNativeStackNavigator();

const RootNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Launch" component={LaunchScreen} />
    <RootStack.Screen name="MainTabs" component={AppTabs} />
  </RootStack.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <TabBarProvider>
      <NavigationContainer theme={appTheme}>
        <RootNavigator />
      </NavigationContainer>
    </TabBarProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 85 : 60,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
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
