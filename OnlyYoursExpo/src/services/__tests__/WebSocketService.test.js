import { Client } from '@stomp/stompjs';

jest.mock('@stomp/stompjs', () => {
  return {
    Client: jest.fn(),
  };
});

let service;

function createServiceInstance() {
  jest.resetModules();
  jest.doMock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve('mock-jwt-token')),
  }));
  jest.doMock('@stomp/stompjs', () => ({ Client }));
  return require('../WebSocketService').default;
}

const createMockStompSub = () => ({ unsubscribe: jest.fn() });

function setupDefaultClient() {
  Client.mockImplementation((config) => ({
    _config: config,
    active: true,
    activate: jest.fn(() => {
      Promise.resolve().then(() => config.onConnect());
    }),
    deactivate: jest.fn(),
    subscribe: jest.fn(() => createMockStompSub()),
    publish: jest.fn(),
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultClient();
  service = createServiceInstance();
});

describe('WebSocketService', () => {
  describe('connect()', () => {
    it('should resolve when onConnect fires', async () => {
      await service.connect('http://localhost:8080');
      expect(service.connected).toBe(true);
      expect(service.connectionState).toBe('connected');
    });

    it('should throw if no auth token', async () => {
      const AsyncStorageMock = require('@react-native-async-storage/async-storage');
      AsyncStorageMock.getItem.mockResolvedValueOnce(null);

      await expect(service.connect('http://localhost:8080')).rejects.toThrow('Missing auth token');
    });

    it('should reject on STOMP error', async () => {
      Client.mockImplementation((config) => ({
        active: false,
        activate: jest.fn(() => {
          Promise.resolve().then(() =>
            config.onStompError({ headers: { message: 'Auth failed' } })
          );
        }),
        deactivate: jest.fn(),
        subscribe: jest.fn(),
        publish: jest.fn(),
      }));

      await expect(service.connect('http://localhost:8080')).rejects.toThrow('Auth failed');
      expect(service.connected).toBe(false);
    });

    it('should reject on timeout', async () => {
      Client.mockImplementation((config) => ({
        active: true,
        activate: jest.fn(),
        deactivate: jest.fn(),
        subscribe: jest.fn(),
        publish: jest.fn(),
      }));

      const svc = createServiceInstance();

      const connectPromise = svc.connect('http://localhost:8080');

      await expect(connectPromise).rejects.toThrow('WebSocket connection timed out');
    }, 22000);

    it('should build correct broker URL from http base', async () => {
      await service.connect('http://192.168.1.101:8080');
      expect(Client.mock.calls[0][0].brokerURL).toBe('ws://192.168.1.101:8080/ws-native');
    });

    it('should build correct broker URL from https base', async () => {
      await service.connect('https://api.example.com');
      expect(Client.mock.calls[0][0].brokerURL).toBe('wss://api.example.com/ws-native');
    });

    it('should emit connected state on successful connect', async () => {
      const listener = jest.fn();
      service.setConnectionStateListener(listener);
      await service.connect('http://localhost:8080');
      expect(listener).toHaveBeenCalledWith('connected');
    });

    it('should enable React Native STOMP frame compatibility flags', async () => {
      await service.connect('http://localhost:8080');
      const config = Client.mock.calls[0][0];
      expect(config.forceBinaryWSFrames).toBe(true);
      expect(config.appendMissingNULLonIncoming).toBe(true);
    });
  });

  describe('subscribe() — multiple subscriptions per destination', () => {
    beforeEach(async () => {
      await service.connect('http://localhost:8080');
    });

    it('should return subscription with id and unsubscribe', () => {
      const sub = service.subscribe('/topic/test', jest.fn());

      expect(sub).not.toBeNull();
      expect(sub.id).toBeDefined();
      expect(sub.destination).toBe('/topic/test');
      expect(typeof sub.unsubscribe).toBe('function');
    });

    it('should allow multiple subscriptions to the same destination', () => {
      const sub1 = service.subscribe('/user/queue/game-events', jest.fn());
      const sub2 = service.subscribe('/user/queue/game-events', jest.fn());

      expect(sub1.id).not.toBe(sub2.id);
      expect(service.client.subscribe).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe one without affecting the other', () => {
      const sub1 = service.subscribe('/user/queue/game-events', jest.fn());
      const sub2 = service.subscribe('/user/queue/game-events', jest.fn());

      sub1.unsubscribe();

      const destSubs = service.subscriptions.get('/user/queue/game-events');
      expect(destSubs.size).toBe(1);
      expect(destSubs.has(sub2.id)).toBe(true);
    });

    it('should remove destination from map when last sub is removed', () => {
      const sub1 = service.subscribe('/topic/test', jest.fn());
      sub1.unsubscribe();
      expect(service.subscriptions.has('/topic/test')).toBe(false);
    });

    it('should return null when not connected', () => {
      service.connected = false;
      expect(service.subscribe('/topic/test', jest.fn())).toBeNull();
    });

    it('should parse JSON body and pass parsed object to callback', () => {
      const callback = jest.fn();
      service.subscribe('/topic/test', callback);

      const stompCallback = service.client.subscribe.mock.calls[0][1];
      stompCallback({ body: '{"type":"QUESTION","questionId":1}' });

      expect(callback).toHaveBeenCalledWith({ type: 'QUESTION', questionId: 1 });
    });

    it('should pass raw body if JSON parse fails', () => {
      const callback = jest.fn();
      service.subscribe('/topic/test', callback);

      const stompCallback = service.client.subscribe.mock.calls[0][1];
      stompCallback({ body: 'not-json' });

      expect(callback).toHaveBeenCalledWith('not-json');
    });
  });

  describe('unsubscribe(destination)', () => {
    it('should unsubscribe all subs for a destination', async () => {
      await service.connect('http://localhost:8080');
      service.subscribe('/topic/test', jest.fn());
      service.subscribe('/topic/test', jest.fn());

      service.unsubscribe('/topic/test');
      expect(service.subscriptions.has('/topic/test')).toBe(false);
    });
  });

  describe('disconnect()', () => {
    it('should clear all subscriptions and reset state', async () => {
      await service.connect('http://localhost:8080');
      service.subscribe('/topic/test', jest.fn());
      service.subscribe('/user/queue/events', jest.fn());

      service.disconnect();

      expect(service.client).toBeNull();
      expect(service.connected).toBe(false);
      expect(service.subscriptions.size).toBe(0);
      expect(service.connectionState).toBe('disconnected');
    });

    it('should emit disconnected state', async () => {
      await service.connect('http://localhost:8080');
      const listener = jest.fn();
      service.setConnectionStateListener(listener);

      service.disconnect();
      expect(listener).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('sendMessage()', () => {
    it('should publish JSON stringified body', async () => {
      await service.connect('http://localhost:8080');
      service.sendMessage('/app/game.answer', { sessionId: 'abc', answer: 'B' });

      expect(service.client.publish).toHaveBeenCalledWith({
        destination: '/app/game.answer',
        body: '{"sessionId":"abc","answer":"B"}',
      });
    });

    it('should not publish when disconnected', async () => {
      await service.connect('http://localhost:8080');
      service.connected = false;
      service.sendMessage('/app/game.answer', { answer: 'A' });
      expect(service.client.publish).not.toHaveBeenCalled();
    });
  });
});
