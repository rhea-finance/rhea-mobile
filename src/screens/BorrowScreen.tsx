import React from "react";
import WebViewScreen from "../components/WebViewScreen";
import BottomModal from "../components/BottomModal";
import { useWebBridge } from "../hooks/useWebBridge";

const BORROW_URL = "https://x.rhea.finance";

const BorrowScreen: React.FC = () => {
  const { handleMessage, modalState, closeModal } = useWebBridge();

  return (
    <>
      <WebViewScreen url={BORROW_URL} onMessage={handleMessage} />
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

export default BorrowScreen;
