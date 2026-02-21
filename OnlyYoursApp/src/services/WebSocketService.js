import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
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
    this.connectionState = 'disconnected'; // 'connected' | 'disconnected' | 'reconnecting'
    this.subscriptions = new Map();
    this.onConnectionStateChange = null; // callback: (state: string) => void
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

    const wsUrl = `${baseUrl.replace(/\/?$/, '')}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 5000,

      onConnect: () => {
        this.connected = true;
        this._emitConnectionState('connected');
      },

      onDisconnect: () => {
        this.connected = false;
        this._emitConnectionState('disconnected');
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message']);
        this.connected = false;
        this._emitConnectionState('reconnecting');
      },

      onWebSocketClose: () => {
        if (this.client && this.client.active) {
          // Client is still active and will attempt reconnect
          this._emitConnectionState('reconnecting');
        } else {
          this._emitConnectionState('disconnected');
        }
      },
    });

    this.client.activate();
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
    const sub = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        callback(message.body);
      }
    });
    this.subscriptions.set(destination, sub);
    return sub;
  }

  unsubscribe(destination) {
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
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
