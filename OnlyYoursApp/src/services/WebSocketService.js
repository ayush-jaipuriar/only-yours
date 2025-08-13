import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  async connect(baseUrl) {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('Missing auth token');

    // baseUrl should be like http://localhost:8080
    const wsUrl = `${baseUrl.replace(/\/?$/,'')}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onStompError: () => {},
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.clear();
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
}

export default new WebSocketService();


