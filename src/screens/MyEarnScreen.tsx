import React from "react";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

const MY_EARN_URL = "https://app.rhea.finance/portfolio";

const MyEarnScreen: React.FC = () => {
  const { handleMessage, modalState, closeModal } = useWebBridge();

  return (
    <>
      <WebViewScreen url={MY_EARN_URL} onMessage={handleMessage} />
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

export default MyEarnScreen;
