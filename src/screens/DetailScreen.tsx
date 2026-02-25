import React from "react";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import WebViewScreen from "../components/WebViewScreen";

type DetailScreenRouteProp = RouteProp<
  { Detail: { url: string; title: string; callbackId?: string } },
  "Detail"
>;

interface DetailScreenProps {
  route: DetailScreenRouteProp;
}

/**
 * Secondary Page
 * When RheaBridge.goBack(data) is called within the page,
 * WebViewScreen's onMessage receives the goBack message.
 * However, goBack in DetailScreen must be handled by the parent Stack's useWebBridge,
 * because callbackId is in the parent WebView's callback registry.
 *
 * Handling: After the WebView in DetailScreen receives goBack,
 * navigation.goBack() returns, and triggers the callback in parent via route.params.callbackId
 */
const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { url } = route.params;
  const navigation = useNavigation();

  const handleMessage = (data: any) => {
    if (data.type === "goBack") {
      // Go back to the previous screen
      navigation.goBack();

      // Trigger the callback event registered in useWebBridge
      if (route.params.callbackId) {
        DeviceEventEmitter.emit("WEB_BRIDGE_CALLBACK", {
          callbackId: route.params.callbackId,
          data: data.data,
        });
      }
    }
  };

  return <WebViewScreen url={url} onMessage={handleMessage} />;
};

export default DetailScreen;
