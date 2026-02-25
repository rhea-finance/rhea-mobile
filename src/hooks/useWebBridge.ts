import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTabBar } from "../contexts/TabBarContext";
import type { WebViewScreenRef } from "../components/WebViewScreen";

type StackParamList = {
  Detail: { url: string; title: string; callbackId?: string };
  [key: string]: any;
};

export interface ModalState {
  visible: boolean;
  title: string;
  url: string;
  data: any;
  callbackId: string;
  hideTabBar?: boolean;
}

const initialModalState: ModalState = {
  visible: false,
  title: "",
  url: "",
  data: null,
  callbackId: "",
  hideTabBar: false,
};

/**
 * Hook for centrally handling WebView Bridge messages
 *
 * Supported message types:
 * - navigate    → push secondary page (supports callbackId)
 * - openModal   → open bottom Modal (supports callbackId)
 * - closeModal  → close Modal
 * - goBack      → go back and pass data to callback
 * - setTabBarVisible → control TabBar visibility
 * (refreshDone is handled inside WebViewScreen)
 */
export function useWebBridge() {
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const { setTabBarVisible } = useTabBar();
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const webViewRef = useRef<WebViewScreenRef>(null);

  // Trigger Web callback
  const invokeCallback = useCallback((callbackId: string, data?: any) => {
    if (callbackId && webViewRef.current) {
      const dataStr = JSON.stringify(data ?? null);
      webViewRef.current.injectJavaScript(
        `window.RheaBridge._invokeCallback('${callbackId}', ${dataStr}); true;`,
      );
    }
  }, []);

  const closeModal = useCallback(
    (resultData?: any) => {
      const cbId = modalState.callbackId;
      const hideTabBar = modalState.hideTabBar;

      setModalState(initialModalState);

      if (hideTabBar) {
        setTabBarVisible(true);
      }
      if (cbId) {
        invokeCallback(cbId, resultData);
      }
    },
    [
      modalState.callbackId,
      modalState.hideTabBar,
      invokeCallback,
      setTabBarVisible,
    ],
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "WEB_BRIDGE_CALLBACK",
      (payload) => {
        if (payload && payload.callbackId) {
          invokeCallback(payload.callbackId, payload.data);
        }
      },
    );
    return () => subscription.remove();
  }, [invokeCallback]);

  const handleMessage = useCallback(
    (data: any) => {
      switch (data.type) {
        case "navigate":
          if (data.url) {
            navigation.navigate("Detail", {
              url: data.url,
              title: data.title || "",
              callbackId: data.callbackId || "",
            });
          }
          break;

        case "openModal":
          if (data.hideTabBar) {
            setTabBarVisible(false);
          }
          setModalState({
            visible: true,
            title: data.title || "",
            url: data.url || "",
            data: data.data || null,
            callbackId: data.callbackId || "",
            hideTabBar: data.hideTabBar || false,
          });
          break;

        case "goBack":
          // Modal calls goBack → close Modal and trigger callback
          closeModal(data.data);
          break;

        case "closeModal":
          closeModal(data.data);
          break;

        case "setTabBarVisible":
          setTabBarVisible(data.visible);
          break;
      }
    },
    [navigation, closeModal, setTabBarVisible],
  );

  return {
    handleMessage,
    modalState,
    closeModal,
    webViewRef,
    invokeCallback,
  };
}
