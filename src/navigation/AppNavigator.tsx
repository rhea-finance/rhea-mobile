import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, StyleSheet, Platform } from "react-native";

import EarnScreen from "../screens/EarnScreen";
import BorrowScreen from "../screens/BorrowScreen";
import SwapScreen from "../screens/SwapScreen";
import MyEarnScreen from "../screens/MyEarnScreen";
import DetailScreen from "../screens/DetailScreen";

type DetailParams = { url: string; title: string };

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
  headerStyle: { backgroundColor: "#0f0f1a" },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "600" as const },
  contentStyle: { backgroundColor: "#0f0f1a" },
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

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    {label === "Earn"
      ? "\u{1F4B0}"
      : label === "Borrow"
        ? "\u{1F3E6}"
        : label === "Swap"
          ? "\u{1F504}"
          : "\u{1F464}"}
  </Text>
);

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#6366f1",
          tabBarInactiveTintColor: "#6b7280",
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
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#1a1a2e",
    borderTopColor: "#2d2d44",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 85 : 60,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;
