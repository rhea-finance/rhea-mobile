import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";

interface PreloadWebViewProps {
  url: string;
  onLoadComplete?: () => void;
  timeout?: number;
}

const PreloadWebView: React.FC<PreloadWebViewProps> = ({
  url,
  onLoadComplete,
  timeout = 10000,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);

  if (Platform.OS === "web") {
    return null;
  }

  const WebView = require("react-native-webview").default;

  const handleComplete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsLoaded(true);
    onLoadComplete?.();
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      handleComplete();
    }, timeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout]);

  if (isLoaded) {
    return null;
  }

  return (
    <View style={styles.preloadContainer} pointerEvents="none">
      <WebView
        source={{ uri: url }}
        onLoadEnd={handleComplete}
        onError={handleComplete}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        sharedCookiesEnabled={true}
        userAgent="RheaMobile/1.0"
        scrollEnabled={false}
        bounces={false}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  preloadContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  webview: {
    backgroundColor: "transparent",
  },
});

export default PreloadWebView;
