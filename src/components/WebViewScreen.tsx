import React, {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSolanaWalletBridge } from "../contexts/SolanaWalletBridgeContext";
import { INJECTED_BRIDGE_JS } from "../bridge/injected-bridge";

interface WebViewScreenProps {
  url: string;
  onMessage?: (data: any) => void;
}

export interface WebViewScreenRef {
  injectJavaScript: (js: string) => void;
}

const WebViewScreenInner = (
  { url, onMessage }: WebViewScreenProps,
  ref: React.Ref<WebViewScreenRef>,
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewIdRef = useRef(`webview_${Date.now()}_${Math.random()}`);
  const { registerWebView, unregisterWebView, handleWalletRequest, getCurrentWalletState } =
    useSolanaWalletBridge();

  if (Platform.OS === "web") {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useImperativeHandle(ref, () => ({
      injectJavaScript: (js: string) => {
        // Inject callback to iframe via postMessage
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { source: "rhea-bridge-inject", js },
            "*",
          );
        } catch {}
      },
    }));

    // Listen to messages from iframe via parent.postMessage
    React.useEffect(() => {
      const handler = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.source === "rhea-bridge" &&
          event.data.payload &&
          onMessage
        ) {
          onMessage(event.data.payload);
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, [onMessage]);

    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef as any}
          src={url}
          style={
            {
              flex: 1,
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "#ffffff",
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
  const isInitialLoadRef = useRef(true);
  const currentUrlRef = useRef(url);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => {
      webViewRef.current?.injectJavaScript(js);
    },
  }));

  useEffect(() => {
    if (webViewRef.current) {
      registerWebView(webViewIdRef.current, {
        injectJavaScript: (js: string) => {
          webViewRef.current?.injectJavaScript(js);
        },
      });
    }

    return () => {
      unregisterWebView(webViewIdRef.current);
    };
  }, [registerWebView, unregisterWebView]);

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
    if (navState.url) {
      currentUrlRef.current = navState.url;
    }
  };

  const [isTop, setIsTop] = useState(true);
  const handleScroll = (event: any) => {
    // Enable wrapper ScrollView pull-to-refresh only when web page is at the top
    setIsTop(event.nativeEvent.contentOffset.y <= 0);
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "refreshDone") {
        setRefreshing(false);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        return;
      }

      if (data.type === "setRefreshEnabled") {
        setRefreshEnabled(!!data.enabled);
        return;
      }

      if (
        data.type &&
        data.type.startsWith("wallet_")
      ) {
        handleWalletRequest(data);
        return;
      }

      if (onMessage) {
        onMessage(data);
      }
    } catch {}
  };

  const handleRefresh = () => {
    setRefreshing(true);
    webViewRef.current?.injectJavaScript(
      "window.dispatchEvent(new Event('rheaRefresh')); true;",
    );
    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshing(false);
      refreshTimeoutRef.current = null;
    }, 5000);
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          enabled={isTop && refreshEnabled}
          tintColor="#6366f1"
          colors={["#6366f1"]}
        />
        }
      >
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onScroll={handleScroll}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={(request: any) => {
            const isHttp =
              request.url.startsWith("http://") ||
              request.url.startsWith("https://");
            const isSafe =
              request.url.startsWith("about:") ||
              request.url.startsWith("data:") ||
              request.url.startsWith("javascript:") ||
              request.url.startsWith("blob:");

            // Custom Schemes (e.g. WalletConnect wc://, Telegram tg://, okex://)
            if (!isHttp && !isSafe) {
              // Directly open URL. canOpenURL might return false on iOS if scheme is not in Info.plist
              Linking.openURL(request.url).catch((err: any) => {
                console.warn(
                  "Failed to open scheme (maybe app not installed):",
                  request.url,
                );
              });
              return false; // Very important: stop WebView from trying to render a wallet scheme
            }

            if (isInitialLoadRef.current) return true;
            if (!isHttp) return true;
            // Allow iframes
            if (request.isTopFrame === false) return true;

            const getBaseUrl = (u: string) => u.split("?")[0].split("#")[0];
            const reqBase = getBaseUrl(request.url);
            const currBase = getBaseUrl(currentUrlRef.current);

            // Intercept if navigating to a different base URL (full page transition)
            if (reqBase !== currBase) {
              if (onMessage) {
                onMessage({ type: "navigate", url: request.url });
              }
              return false; // Prevent current WebView from navigating
            }
            return true;
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            isInitialLoadRef.current = false;
            
            const walletState = getCurrentWalletState();
            const publicKeyStr = walletState.publicKey;
            
            webViewRef.current?.injectJavaScript(`
              (function() {
                if (window.solanaWallet && window.solanaWallet._updateState) {
                  window.solanaWallet._updateState({
                    publicKey: ${publicKeyStr ? `"${publicKeyStr}"` : "null"},
                    connected: ${walletState.connected},
                    connecting: false
                  });
                }
              })();
              true;
            `);
          }}
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
          scrollEnabled={true}
          bounces={false}
          nestedScrollEnabled={true}
        />
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </View>
  );
};

const WebViewScreen = forwardRef<WebViewScreenRef, WebViewScreenProps>(
  WebViewScreenInner,
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
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
