import React from "react";
import BaseTabScreen from "../components/BaseTabScreen";
import { WEB_URLS } from "../config/urls";

const BorrowScreen: React.FC = () => {
  return <BaseTabScreen url={WEB_URLS.BORROW} />;
};

export default BorrowScreen;
