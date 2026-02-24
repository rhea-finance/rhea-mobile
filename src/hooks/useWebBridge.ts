import { useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type StackParamList = {
  Detail: { url: string; title: string };
  [key: string]: any;
};

export interface ModalState {
  visible: boolean;
  title: string;
  url: string;
  data: any;
}

const initialModalState: ModalState = {
  visible: false,
  title: "",
  url: "",
  data: null,
};

/**
 * 统一处理 WebView Bridge 消息的 Hook
 *
 * 支持的消息类型：
 * - { type: "navigate", url, title? }   → push 二级页面
 * - { type: "openModal", title, url?, data? } → 打开底部 Modal
 * - { type: "closeModal" }               → 关闭 Modal
 */
export function useWebBridge() {
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const closeModal = useCallback(() => {
    setModalState(initialModalState);
  }, []);

  const handleMessage = useCallback(
    (data: any) => {
      switch (data.type) {
        case "navigate":
          if (data.url) {
            navigation.navigate("Detail", {
              url: data.url,
              title: data.title || "",
            });
          }
          break;

        case "openModal":
          setModalState({
            visible: true,
            title: data.title || "",
            url: data.url || "",
            data: data.data || null,
          });
          break;

        case "closeModal":
          closeModal();
          break;
      }
    },
    [navigation, closeModal],
  );

  return { handleMessage, modalState, closeModal };
}
