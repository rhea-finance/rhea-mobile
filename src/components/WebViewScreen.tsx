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

interface WebViewScreenProps {
  url: string;
  onMessage?: (data: any) => void;
}

export interface WebViewScreenRef {
  injectJavaScript: (js: string) => void;
}

/**
 * Injected JS Bridge script for WebView
 * Exposes window.RheaBridge object and window.solanaWallet object
 */
const INJECTED_BRIDGE_JS = `
(function() {
  if (window.RheaBridge) return;

  var _callbackId = 0;
  var _callbacks = {};
  var _walletRequestId = 0;
  var _walletRequests = {};

  function postMsg(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } else if (window.parent !== window) {
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

    // ---- Close Current Modal ----
    closeModal: function() {
      postMsg({ type: 'closeModal' });
    },

    // ---- Refresh Done ----
    refreshDone: function() {
      postMsg({ type: 'refreshDone' });
    },

    // ---- TabBar Visibility ----
    setTabBarVisible: function(visible) {
      postMsg({ type: 'setTabBarVisible', visible: !!visible });
    },

    // ---- Refresh Control ----
    setRefreshEnabled: function(enabled) {
      postMsg({ type: 'setRefreshEnabled', enabled: !!enabled });
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

  // ========== Solana Wallet Bridge ==========
  var _walletState = {
    publicKey: null,
    connected: false,
    connecting: false
  };
  var _walletEventListeners = {};

  function emitWalletEvent(event, data) {
    if (_walletEventListeners[event]) {
      _walletEventListeners[event].forEach(function(callback) {
        try { callback(data); } catch(e) {}
      });
    }
  }

  window.solanaWallet = {
    get publicKey() {
      if (!_walletState.publicKey) return null;
      return {
        toBase58: function() { return _walletState.publicKey; },
        toString: function() { return _walletState.publicKey; },
        toBuffer: function() {
          var bs58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
          var bytes = [0];
          for (var i = 0; i < _walletState.publicKey.length; i++) {
            var c = _walletState.publicKey[i];
            var value = bs58.indexOf(c);
            if (value < 0) throw new Error('Invalid character');
            for (var j = 0; j < bytes.length; j++) bytes[j] *= 58;
            bytes[0] += value;
            var carry = 0;
            for (var k = 0; k < bytes.length; k++) {
              bytes[k] += carry;
              carry = bytes[k] >> 8;
              bytes[k] &= 0xff;
            }
            while (carry > 0) {
              bytes.push(carry & 0xff);
              carry >>= 8;
            }
          }
          for (var l = 0; l < _walletState.publicKey.length && _walletState.publicKey[l] === '1'; l++) {
            bytes.push(0);
          }
          return new Uint8Array(bytes.reverse());
        }
      };
    },

    get connected() { return _walletState.connected; },
    get connecting() { return _walletState.connecting; },

    connect: function() {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { 
          resolve: function(result) {
            if (result && result.address) {
              _walletState.publicKey = result.address.toString();
              _walletState.connected = true;
              _walletState.connecting = false;
            }
            resolve(result);
          }, 
          reject: reject 
        };
        _walletState.connecting = true;
        postMsg({ type: 'wallet_connect', requestId: reqId });
      });
    },

    disconnect: function() {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { 
          resolve: function(result) {
            _walletState.publicKey = null;
            _walletState.connected = false;
            _walletState.connecting = false;
            resolve(result);
          }, 
          reject: reject 
        };
        postMsg({ type: 'wallet_disconnect', requestId: reqId });
      });
    },

    signMessage: function(message) {
      return new Promise(function(resolve, reject) {
        if (!(message instanceof Uint8Array)) {
          reject(new Error('Message must be Uint8Array'));
          return;
        }
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var messageBase64 = btoa(String.fromCharCode.apply(null, message));
        postMsg({ type: 'wallet_signMessage', requestId: reqId, data: { message: messageBase64 } });
      });
    },

    signTransaction: function(transaction) {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var txSerialized;
        try {
          if (transaction.serialize) {
            txSerialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
          } else if (transaction.serializeMessage) {
            txSerialized = transaction.serializeMessage();
          } else {
            throw new Error('Transaction must have serialize method');
          }
          var txBase64 = btoa(String.fromCharCode.apply(null, txSerialized));
          postMsg({ type: 'wallet_signTransaction', requestId: reqId, data: { transaction: txBase64 } });
        } catch(e) {
          reject(e);
        }
      });
    },

    signAllTransactions: function(transactions) {
      return new Promise(function(resolve, reject) {
        if (!Array.isArray(transactions)) {
          reject(new Error('Transactions must be an array'));
          return;
        }
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        try {
          var txsBase64 = transactions.map(function(tx) {
            var txSerialized;
            if (tx.serialize) {
              txSerialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
            } else if (tx.serializeMessage) {
              txSerialized = tx.serializeMessage();
            } else {
              throw new Error('Transaction must have serialize method');
            }
            return btoa(String.fromCharCode.apply(null, txSerialized));
          });
          postMsg({ type: 'wallet_signAllTransactions', requestId: reqId, data: { transactions: txsBase64 } });
        } catch(e) {
          reject(e);
        }
      });
    },

    sendTransaction: function(transaction, connection, options) {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var txSerialized;
        try {
          if (transaction.serialize) {
            txSerialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
          } else if (transaction.serializeMessage) {
            txSerialized = transaction.serializeMessage();
          } else {
            throw new Error('Transaction must have serialize method');
          }
          var txBase64 = btoa(String.fromCharCode.apply(null, txSerialized));
          postMsg({ 
            type: 'wallet_sendTransaction', 
            requestId: reqId, 
            data: { 
              transaction: txBase64,
              options: options || {}
            } 
          });
        } catch(e) {
          reject(e);
        }
      });
    },

    on: function(event, callback) {
      if (!_walletEventListeners[event]) {
        _walletEventListeners[event] = [];
      }
      _walletEventListeners[event].push(callback);
    },

    off: function(event, callback) {
      if (_walletEventListeners[event]) {
        _walletEventListeners[event] = _walletEventListeners[event].filter(function(cb) {
          return cb !== callback;
        });
      }
    },

    _updateState: function(newState) {
      var prevConnected = _walletState.connected;
      var prevPublicKey = _walletState.publicKey;
      
      _walletState.publicKey = newState.publicKey || null;
      _walletState.connected = newState.connected || false;
      _walletState.connecting = newState.connecting || false;

      if (prevConnected !== _walletState.connected) {
        if (_walletState.connected) {
          emitWalletEvent('connect', { publicKey: window.solanaWallet.publicKey });
        } else {
          emitWalletEvent('disconnect', {});
        }
      }

      if (prevPublicKey !== _walletState.publicKey && _walletState.publicKey) {
        emitWalletEvent('accountChanged', { publicKey: window.solanaWallet.publicKey });
      }
    },

    _resolveRequest: function(requestId, success, result, error) {
      if (_walletRequests[requestId]) {
        if (success) {
          _walletRequests[requestId].resolve(result);
        } else {
          _walletRequests[requestId].reject(new Error(error || 'Unknown error'));
        }
        delete _walletRequests[requestId];
      }
    }
  };

  window.dispatchEvent(new Event('solanaWalletReady'));
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
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewIdRef = useRef(`webview_${Date.now()}_${Math.random()}`);
  const { registerWebView, unregisterWebView, handleWalletRequest } =
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
        data.type.startsWith("wallet_") &&
        data.requestId
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
