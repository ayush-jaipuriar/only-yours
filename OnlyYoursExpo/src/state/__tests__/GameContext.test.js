import * as ExpoHaptics from 'expo-haptics';
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { Alert } from 'react-native';
import { HapticsProvider } from '../../haptics';
import { GameProvider, useGame } from '../GameContext';
import { AuthContext } from '../AuthContext';
import WebSocketService from '../../services/WebSocketService';
import api from '../../services/api';

let capturedGameContextRef = null;

jest.mock('../../services/WebSocketService');
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.reject({ response: { status: 404 } })),
  },
}));
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return Object.defineProperty(rn, 'Alert', {
    value: { alert: jest.fn() },
    writable: true,
    configurable: true,
  });
});

const MockAuthProvider = ({ children, wsConnectionState = 'connected' }) => (
  <AuthContext.Provider
    value={{
      setGameContextRef: (ref) => {
        capturedGameContextRef = ref;
      },
      wsConnectionState,
    }}
  >
    {children}
  </AuthContext.Provider>
);

const wrapper = ({ children }) => (
  <MockAuthProvider>
    <HapticsProvider>
      <GameProvider>{children}</GameProvider>
    </HapticsProvider>
  </MockAuthProvider>
);

describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    capturedGameContextRef = null;
    WebSocketService.subscribe.mockReturnValue({ unsubscribe: jest.fn() });
    WebSocketService.sendMessage.mockReturnValue(true);
    WebSocketService.isConnected.mockReturnValue(true);
    api.get.mockResolvedValue({ data: null });
  });

  it('should throw error when useGame used outside GameProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { result } = renderHook(() => useGame());
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('useGame must be used within GameProvider');
    } catch (e) {
      expect(e.message).toContain('useGame must be used within GameProvider');
    }
    consoleError.mockRestore();
  });

  it('should start game and set active session', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    expect(result.current.activeSession).toBe('test-session-id');
    expect(result.current.gameStatus).toBe('playing');
    expect(result.current.round).toBe('round1');
    expect(WebSocketService.subscribe).toHaveBeenCalledWith(
      '/topic/game/test-session-id',
      expect.any(Function),
    );
    expect(WebSocketService.subscribe).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/game/test-session-id/current-question');
  });

  it('should submit answer and set waiting state', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 1,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Test question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND1',
      });
    });

    expect(result.current.currentQuestion).toBeTruthy();

    act(() => {
      result.current.submitAnswer('B');
    });

    expect(result.current.myAnswer).toBe('B');
    expect(result.current.waitingForPartner).toBe(false);
    expect(result.current.isSubmitting).toBe(true);
    expect(WebSocketService.sendMessage).toHaveBeenCalledWith('/app/game.answer', {
      sessionId: 'test-session-id',
      questionId: 1,
      answer: 'B',
    });
    expect(ExpoHaptics.selectionAsync).toHaveBeenCalled();
  });

  it('should clean up subscriptions when ending game', () => {
    const mockSub = { unsubscribe: jest.fn() };
    WebSocketService.subscribe.mockReturnValue(mockSub);

    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      result.current.endGame();
    });

    expect(mockSub.unsubscribe).toHaveBeenCalled();
    expect(result.current.activeSession).toBeNull();
    expect(result.current.round).toBeNull();
    expect(result.current.scores).toBeNull();
  });

  it('should set isTransitioning on ROUND1_COMPLETE', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'STATUS',
        status: 'ROUND1_COMPLETE',
        message: 'Round 1 complete!',
      });
    });

    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.currentQuestion).toBeNull();
    expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('should switch to round2 on ROUND2 question', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 5,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Round 2 question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
        correctCountSoFar: 2,
      });
    });

    expect(result.current.round).toBe('round2');
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.currentQuestion.round).toBe('ROUND2');
    expect(result.current.correctCount).toBe(2);
  });

  it('should submit guess via /app/game.guess', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 5,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Guess question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
      });
    });

    act(() => {
      result.current.submitGuess('C');
    });

    expect(result.current.myAnswer).toBe('C');
    expect(result.current.waitingForPartner).toBe(false);
    expect(result.current.isSubmitting).toBe(true);
    expect(WebSocketService.sendMessage).toHaveBeenCalledWith('/app/game.guess', {
      sessionId: 'test-session-id',
      questionId: 5,
      guess: 'C',
    });
  });

  it('refreshes the current snapshot if a submit follow-up payload is missed', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 5,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Guess question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
      });
    });

    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 6,
        questionNumber: 2,
        totalQuestions: 8,
        questionText: 'Next question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
        correctCountSoFar: 1,
      },
    });

    act(() => {
      result.current.submitGuess('C');
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(api.get).toHaveBeenLastCalledWith('/game/test-session-id/current-question');
    expect(result.current.currentQuestion?.questionId).toBe(6);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle ROUND_STATE routed from AuthContext', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      capturedGameContextRef.handleRealtimePayload({
        type: 'ROUND_STATE',
        sessionId: 'test-session-id',
        round: 'ROUND2',
        status: 'WAITING_FOR_PARTNER',
        message: 'Waiting for your partner to finish.',
        totalQuestions: 8,
        completedCount: 8,
        correctCount: 3,
        reviewItems: [
          {
            questionId: 7,
            questionNumber: 1,
            questionText: 'Test?',
            submittedValue: 'B',
          },
        ],
      });
    });

    expect(result.current.roundState).toBeTruthy();
    expect(result.current.roundState.status).toBe('WAITING_FOR_PARTNER');
    expect(result.current.correctCount).toBe(3);
    expect(result.current.waitingForPartner).toBe(true);
    expect(result.current.gameStatus).toBe('waiting');
  });

  it('does not let unrelated STATUS events cancel submit recovery', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 5,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Guess question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
      });
    });

    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session-id',
        questionId: 6,
        questionNumber: 2,
        totalQuestions: 8,
        questionText: 'Next question?',
        optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
        round: 'ROUND2',
        correctCountSoFar: 1,
      },
    });

    act(() => {
      result.current.submitGuess('C');
    });

    act(() => {
      capturedGameContextRef.handleRealtimePayload({
        type: 'STATUS',
        sessionId: 'test-session-id',
        status: 'PARTNER_RETURNED',
        message: 'Partner returned.',
      });
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(api.get).toHaveBeenLastCalledWith('/game/test-session-id/current-question');
    expect(result.current.currentQuestion?.questionId).toBe(6);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('hydrates a round review state from the current-question endpoint', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        type: 'ROUND_STATE',
        sessionId: 'test-session-id',
        round: 'ROUND1',
        status: 'WAITING_FOR_PARTNER',
        message: 'Waiting for your partner to finish.',
        totalQuestions: 8,
        completedCount: 8,
        reviewItems: [
          {
            questionId: 1,
            questionNumber: 1,
            questionText: 'Question?',
            submittedValue: 'A',
          },
        ],
      },
    });

    const { result } = renderHook(() => useGame(), { wrapper });

    await act(async () => {
      result.current.startGame('test-session-id');
      await Promise.resolve();
    });

    expect(result.current.roundState?.status).toBe('WAITING_FOR_PARTNER');
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.waitingForPartner).toBe(true);
  });

  it('should set completed status on GAME_RESULTS', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'GAME_RESULTS',
        sessionId: 'test-session-id',
        player1Name: 'Alice',
        player1Score: 6,
        player2Name: 'Bob',
        player2Score: 5,
        totalQuestions: 8,
        message: 'Great connection!',
      });
    });

    expect(result.current.gameStatus).toBe('completed');
    expect(result.current.scores).toBeTruthy();
    expect(result.current.scores.player1Score).toBe(6);
    expect(result.current.scores.player2Score).toBe(5);
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('Success');
  });

  it('should handle submit answer without active session gracefully', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.submitAnswer('A');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No active game or question');
    expect(WebSocketService.sendMessage).not.toHaveBeenCalled();
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('Warning');
  });

  it('should handle submit guess without active session gracefully', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.submitGuess('A');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No active game or question');
    expect(WebSocketService.sendMessage).not.toHaveBeenCalled();
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('Warning');
  });
});
