import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';

let mockConnectionStateListener = null;
let mockIsConnected = false;

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../services/WebSocketService', () => ({
  connect: jest.fn(() => {
    mockIsConnected = true;
    mockConnectionStateListener?.('connected');
    return Promise.resolve();
  }),
  disconnect: jest.fn(() => {
    mockIsConnected = false;
    mockConnectionStateListener?.('disconnected');
  }),
  subscribe: jest.fn(() => ({ id: 1, destination: '/test', unsubscribe: jest.fn() })),
  unsubscribe: jest.fn(),
  sendMessage: jest.fn(),
  setConnectionStateListener: jest.fn((listener) => {
    mockConnectionStateListener = listener;
  }),
  getConnectionState: jest.fn(() => 'disconnected'),
  isConnected: jest.fn(() => mockIsConnected),
  hasActiveClient: jest.fn(() => false),
}));

jest.mock('../../services/NotificationService', () => ({
  registerForPushNotifications: jest.fn(() => Promise.resolve(null)),
  sendTokenToBackend: jest.fn(() => Promise.resolve()),
  addNotificationResponseListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => Promise.resolve(null)),
  mapNotificationResponseToIntent: jest.fn(() => null),
}));

jest.mock('../../services/api', () => {
  const api = { post: jest.fn(), get: jest.fn() };
  api.interceptors = { request: { use: jest.fn() }, response: { use: jest.fn() } };
  return { __esModule: true, default: api, setLogoutHandler: jest.fn() };
});

jest.mock('../../config', () => ({
  API_BASE_URL: 'http://localhost:8080',
  API_URL: 'http://localhost:8080/api',
}));

