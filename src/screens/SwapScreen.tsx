import React from "react";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

const SWAP_URL = "https://x.rhea.finance/trade";

const SwapScreen: React.FC = () => {
  const { handleMessage, modalState, closeModal } = useWebBridge();

  return (
    <>
      <WebViewScreen url={SWAP_URL} onMessage={handleMessage} />
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

export default SwapScreen;
