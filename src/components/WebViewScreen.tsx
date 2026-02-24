import React, { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

interface WebViewScreenProps {
  url: string;
  onMessage?: (data: any) => void;
}

/**
 * 注入到 WebView 的 JS Bridge 脚本
 * 提供 window.RheaBridge 对象，包含：
 * - navigate(url, title?)  — 打开二级页面
 * - openModal(options)     — 打开底部 Modal
 * - closeModal()           — 关闭 Modal
 */
const INJECTED_BRIDGE_JS = `
(function() {
  if (window.RheaBridge) return;

  function postMsg(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  window.RheaBridge = {
    /**
     * 打开二级页面（全屏 push）
     * @param {string} url - 页面 URL
     * @param {string} [title] - 标题，不传则自动读取 document.title
     */
    navigate: function(url, title) {
      postMsg({
        type: 'navigate',
        url: url,
        title: title || document.title || ''
      });
    },

    /**
     * 打开底部 Modal 弹框
     * @param {Object} options
     * @param {string} options.title - Modal 标题
     * @param {string} [options.url] - Modal 内加载的 URL
     * @param {Object} [options.data] - 传递给 Modal 的数据对象
     */
    openModal: function(options) {
      options = options || {};
      postMsg({
        type: 'openModal',
        title: options.title || '',
        url: options.url || '',
        data: options.data || null
      });
    },

    /**
     * 关闭当前 Modal
     */
    closeModal: function() {
      postMsg({ type: 'closeModal' });
    }
  };

  // 标记 Bridge 已就绪
  window.dispatchEvent(new Event('RheaBridgeReady'));
})();
true;
`;

const WebViewScreen: React.FC<WebViewScreenProps> = ({ url, onMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          src={url}
          style={
            {
              flex: 1,
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "#0f0f1a",
            } as any
          }
          allow="clipboard-write; clipboard-read"
        />
      </View>
    );
  }

  const WebView = require("react-native-webview").default;

  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android") {
        const onBackPress = () => {
          if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
            return true;
          }
          return false;
        };
        const subscription = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress,
        );
        return () => subscription.remove();
      }
      return undefined;
    }, [canGoBack]),
  );

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (onMessage) {
        onMessage(data);
      }
    } catch {}
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load page</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsInlineMediaPlayback={true}
        mixedContentMode="compatibility"
        sharedCookiesEnabled={true}
        setSupportMultipleWindows={false}
        userAgent="RheaMobile/1.0"
        injectedJavaScript={INJECTED_BRIDGE_JS}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f1a",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f1a",
  },
  errorText: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default WebViewScreen;
