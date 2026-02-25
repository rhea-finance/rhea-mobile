import React from "react";
import BaseTabScreen from "../components/BaseTabScreen";
import { WEB_URLS } from "../config/urls";

const SwapScreen: React.FC = () => {
  return <BaseTabScreen url={WEB_URLS.SWAP} />;
};

export default SwapScreen;
