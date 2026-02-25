import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import WebViewScreen from "./WebViewScreen";
import BottomModal from "./BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

interface BaseTabScreenProps {
  url: string;
}

const BaseTabScreen: React.FC<BaseTabScreenProps> = ({ url }) => {
  const { handleMessage, modalState, closeModal, webViewRef } = useWebBridge();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      edges={["top"]}
    >
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
    </SafeAreaView>
  );
};

export default BaseTabScreen;
