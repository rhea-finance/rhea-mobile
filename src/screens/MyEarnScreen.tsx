import React from "react";
import BaseTabScreen from "../components/BaseTabScreen";
import { WEB_URLS } from "../config/urls";

const MyEarnScreen: React.FC = () => {
  return <BaseTabScreen url={WEB_URLS.MY_EARN} />;
};

export default MyEarnScreen;
