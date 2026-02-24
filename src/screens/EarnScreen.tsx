import React from "react";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

const EARN_URL = "http://localhost:3333";

const EarnScreen: React.FC = () => {
  const { handleMessage, modalState, closeModal } = useWebBridge();

  return (
    <>
      <WebViewScreen url={EARN_URL} onMessage={handleMessage} />
      <BottomModal
        visible={modalState.visible}
        title={modalState.title}
        onClose={closeModal}
      >
        {modalState.url ? <WebViewScreen url={modalState.url} /> : null}
      </BottomModal>
    </>
  );
};

export default EarnScreen;
