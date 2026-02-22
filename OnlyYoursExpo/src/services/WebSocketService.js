import { Client } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * WebSocketService — singleton STOMP over SockJS client.
 *
 * Sprint 6: Added connection state tracking and onConnectionStateChange callback.
 * This allows UI components (ReconnectionBanner) to react to connection loss/recovery.
 *
 * Connection states:
 * - 'connected': STOMP session established, ready to send/receive
 * - 'disconnected': Not connected (initial state, or after explicit disconnect)
 * - 'reconnecting': Client is attempting to reconnect after a drop
 *
 * The STOMP client has built-in reconnect with exponential backoff (reconnectDelay=5000ms).
 * We surface this state so the UI can show a "Reconnecting..." banner.
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connectionState = 'disconnected';
    this.subscriptions = new Map();
    this.onConnectionStateChange = null;
    this._nextSubId = 1;
    this.connectPromise = null;
  }

  /**
   * Register a callback to be notified of connection state changes.
   * Called with: 'connected', 'disconnected', or 'reconnecting'
   */
  setConnectionStateListener(callback) {
    this.onConnectionStateChange = callback;
  }

  _emitConnectionState(state) {
    this.connectionState = state;
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
  }

  isConnected() {
    return Boolean(this.client && this.client.active && this.connected);
  }

  async connect(baseUrl) {
    if (this.isConnected()) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) throw new Error('Missing auth token');

    const brokerURL = `${baseUrl.replace(/^http/, 'ws').replace(/\/?$/, '')}/ws-native`;
    const webSocketFactory = typeof WebSocket === 'function'
      ? () => new WebSocket(brokerURL, ['v12.stomp', 'v11.stomp', 'v10.stomp'])
      : undefined;
    const promise = new Promise((resolve, reject) => {
      const CONNECTION_TIMEOUT_MS = 15000;
      let settled = false;

      const rejectOnce = (message) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(message));
        }
      };

      const timeout = setTimeout(() => {
        rejectOnce(`WebSocket connection timed out (${brokerURL})`);
      }, CONNECTION_TIMEOUT_MS);

      this.client = new Client({
        brokerURL,
        webSocketFactory,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: () => {},
        // React Native WebSocket implementations can strip STOMP NULL frame terminators.
        // These flags keep frame parsing stable on Android dev clients.
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        reconnectDelay: 5000,

        onWebSocketOpen: () => {
          console.log('[WebSocket] Socket opened:', brokerURL);
        },

        onConnect: () => {
          console.log('[WebSocket] STOMP connected');
          this.connected = true;
          this._emitConnectionState('connected');
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve();
          }
        },

        onDisconnect: () => {
          this.connected = false;
          this._emitConnectionState('disconnected');
        },

        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error:', frame.headers['message']);
          this.connected = false;
          this._emitConnectionState('reconnecting');
          rejectOnce(frame.headers['message'] || 'STOMP connection error');
        },

        onWebSocketClose: (event) => {
          const code = event?.code != null ? `code=${event.code}` : 'code=unknown';
          const reason = event?.reason ? ` reason=${event.reason}` : '';
          console.warn(`[WebSocket] Socket closed (${code}${reason})`);

          if (this.client && this.client.active) {
            this._emitConnectionState('reconnecting');
          } else {
            this._emitConnectionState('disconnected');
          }
          if (settled) {
            return;
          }
          rejectOnce(`WebSocket closed before CONNECTED (${code}${reason})`);
        },

        onWebSocketError: (event) => {
          const message = event?.message || 'Unknown WebSocket error';
          rejectOnce(`WebSocket error: ${message}`);
        },
      });

      this.client.activate();
    });

    const trackedPromise = promise.finally(() => {
      if (this.connectPromise === trackedPromise) {
        this.connectPromise = null;
      }
    });
    this.connectPromise = trackedPromise;
    return trackedPromise;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connectPromise = null;
      this.connected = false;
      this.subscriptions.clear();
      this._emitConnectionState('disconnected');
    }
  }

  subscribe(destination, callback) {
    if (!this.client || !this.connected) return null;

    const subId = this._nextSubId++;
    const stompSub = this.client.subscribe(destination, (message) => {
      const rawBody = message.body;
      const trimmedBody = typeof rawBody === 'string' ? rawBody.trim() : rawBody;

      if (typeof trimmedBody === 'string' && (trimmedBody.startsWith('{') || trimmedBody.startsWith('['))) {
        try {
          callback(JSON.parse(trimmedBody));
          return;
        } catch (error) {
          console.warn('[WebSocket] Failed to parse message body as JSON:', error?.message || error);
        }
      }

      callback(rawBody);
    });

    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, new Map());
    }
    this.subscriptions.get(destination).set(subId, stompSub);

    return {
      id: subId,
      destination,
      unsubscribe: () => this._unsubscribeById(destination, subId),
    };
  }

  _unsubscribeById(destination, subId) {
    const subs = this.subscriptions.get(destination);
    if (subs) {
      const stompSub = subs.get(subId);
      if (stompSub) {
        stompSub.unsubscribe();
        subs.delete(subId);
        if (subs.size === 0) {
          this.subscriptions.delete(destination);
        }
      }
    }
  }

  unsubscribe(destination) {
    const subs = this.subscriptions.get(destination);
    if (subs) {
      for (const stompSub of subs.values()) {
        stompSub.unsubscribe();
      }
      this.subscriptions.delete(destination);
    }
  }

  sendMessage(destination, body) {
    if (!this.client || !this.connected) return false;
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    this.client.publish({ destination, body: payload });
    return true;
  }

  getConnectionState() {
    return this.connectionState;
  }
}

export default new WebSocketService();
