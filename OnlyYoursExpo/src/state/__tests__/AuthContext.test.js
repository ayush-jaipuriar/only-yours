import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../services/WebSocketService', () => ({
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(),
  subscribe: jest.fn(() => ({ id: 1, destination: '/test', unsubscribe: jest.fn() })),
  unsubscribe: jest.fn(),
  sendMessage: jest.fn(),
  setConnectionStateListener: jest.fn(),
  getConnectionState: jest.fn(() => 'disconnected'),
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

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext — Game Status Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide auth context values', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('should expose setNavigationRef and setGameContextRef', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.setNavigationRef).toBe('function');
    expect(typeof result.current.setGameContextRef).toBe('function');
  });

  describe('INVITATION_SENT status handling (BUG-2 fix)', () => {
    it('should call startGame and navigate on INVITATION_SENT', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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

    it('should not crash on INVITATION_SENT without sessionId', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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

    it('should show alert on INVITATION_DECLINED', () => {
      renderHook(() => useAuth(), { wrapper });

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

    it('should handle ACTIVE_SESSION_EXISTS by opening the existing game', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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

    it('should handle SESSION_EXPIRED with recovery UX', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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
  });
});
