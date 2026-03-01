import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useNavigation, StackActions } from "@react-navigation/native";
import PreloadWebView from "../components/PreloadWebView";
import { WEB_URLS } from "../config/urls";

const { width } = Dimensions.get("window");

const LaunchScreen = () => {
  const navigation = useNavigation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync();
    
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      navigation.dispatch(StackActions.replace("MainTabs"));
    });
  }, [progress, navigation]);

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Full Splash Background with Logo */}
      <Image
        source={require("../../assets/splash-icon.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
      />

      {/* Bottom Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressBarWidth }]}
          />
        </View>
      </View>

      {/* Preload first tab (Earn) during launch animation */}
      <PreloadWebView url={WEB_URLS.EARN} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    position: "absolute",
    bottom: 80,
    width: width * 0.5,
    alignSelf: "center",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00FFAA",
    borderRadius: 3,
  },
});

export default LaunchScreen;
