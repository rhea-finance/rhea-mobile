/**
 * Injected JavaScript Bridge for WebView
 * 
 * This script is injected into WebView pages to provide:
 * - window.RheaBridge: Native navigation and modal control
 * - window.solanaWallet: Solana Mobile Wallet Adapter integration
 * 
 * @see WebViewScreen.tsx for usage
 * @see SolanaWalletBridgeContext.tsx for wallet state management
 */
export const INJECTED_BRIDGE_JS = `
(function() {
  if (window.RheaBridge) return;

  var _callbackId = 0;
  var _callbacks = {};
  var _walletRequestId = 0;
  var _walletRequests = {};

  function postMsg(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } else if (window.parent !== window) {
      window.parent.postMessage({ source: 'rhea-bridge', payload: data }, '*');
    }
  }

  window.RheaBridge = {
    _callbacks: _callbacks,
    _invokeCallback: function(id, data) {
      if (_callbacks[id]) {
        try { _callbacks[id](data); } catch(e) {}
        delete _callbacks[id];
      }
    },

    navigate: function(url, options) {
      options = options || {};
      if (typeof options === 'string') {
        options = { title: options };
      }
      var msg = {
        type: 'navigate',
        url: url,
        title: options.title || document.title || ''
      };
      if (typeof options.callback === 'function') {
        var id = 'cb_' + (++_callbackId);
        _callbacks[id] = options.callback;
        msg.callbackId = id;
      }
      postMsg(msg);
    },

    openModal: function(options) {
      options = options || {};
      var msg = {
        type: 'openModal',
        title: options.title || '',
        url: options.url || '',
        data: options.data || null
      };
      if (typeof options.callback === 'function') {
        var id = 'cb_' + (++_callbackId);
        _callbacks[id] = options.callback;
        msg.callbackId = id;
      }
      postMsg(msg);
    },

    goBack: function(data) {
      postMsg({ type: 'goBack', data: data || null });
    },

    closeModal: function() {
      postMsg({ type: 'closeModal' });
    },

    refreshDone: function() {
      postMsg({ type: 'refreshDone' });
    },

    setTabBarVisible: function(visible) {
      postMsg({ type: 'setTabBarVisible', visible: !!visible });
    },

    setRefreshEnabled: function(enabled) {
      postMsg({ type: 'setRefreshEnabled', enabled: !!enabled });
    }
  };

  var originalWindowOpen = window.open;
  window.open = function(url, name, specs) {
    if (window.RheaBridge) {
      if (typeof url === 'string' && url.match(/^https?:/i)) {
        window.RheaBridge.navigate(url);
      } else {
        window.location.href = url;
      }
    } else {
      originalWindowOpen(url, name, specs);
    }
    return null;
  };

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  
  function handleHistoryUrl(url) {
    try {
      var newUrl = new URL(url.toString(), window.location.href);
      if (newUrl.protocol.startsWith('http')) {
        var isDiffPath = newUrl.origin !== window.location.origin || newUrl.pathname !== window.location.pathname;
        if (isDiffPath && window.RheaBridge) {
          window.RheaBridge.navigate(newUrl.href);
          return true;
        }
      }
    } catch(e) {}
    return false;
  }

  history.pushState = function(state, unused, url) {
    if (url && handleHistoryUrl(url)) return;
    return originalPushState.apply(this, arguments);
  };
  history.replaceState = function(state, unused, url) {
    if (url && handleHistoryUrl(url)) return;
    return originalReplaceState.apply(this, arguments);
  };

  window.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a && a.href && a.target !== '_blank') {
      try {
        var newUrl = new URL(a.href, window.location.href);
        if (newUrl.protocol.startsWith('http')) {
          var isDiffPath = newUrl.origin !== window.location.origin || newUrl.pathname !== window.location.pathname;
          if (isDiffPath && window.RheaBridge) {
            e.preventDefault();
            e.stopPropagation();
            window.RheaBridge.navigate(newUrl.href);
          }
        }
      } catch(err) {}
    }
  }, true);

  window.dispatchEvent(new Event('RheaBridgeReady'));

  var _walletState = {
    publicKey: null,
    connected: false,
    connecting: false
  };
  var _walletEventListeners = {};

  function emitWalletEvent(event, data) {
    if (_walletEventListeners[event]) {
      _walletEventListeners[event].forEach(function(callback) {
        try { callback(data); } catch(e) {}
      });
    }
  }

  window.solanaWallet = {
    get publicKey() {
      if (!_walletState.publicKey) return null;
      return {
        toBase58: function() { return _walletState.publicKey; },
        toString: function() { return _walletState.publicKey; },
        toBuffer: function() {
          var bs58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
          var bytes = [0];
          for (var i = 0; i < _walletState.publicKey.length; i++) {
            var c = _walletState.publicKey[i];
            var value = bs58.indexOf(c);
            if (value < 0) throw new Error('Invalid character');
            for (var j = 0; j < bytes.length; j++) bytes[j] *= 58;
            bytes[0] += value;
            var carry = 0;
            for (var k = 0; k < bytes.length; k++) {
              bytes[k] += carry;
              carry = bytes[k] >> 8;
              bytes[k] &= 0xff;
            }
            while (carry > 0) {
              bytes.push(carry & 0xff);
              carry >>= 8;
            }
          }
          for (var l = 0; l < _walletState.publicKey.length && _walletState.publicKey[l] === '1'; l++) {
            bytes.push(0);
          }
          return new Uint8Array(bytes.reverse());
        }
      };
    },

    get connected() { return _walletState.connected; },
    get connecting() { return _walletState.connecting; },

    connect: function() {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { 
          resolve: function(result) {
            if (result && result.address) {
              _walletState.publicKey = result.address.toString();
              _walletState.connected = true;
              _walletState.connecting = false;
            }
            resolve(result);
          }, 
          reject: reject 
        };
        _walletState.connecting = true;
        postMsg({ type: 'wallet_connect', requestId: reqId });
      });
    },

    disconnect: function() {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { 
          resolve: function(result) {
            _walletState.publicKey = null;
            _walletState.connected = false;
            _walletState.connecting = false;
            resolve(result);
          }, 
          reject: reject 
        };
        postMsg({ type: 'wallet_disconnect', requestId: reqId });
      });
    },

    signMessage: function(message) {
      return new Promise(function(resolve, reject) {
        if (!(message instanceof Uint8Array)) {
          reject(new Error('Message must be Uint8Array'));
          return;
        }
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var messageBase64 = btoa(String.fromCharCode.apply(null, message));
        postMsg({ type: 'wallet_signMessage', requestId: reqId, data: { message: messageBase64 } });
      });
    },

    signTransaction: function(transaction) {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var txSerialized;
        try {
          if (transaction.serialize) {
            txSerialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
          } else if (transaction.serializeMessage) {
            txSerialized = transaction.serializeMessage();
          } else {
            throw new Error('Transaction must have serialize method');
          }
          var txBase64 = btoa(String.fromCharCode.apply(null, txSerialized));
          postMsg({ type: 'wallet_signTransaction', requestId: reqId, data: { transaction: txBase64 } });
        } catch(e) {
          reject(e);
        }
      });
    },

    signAllTransactions: function(transactions) {
      return new Promise(function(resolve, reject) {
        if (!Array.isArray(transactions)) {
          reject(new Error('Transactions must be an array'));
          return;
        }
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        try {
          var txsBase64 = transactions.map(function(tx) {
            var txSerialized;
            if (tx.serialize) {
              txSerialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
            } else if (tx.serializeMessage) {
              txSerialized = tx.serializeMessage();
            } else {
              throw new Error('Transaction must have serialize method');
            }
            return btoa(String.fromCharCode.apply(null, txSerialized));
          });
          postMsg({ type: 'wallet_signAllTransactions', requestId: reqId, data: { transactions: txsBase64 } });
        } catch(e) {
          reject(e);
        }
      });
    },

    sendTransaction: function(transaction, connection, options) {
      return new Promise(function(resolve, reject) {
        var reqId = 'wallet_req_' + (++_walletRequestId);
        _walletRequests[reqId] = { resolve: resolve, reject: reject };
        var txSerialized;
        try {
          if (transaction.serialize) {
            txSerialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
          } else if (transaction.serializeMessage) {
            txSerialized = transaction.serializeMessage();
          } else {
            throw new Error('Transaction must have serialize method');
          }
          var txBase64 = btoa(String.fromCharCode.apply(null, txSerialized));
          postMsg({ 
            type: 'wallet_sendTransaction', 
            requestId: reqId, 
            data: { 
              transaction: txBase64,
              options: options || {}
            } 
          });
        } catch(e) {
          reject(e);
        }
      });
    },

    on: function(event, callback) {
      if (!_walletEventListeners[event]) {
        _walletEventListeners[event] = [];
      }
      _walletEventListeners[event].push(callback);
    },

    off: function(event, callback) {
      if (_walletEventListeners[event]) {
        _walletEventListeners[event] = _walletEventListeners[event].filter(function(cb) {
          return cb !== callback;
        });
      }
    },

    _updateState: function(newState) {
      var prevConnected = _walletState.connected;
      var prevPublicKey = _walletState.publicKey;
      
      _walletState.publicKey = newState.publicKey || null;
      _walletState.connected = newState.connected || false;
      _walletState.connecting = newState.connecting || false;

      if (prevConnected !== _walletState.connected) {
        if (_walletState.connected) {
          emitWalletEvent('connect', { publicKey: window.solanaWallet.publicKey });
        } else {
          emitWalletEvent('disconnect', {});
        }
      }

      if (prevPublicKey !== _walletState.publicKey && _walletState.publicKey) {
        emitWalletEvent('accountChanged', { publicKey: window.solanaWallet.publicKey });
      }
    },

    _resolveRequest: function(requestId, success, result, error) {
      if (_walletRequests[requestId]) {
        if (success) {
          _walletRequests[requestId].resolve(result);
        } else {
          _walletRequests[requestId].reject(new Error(error || 'Unknown error'));
        }
        delete _walletRequests[requestId];
      }
    }
  };

  window.dispatchEvent(new Event('solanaWalletReady'));
  
  postMsg({ type: 'wallet_requestState' });
})();
true;
`;
