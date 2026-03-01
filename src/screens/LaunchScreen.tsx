import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useNavigation, StackActions } from "@react-navigation/native";
import PreloadWebView from "../components/PreloadWebView";
import { WEB_URLS } from "../config/urls";

const { width } = Dimensions.get("window");

const LaunchScreen = () => {
  const navigation = useNavigation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Replace current screen with MainTabs after animation
      navigation.dispatch(StackActions.replace("MainTabs"));
    });
  }, [progress, navigation]);

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Floating Background Blob */}
      <Image
        source={require("../../assets/launch/bg.svg")}
        style={[StyleSheet.absoluteFillObject, { marginLeft: 30, marginRight: 30 }]}
        contentFit="contain"
      />

      {/* Center Logo */}
      <View style={styles.content}>
        <Image
          source={require("../../assets/launch/logo.svg")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 100,
  },
  progressContainer: {
    position: "absolute",
    bottom: 80,
    width: width * 0.5,
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
