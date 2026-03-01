import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

type RootStackParamList = {
  Detail: { url: string; title: string; callbackId?: string };
};

type DetailScreenProps = NativeStackScreenProps<RootStackParamList, "Detail">;

const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { url } = route.params;
  const navigation = useNavigation();
  const { handleMessage, modalState, closeModal, webViewRef } = useWebBridge();

  const handleWebViewMessage = (data: any) => {
    if (data.type === "goBack") {
      navigation.goBack();

      if (route.params.callbackId) {
        DeviceEventEmitter.emit("WEB_BRIDGE_CALLBACK", {
          callbackId: route.params.callbackId,
          data: data.data,
        });
      }
      return;
    }

    handleMessage(data);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      edges={["bottom"]}
    >
      <WebViewScreen
        ref={webViewRef}
        url={url}
        onMessage={handleWebViewMessage}
      />
      <BottomModal
        visible={modalState.visible}
        title={modalState.title}
        onClose={closeModal}
      >
        {modalState.url ? (
          <WebViewScreen url={modalState.url} onMessage={handleMessage} />
        ) : null}
      </BottomModal>
    </SafeAreaView>
  );
};

export default DetailScreen;
