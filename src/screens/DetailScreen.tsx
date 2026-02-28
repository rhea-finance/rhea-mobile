import React, { useCallback } from "react";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

type DetailScreenRouteProp = RouteProp<
  { Detail: { url: string; title: string; callbackId?: string } },
  "Detail"
>;

interface DetailScreenProps {
  route: DetailScreenRouteProp;
}

/**
 * Secondary Page
 * - openModal/closeModal: same as BaseTabScreen (useWebBridge + BottomModal).
 * - goBack: navigation.goBack() + emit WEB_BRIDGE_CALLBACK for parent callback.
 */
const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { url } = route.params;
  const navigation = useNavigation();
  const {
    handleMessage: bridgeHandleMessage,
    modalState,
    closeModal,
    webViewRef,
  } = useWebBridge();

  const handleMessage = useCallback(
    (data: any) => {
      if (data.type === "goBack") {
        navigation.goBack();
        if (route.params.callbackId) {
          DeviceEventEmitter.emit("WEB_BRIDGE_CALLBACK", {
            callbackId: route.params.callbackId,
            data: data.data,
          });
        }
      } else {
        bridgeHandleMessage(data);
      }
    },
    [navigation, route.params.callbackId, bridgeHandleMessage],
  );

  return (
    <>
      <WebViewScreen ref={webViewRef} url={url} onMessage={handleMessage} />
      <BottomModal
        visible={modalState.visible}
        title={modalState.title}
        onClose={closeModal}
      >
        {modalState.url ? (
          <WebViewScreen url={modalState.url} onMessage={handleMessage} />
        ) : null}
      </BottomModal>
    </>
  );
};

export default DetailScreen;
