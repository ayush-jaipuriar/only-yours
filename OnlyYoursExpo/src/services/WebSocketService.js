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

  async connect(baseUrl) {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) throw new Error('Missing auth token');

    const brokerURL = `${baseUrl.replace(/^http/, 'ws').replace(/\/?$/, '')}/ws-native`;

    return new Promise((resolve, reject) => {
      const CONNECTION_TIMEOUT_MS = 10000;
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket connection timed out'));
        }
      }, CONNECTION_TIMEOUT_MS);

      this.client = new Client({
        brokerURL,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: () => {},
        reconnectDelay: 5000,

        onConnect: () => {
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
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(new Error(frame.headers['message'] || 'STOMP connection error'));
          }
        },

        onWebSocketClose: () => {
          if (this.client && this.client.active) {
            this._emitConnectionState('reconnecting');
          } else {
            this._emitConnectionState('disconnected');
          }
        },
      });

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.clear();
      this._emitConnectionState('disconnected');
    }
  }

  subscribe(destination, callback) {
    if (!this.client || !this.connected) return null;

    const subId = this._nextSubId++;
    const stompSub = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        callback(message.body);
      }
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
    if (!this.client || !this.connected) return;
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    this.client.publish({ destination, body: payload });
  }

  getConnectionState() {
    return this.connectionState;
  }
}

export default new WebSocketService();
