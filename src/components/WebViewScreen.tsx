import React, {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
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

interface WebViewScreenProps {
  url: string;
  onMessage?: (data: any) => void;
}

export interface WebViewScreenRef {
  injectJavaScript: (js: string) => void;
}

/**
 * Injected JS Bridge script for WebView
 * Exposes window.RheaBridge object
 */
const INJECTED_BRIDGE_JS = `
(function() {
  if (window.RheaBridge) return;

  var _callbackId = 0;
  var _callbacks = {};

  function postMsg(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } else if (window.parent !== window) {
      // iframe 模式（Expo Web）：通过 parent.postMessage 通信
      window.parent.postMessage({ source: 'rhea-bridge', payload: data }, '*');
    }
  }

  window.RheaBridge = {
    // ---- Internal Callback Registry ----
    _callbacks: _callbacks,
    _invokeCallback: function(id, data) {
      if (_callbacks[id]) {
        try { _callbacks[id](data); } catch(e) {}
        delete _callbacks[id];
      }
    },

    // ---- Open Sub Page ----
    navigate: function(url, options) {
      options = options || {};
      if (typeof options === 'string') {
        options = { title: options };
      }
      var msg = {
        type: 'navigate',
        url: url,
        title: options.title || document.title || ''
      };
      if (typeof options.callback === 'function') {
        var id = 'cb_' + (++_callbackId);
        _callbacks[id] = options.callback;
        msg.callbackId = id;
      }
      postMsg(msg);
    },

    // ---- Open Bottom Modal ----
    openModal: function(options) {
      options = options || {};
      var msg = {
        type: 'openModal',
        title: options.title || '',
        url: options.url || '',
        data: options.data || null
      };
      if (typeof options.callback === 'function') {
        var id = 'cb_' + (++_callbackId);
        _callbacks[id] = options.callback;
        msg.callbackId = id;
      }
      postMsg(msg);
    },

    // ---- Close Modal / Go Back (Triggers callback) ----
    goBack: function(data) {
      postMsg({ type: 'goBack', data: data || null });
    },

    // ---- 关闭当前 Modal ----
    closeModal: function() {
      postMsg({ type: 'closeModal' });
    },

    // ---- 下拉刷新完成 ----
    refreshDone: function() {
      postMsg({ type: 'refreshDone' });
    },

    // ---- TabBar Visibility ----
    setTabBarVisible: function(visible) {
      postMsg({ type: 'setTabBarVisible', visible: !!visible });
    }
  };

  // Hijack window.open to Native navigate (for Web3 links / external prompts)
  var originalWindowOpen = window.open;
  window.open = function(url, name, specs) {
    if (window.RheaBridge) {
      if (typeof url === 'string' && url.match(/^https?:/i)) {
        window.RheaBridge.navigate(url);
      } else {
        window.location.href = url; // Let native schema handler catch it
      }
    } else {
      originalWindowOpen(url, name, specs);
    }
    return null;
  };

  // Hijack History API (React/Next.js SPA routing)
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  
  function handleHistoryUrl(url) {
    try {
      var newUrl = new URL(url.toString(), window.location.href);
      if (newUrl.protocol.startsWith('http')) {
        var isDiffPath = newUrl.origin !== window.location.origin || newUrl.pathname !== window.location.pathname;
        if (isDiffPath && window.RheaBridge) {
          window.RheaBridge.navigate(newUrl.href);
          return true; // intercept
        }
      }
    } catch(e) {}
    return false;
  }

  history.pushState = function(state, unused, url) {
    if (url && handleHistoryUrl(url)) return;
    return originalPushState.apply(this, arguments);
  };
  history.replaceState = function(state, unused, url) {
    if (url && handleHistoryUrl(url)) return;
    return originalReplaceState.apply(this, arguments);
  };

  // Intercept <a> clicks globally to catch Next.js/React Router before they process it
  window.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a && a.href && a.target !== '_blank') {
      try {
        var newUrl = new URL(a.href, window.location.href);
        if (newUrl.protocol.startsWith('http')) {
          var isDiffPath = newUrl.origin !== window.location.origin || newUrl.pathname !== window.location.pathname;
          if (isDiffPath && window.RheaBridge) {
            e.preventDefault();
            e.stopPropagation();
            window.RheaBridge.navigate(newUrl.href);
          }
        }
      } catch(err) {}
    }
  }, true);

  window.dispatchEvent(new Event('RheaBridgeReady'));
})();
true;
`;

const WebViewScreenInner = (
  { url, onMessage }: WebViewScreenProps,
  ref: React.Ref<WebViewScreenRef>,
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (Platform.OS === "web") {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useImperativeHandle(ref, () => ({
      injectJavaScript: (js: string) => {
        // 通过 postMessage 向 iframe 注入回调
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { source: "rhea-bridge-inject", js },
            "*",
          );
        } catch {}
      },
    }));

    // 监听 iframe 通过 parent.postMessage 发来的消息
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
            enabled={isTop}
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
