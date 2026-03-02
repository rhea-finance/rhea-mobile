import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

interface WebViewRef {
  injectJavaScript: (js: string) => void;
}

interface WalletRequest {
  type: string;
  requestId: string;
  data?: any;
}

interface SolanaWalletBridgeContextValue {
  registerWebView: (id: string, ref: WebViewRef) => void;
  unregisterWebView: (id: string) => void;
  handleWalletRequest: (request: WalletRequest) => Promise<void>;
  getCurrentWalletState: () => { publicKey: string | null; connected: boolean };
}

const SolanaWalletBridgeContext =
  createContext<SolanaWalletBridgeContextValue | null>(null);

export const useSolanaWalletBridge = () => {
  const context = useContext(SolanaWalletBridgeContext);
  if (!context) {
    throw new Error(
      "useSolanaWalletBridge must be used within SolanaWalletBridgeProvider",
    );
  }
  return context;
};

export const SolanaWalletBridgeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const webViewRefs = useRef<Map<string, WebViewRef>>(new Map());
  const {
    account,
    connect,
    disconnect,
    signMessage,
    signAndSendTransaction,
    connection,
  } = useMobileWallet();
  const [prevAccount, setPrevAccount] = useState(account);

  const broadcastToAllWebViews = useCallback((js: string) => {
    webViewRefs.current.forEach((ref) => {
      try {
        ref.injectJavaScript(js);
      } catch (e) {
        console.error("Failed to inject JS to WebView:", e);
      }
    });
  }, []);

  useEffect(() => {
    const publicKeyStr = account?.address || null;
    const prevPublicKeyStr = prevAccount?.address || null;

    if (publicKeyStr !== prevPublicKeyStr) {
      setPrevAccount(account);

      const stateUpdateJS = `
        (function() {
          if (window.solanaWallet && window.solanaWallet._updateState) {
            window.solanaWallet._updateState({
              publicKey: ${publicKeyStr ? `"${publicKeyStr}"` : "null"},
              connected: ${!!publicKeyStr},
              connecting: false
            });
          }
        })();
        true;
      `;
      broadcastToAllWebViews(stateUpdateJS);
    }
  }, [account, prevAccount, broadcastToAllWebViews]);

  const registerWebView = useCallback((id: string, ref: WebViewRef) => {
    webViewRefs.current.set(id, ref);
  }, []);

  const unregisterWebView = useCallback((id: string) => {
    webViewRefs.current.delete(id);
  }, []);

  const handleWalletRequest = useCallback(
    async (request: WalletRequest) => {
      const { type, requestId, data } = request;

      if (type === "wallet_requestState") {
        const publicKeyStr = account?.address || null;
        const stateUpdateJS = `
          (function() {
            if (window.solanaWallet && window.solanaWallet._updateState) {
              window.solanaWallet._updateState({
                publicKey: ${publicKeyStr ? `"${publicKeyStr}"` : "null"},
                connected: ${!!publicKeyStr},
                connecting: false
              });
            }
          })();
          true;
        `;
        broadcastToAllWebViews(stateUpdateJS);
        return;
      }

      const sendResponse = (success: boolean, result?: any, error?: string) => {
        const responseJS = `
          (function() {
            if (window.solanaWallet && window.solanaWallet._resolveRequest) {
              window.solanaWallet._resolveRequest("${requestId}", ${success}, ${JSON.stringify(result)}, ${JSON.stringify(error)});
            }
          })();
          true;
        `;
        broadcastToAllWebViews(responseJS);
      };

      try {
        if (type === "wallet_connect") {
          const result = await connect();
          const connectedAccount = result || account;
          sendResponse(true, connectedAccount);
        } else if (type === "wallet_disconnect") {
          await disconnect();
          sendResponse(true);
        } else if (type === "wallet_sendTransaction") {
          if (!data?.transaction) {
            throw new Error("Transaction is required");
          }
          const txBytes = Uint8Array.from(atob(data.transaction), c => c.charCodeAt(0));
          let transaction: Transaction | VersionedTransaction;

          try {
            transaction = VersionedTransaction.deserialize(txBytes);
          } catch {
            transaction = Transaction.from(txBytes);
          }

          if (!account) {
            throw new Error("Wallet not connected");
          }

          const signature = await signAndSendTransaction(transaction, 0);
          sendResponse(true, { signature });
        } else if (type === "wallet_signMessage") {
          if (!data?.message) {
            throw new Error("Message is required");
          }
          const messageBytes = Uint8Array.from(
            atob(data.message)
              .split("")
              .map((c) => c.charCodeAt(0)),
          );
          const signature = await signMessage(messageBytes);
          const signatureBase64 = btoa(
            String.fromCharCode.apply(null, Array.from(signature)),
          );
          sendResponse(true, { signature: signatureBase64 });
        } else if (type === "wallet_signTransaction") {
          if (!data?.transaction) {
            throw new Error("Transaction is required");
          }
          const txBytes = Uint8Array.from(atob(data.transaction), c => c.charCodeAt(0));
          let transaction: Transaction | VersionedTransaction;

          try {
            transaction = VersionedTransaction.deserialize(txBytes);
          } catch {
            transaction = Transaction.from(txBytes);
          }

          if (!account) {
            throw new Error("Wallet not connected");
          }

          const { blockhash } = await connection.getLatestBlockhash();

          if (transaction instanceof Transaction) {
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new (require("@solana/web3.js").PublicKey)(
              account.address,
            );
          }

          const signature = await signAndSendTransaction(transaction, 0);
          sendResponse(true, { signature });
        } else if (type === "wallet_signAllTransactions") {
          if (!data?.transactions || !Array.isArray(data.transactions)) {
            throw new Error("Transactions array is required");
          }

          const signatures: string[] = [];
          for (const txBase64 of data.transactions) {
            const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
            let transaction: Transaction | VersionedTransaction;

            try {
              transaction = VersionedTransaction.deserialize(txBytes);
            } catch {
              transaction = Transaction.from(txBytes);
            }

            if (!account) {
              throw new Error("Wallet not connected");
            }

            const { blockhash } = await connection.getLatestBlockhash();

            if (transaction instanceof Transaction) {
              transaction.recentBlockhash = blockhash;
              transaction.feePayer = new (
                require("@solana/web3.js").PublicKey
              )(account.address);
            }

            const signature = await signAndSendTransaction(transaction, 0);
            signatures.push(signature);
          }

          sendResponse(true, { signatures });
        } else {
          sendResponse(false, null, `Unknown request type: ${type}`);
        }
      } catch (error: any) {
        console.error("Wallet request error:", error);
        sendResponse(false, null, error.message || "Unknown error");
      }
    },
    [
      account,
      connect,
      disconnect,
      signMessage,
      signAndSendTransaction,
      connection,
      broadcastToAllWebViews,
    ],
  );

  const getCurrentWalletState = useCallback(() => {
    const publicKeyStr = account?.address ? String(account.address) : null;
    return {
      publicKey: publicKeyStr,
      connected: !!publicKeyStr,
    };
  }, [account]);

  const value: SolanaWalletBridgeContextValue = {
    registerWebView,
    unregisterWebView,
    handleWalletRequest,
    getCurrentWalletState,
  };

  return (
    <SolanaWalletBridgeContext.Provider value={value}>
      {children}
    </SolanaWalletBridgeContext.Provider>
  );
};
