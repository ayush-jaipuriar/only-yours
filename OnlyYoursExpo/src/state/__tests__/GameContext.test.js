import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { Alert } from 'react-native';
import { GameProvider, useGame } from '../GameContext';
import { AuthContext } from '../AuthContext';
import WebSocketService from '../../services/WebSocketService';

jest.mock('../../services/WebSocketService');
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return Object.defineProperty(rn, 'Alert', {
    value: { alert: jest.fn() },
    writable: true,
    configurable: true,
  });
});

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ setGameContextRef: jest.fn() }}>
    {children}
  </AuthContext.Provider>
);

const wrapper = ({ children }) => (
  <MockAuthProvider>
    <GameProvider>{children}</GameProvider>
  </MockAuthProvider>
);

describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    WebSocketService.subscribe.mockReturnValue({ unsubscribe: jest.fn() });
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
    expect(result.current.waitingForPartner).toBe(true);
    expect(WebSocketService.sendMessage).toHaveBeenCalledWith('/app/game.answer', {
      sessionId: 'test-session-id',
      questionId: 1,
      answer: 'B',
    });
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
      });
    });

    expect(result.current.round).toBe('round2');
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.currentQuestion.round).toBe('ROUND2');
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
    expect(result.current.waitingForPartner).toBe(true);
    expect(WebSocketService.sendMessage).toHaveBeenCalledWith('/app/game.guess', {
      sessionId: 'test-session-id',
      questionId: 5,
      guess: 'C',
    });
  });

  it('should handle GUESS_RESULT from private queue', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.startGame('test-session-id');
    });

    const privateCallback = WebSocketService.subscribe.mock.calls[1][1];

    act(() => {
      privateCallback({
        type: 'GUESS_RESULT',
        correct: true,
        yourGuess: 'B',
        partnerAnswer: 'B',
        correctCount: 3,
        questionText: 'Test?',
      });
    });

    expect(result.current.guessResult).toBeTruthy();
    expect(result.current.guessResult.correct).toBe(true);
    expect(result.current.correctCount).toBe(3);
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
  });

  it('should handle submit answer without active session gracefully', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.submitAnswer('A');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No active game or question');
    expect(WebSocketService.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle submit guess without active session gracefully', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.submitGuess('A');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No active game or question');
    expect(WebSocketService.sendMessage).not.toHaveBeenCalled();
  });
});