const WebSocketService = require('../../services/WebSocketService');
const NotificationService = require('../../services/NotificationService');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const renderAuthHook = async () => {
  const rendered = renderHook(() => useAuth(), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return rendered;
};

describe('AuthContext — Game Status Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionStateListener = null;
    mockIsConnected = false;
  });

  it('should provide auth context values', async () => {
    const { result } = await renderAuthHook();

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.shouldShowOnboarding).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.startOnboarding).toBe('function');
    expect(typeof result.current.completeOnboarding).toBe('function');
    expect(typeof result.current.replayOnboarding).toBe('function');
  });

  it('should expose setNavigationRef and setGameContextRef', async () => {
    const { result } = await renderAuthHook();

    expect(typeof result.current.setNavigationRef).toBe('function');
    expect(typeof result.current.setGameContextRef).toBe('function');
  });

  describe('INVITATION_SENT status handling (BUG-2 fix)', () => {
    it('should call startGame and navigate on INVITATION_SENT', async () => {
      const { result } = await renderAuthHook();

      const mockNav = { navigate: jest.fn() };
      const mockGameCtx = { startGame: jest.fn(), endGame: jest.fn(), submitAnswer: jest.fn() };

      act(() => {
        result.current.setNavigationRef(mockNav);
        result.current.setGameContextRef(mockGameCtx);
      });

      const subscribeCalls = WebSocketService.subscribe.mock.calls;
      const gameEventsCall = subscribeCalls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      if (gameEventsCall) {
        const callback = gameEventsCall[1];
        act(() => {
          callback({
            type: 'STATUS',
            status: 'INVITATION_SENT',
            sessionId: 'session-123',
            message: 'Invitation sent to Partner',
          });
        });

        expect(mockGameCtx.startGame).toHaveBeenCalledWith('session-123');
        expect(mockNav.navigate).toHaveBeenCalledWith('Game', { sessionId: 'session-123' });
      }
    });

    it('should not crash on INVITATION_SENT without sessionId', async () => {
      const { result } = await renderAuthHook();

      const mockNav = { navigate: jest.fn() };
      const mockGameCtx = { startGame: jest.fn() };

      act(() => {
        result.current.setNavigationRef(mockNav);
        result.current.setGameContextRef(mockGameCtx);
      });

      const subscribeCalls = WebSocketService.subscribe.mock.calls;
      const gameEventsCall = subscribeCalls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      if (gameEventsCall) {
        const callback = gameEventsCall[1];
        act(() => {
          callback({
            type: 'STATUS',
            status: 'INVITATION_SENT',
            message: 'Invitation sent',
          });
        });

        expect(mockGameCtx.startGame).not.toHaveBeenCalled();
        expect(mockNav.navigate).not.toHaveBeenCalled();
      }
    });

    it('should show alert on INVITATION_DECLINED', async () => {
      await renderAuthHook();

      const subscribeCalls = WebSocketService.subscribe.mock.calls;
      const gameEventsCall = subscribeCalls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      if (gameEventsCall) {
        const callback = gameEventsCall[1];
        act(() => {
          callback({
            type: 'STATUS',
            status: 'INVITATION_DECLINED',
            message: 'Partner declined the invitation',
          });
        });

        expect(Alert.alert).toHaveBeenCalledWith(
          'Invitation Declined',
          'Partner declined the invitation'
        );
      }
    });

    it('should handle ACTIVE_SESSION_EXISTS by opening the existing game', async () => {
      const { result } = await renderAuthHook();

      const mockNav = { navigate: jest.fn() };
      const mockGameCtx = { startGame: jest.fn(), endGame: jest.fn() };

      act(() => {
        result.current.setNavigationRef(mockNav);
        result.current.setGameContextRef(mockGameCtx);
      });

      const subscribeCalls = WebSocketService.subscribe.mock.calls;
      const gameEventsCall = subscribeCalls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      if (gameEventsCall) {
        const callback = gameEventsCall[1];
        act(() => {
          callback({
            type: 'STATUS',
            status: 'ACTIVE_SESSION_EXISTS',
            sessionId: 'session-active-1',
            message: 'Continue your active game.',
          });
        });

        expect(mockGameCtx.startGame).toHaveBeenCalledWith('session-active-1');
        expect(mockNav.navigate).toHaveBeenCalledWith('Game', { sessionId: 'session-active-1' });
      }
    });

    it('should handle SESSION_EXPIRED with recovery UX', async () => {
      const { result } = await renderAuthHook();

      const mockNav = { navigate: jest.fn() };
      const mockGameCtx = { startGame: jest.fn(), endGame: jest.fn() };

      act(() => {
        result.current.setNavigationRef(mockNav);
        result.current.setGameContextRef(mockGameCtx);
      });

      const subscribeCalls = WebSocketService.subscribe.mock.calls;
      const gameEventsCall = subscribeCalls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      if (gameEventsCall) {
        const callback = gameEventsCall[1];
        act(() => {
          callback({
            type: 'STATUS',
            status: 'SESSION_EXPIRED',
            sessionId: 'session-expired-1',
            message: 'This game session has expired.',
          });
        });

        expect(mockGameCtx.endGame).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith(
          'Session Expired',
          'This game session has expired.'
        );
        expect(mockNav.navigate).toHaveBeenCalledWith('Dashboard');
      }
    });

    it('routes notification deep-link intents when response listener fires', async () => {
      const { result } = await renderAuthHook();

      const mockNav = { navigate: jest.fn(), getCurrentRoute: jest.fn(() => ({ name: 'Dashboard' })) };
      const mockGameCtx = { startGame: jest.fn(), endGame: jest.fn() };

      act(() => {
        result.current.setNavigationRef(mockNav);
        result.current.setGameContextRef(mockGameCtx);
      });

      await act(async () => {
        await result.current.login({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 'user-1', name: 'User One', email: 'user@test.com' },
        });
      });

      NotificationService.mapNotificationResponseToIntent.mockReturnValue({
        targetRoute: 'Game',
        params: { sessionId: 'notif-session-1' },
      });

      const callback = NotificationService.addNotificationResponseListener.mock.calls[0][0];
      act(() => {
        callback({ any: 'payload' });
      });

      expect(mockGameCtx.startGame).toHaveBeenCalledWith('notif-session-1');
      expect(mockNav.navigate).toHaveBeenCalledWith('Game', { sessionId: 'notif-session-1' });
    });

    it('routes gameplay payloads from the private queue into GameContext', async () => {
      const { result } = await renderAuthHook();

      const mockGameCtx = {
        startGame: jest.fn(),
        endGame: jest.fn(),
        submitAnswer: jest.fn(),
        handleRealtimePayload: jest.fn(() => true),
      };

      act(() => {
        result.current.setGameContextRef(mockGameCtx);
      });

      await act(async () => {
        await result.current.login({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 'user-1', name: 'User One', email: 'user@test.com' },
        });
        await Promise.resolve();
      });

      const gameEventsCall = WebSocketService.subscribe.mock.calls.find(
        (call) => call[0] === '/user/queue/game-events'
      );

      expect(gameEventsCall).toBeTruthy();

      const callback = gameEventsCall[1];
      act(() => {
        callback({
          type: 'QUESTION',
          sessionId: 'session-123',
          questionId: 1,
          questionNumber: 1,
          totalQuestions: 8,
          questionText: 'Test question?',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          round: 'ROUND1',
        });
      });

      expect(mockGameCtx.handleRealtimePayload).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'QUESTION',
          sessionId: 'session-123',
          questionId: 1,
        })
      );
    });
  });
});
