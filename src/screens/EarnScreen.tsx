import React from "react";
import BaseTabScreen from "../components/BaseTabScreen";
import { WEB_URLS } from "../config/urls";

const EarnScreen: React.FC = () => {
  return <BaseTabScreen url={WEB_URLS.EARN} />;
};

export default EarnScreen;
