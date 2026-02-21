import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { GameProvider, useGame } from '../GameContext';
import WebSocketService from '../../services/WebSocketService';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../services/WebSocketService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

/**
 * Unit tests for GameContext.
 * 
 * Tests state management, game lifecycle, and WebSocket integration.
 */
describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: useGame hook throws error if used outside provider.
   */
  it('should throw error when useGame used outside GameProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useGame());
    }).toThrow('useGame must be used within GameProvider');
    
    consoleError.mockRestore();
  });

  /**
   * Test 2: Starting a game sets active session.
   */
  it('should start game and set active session', () => {
    const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;
    const { result } = renderHook(() => useGame(), { wrapper });

    // Mock subscribe to return a subscription object
    const mockSubscription = { unsubscribe: jest.fn() };
    WebSocketService.subscribe.mockReturnValue(mockSubscription);

    act(() => {
      result.current.startGame('test-session-id');
    });

    expect(result.current.activeSession).toBe('test-session-id');
    expect(result.current.gameStatus).toBe('playing');
    expect(WebSocketService.subscribe).toHaveBeenCalledWith(
      '/topic/game/test-session-id',
      expect.any(Function)
    );
  });

  /**
   * Test 3: Submitting answer updates state.
   */
  it('should submit answer and set waiting state', () => {
    const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;
    const { result } = renderHook(() => useGame(), { wrapper });

    const mockSubscription = { unsubscribe: jest.fn() };
    WebSocketService.subscribe.mockReturnValue(mockSubscription);

    // Start game and set a question
    act(() => {
      result.current.startGame('test-session-id');
    });

    // Manually set current question (would normally come from WebSocket)
    act(() => {
      // Simulate receiving a question via the subscription callback
      const subscribeCall = WebSocketService.subscribe.mock.calls[0];
      const callback = subscribeCall[1];
      
      callback({
        body: JSON.stringify({
          type: 'QUESTION',
          sessionId: 'test-session-id',
          questionId: 1,
          questionNumber: 1,
          totalQuestions: 8,
          questionText: 'Test question?',
          optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
          round: 'ROUND1',
        }),
      });
    });

    expect(result.current.currentQuestion).toBeTruthy();

    // Submit answer
    act(() => {
      result.current.submitAnswer('B');
    });

    expect(result.current.myAnswer).toBe('B');
    expect(result.current.waitingForPartner).toBe(true);
    expect(WebSocketService.sendMessage).toHaveBeenCalledWith(
      '/app/game.answer',
      {
        sessionId: 'test-session-id',
        questionId: 1,
        answer: 'B',
      }
    );
  });

  /**
   * Test 4: Ending game cleans up subscription.
   */
  it('should clean up subscription when ending game', () => {
    const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;
    const { result } = renderHook(() => useGame(), { wrapper });

    const mockSubscription = { unsubscribe: jest.fn() };
    WebSocketService.subscribe.mockReturnValue(mockSubscription);

    act(() => {
      result.current.startGame('test-session-id');
    });

    expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();

    act(() => {
      result.current.endGame();
    });

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(result.current.activeSession).toBeNull();
    expect(result.current.currentQuestion).toBeNull();
  });

  /**
   * Test 5: Round 1 complete triggers alert.
   */
  it('should show alert when Round 1 complete message received', () => {
    const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;
    const { result } = renderHook(() => useGame(), { wrapper });

    const mockSubscription = { unsubscribe: jest.fn() };
    WebSocketService.subscribe.mockReturnValue(mockSubscription);

    act(() => {
      result.current.startGame('test-session-id');
    });

    // Simulate Round 1 complete message
    act(() => {
      const callback = WebSocketService.subscribe.mock.calls[0][1];
      callback({
        body: JSON.stringify({
          type: 'STATUS',
          status: 'ROUND1_COMPLETE',
          message: 'Round 1 complete!',
        }),
      });
    });

    expect(result.current.gameStatus).toBe('complete');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Round 1 Complete!',
      'Great job! Round 2 coming soon...',
      expect.any(Array)
    );
  });

  /**
   * Test 6: Cannot submit answer without active session.
   */
  it('should handle submit answer without active session gracefully', () => {
    const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;
    const { result } = renderHook(() => useGame(), { wrapper });

    // Try to submit without starting game
    act(() => {
      result.current.submitAnswer('A');
    });

    // Should show error alert
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No active game or question');
    expect(WebSocketService.sendMessage).not.toHaveBeenCalled();
  });
});
