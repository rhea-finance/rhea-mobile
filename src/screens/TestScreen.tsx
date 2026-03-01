import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import WebViewScreen, { WebViewScreenRef } from "../components/WebViewScreen";

const TestScreen: React.FC = () => {
  const [url, setUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const webViewRef = useRef<WebViewScreenRef>(null);

  const handleLoad = () => {
    if (inputUrl.trim()) {
      let finalUrl = inputUrl.trim();
      
      if (
        !finalUrl.startsWith("http://") &&
        !finalUrl.startsWith("https://") &&
        !finalUrl.startsWith("file://")
      ) {
        finalUrl = "https://" + finalUrl;
      }
      
      setUrl(finalUrl);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputUrl}
          onChangeText={setInputUrl}
          placeholder="Enter URL"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleLoad}
        />
        <TouchableOpacity style={styles.loadButton} onPress={handleLoad}>
          <Text style={styles.loadButtonText}>Load</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        {url ? (
          <WebViewScreen ref={webViewRef} url={url} />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Enter URL to start testing</Text>
            <Text style={styles.emptyHint}>
              Supports http://, https://, or local server address
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
  },
  loadButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  loadButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  webviewContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: "#9ca3af",
  },
});

export default TestScreen;
