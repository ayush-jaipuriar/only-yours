import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import WebSocketService from '../services/WebSocketService';
import api from '../services/api';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { setGameContextRef } = useContext(AuthContext);
  const { triggerHaptic } = useHaptics();

  const [activeSession, setActiveSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);

  const [round, setRound] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [scores, setScores] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInvitationPending, setIsInvitationPending] = useState(false);

  const activeSessionRef = useRef(null);
  const topicSubRef = useRef(null);
  const privateSubRef = useRef(null);

  const applyGamePayload = useCallback((payload) => {
    console.log('[GameContext] Received message:', payload.type || payload.status);

    if (payload.type === 'QUESTION') {
      if (payload.round === 'ROUND2') {
        setRound('round2');
        setIsTransitioning(false);
      }
      setCurrentQuestion(payload);
      setMyAnswer(null);
      setWaitingForPartner(false);
      setGuessResult(null);
      setGameStatus('playing');
      setIsInvitationPending(false);
    } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
      console.log('[GameContext] Round 1 complete, transitioning...');
      triggerHaptic(HAPTIC_EVENTS.ROUND_UNLOCKED);
      setIsTransitioning(true);
      setCurrentQuestion(null);
      setMyAnswer(null);
      setWaitingForPartner(false);
      setGameStatus('playing');
      setIsInvitationPending(false);
    } else if (payload.type === 'GAME_RESULTS') {
      console.log('[GameContext] Game completed:', payload);
      triggerHaptic(HAPTIC_EVENTS.GAME_COMPLETED);
      setScores(payload);
      setGameStatus('completed');
      setIsTransitioning(false);
      setIsInvitationPending(false);
    }
  }, []);

  const hydrateCurrentQuestion = useCallback(async (sessionId) => {
    try {
      const response = await api.get(`/game/${sessionId}/current-question`);
      const payload = response?.data;
      if (payload?.type === 'QUESTION') {
        applyGamePayload(payload);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 410) {
        return;
      }

      if (status === 409) {
        try {
          const activeResponse = await api.get('/game/active');
          const activeSession = activeResponse?.data;
          const activeSessionId = activeSession?.sessionId ? String(activeSession.sessionId) : null;
          if (activeSessionId === String(sessionId) && activeSession?.status === 'INVITED') {
            setGameStatus('invited');
            setIsInvitationPending(true);
            return;
          }
        } catch (activeSessionError) {
          console.warn('[GameContext] Failed to inspect active session state:', activeSessionError?.message || activeSessionError);
        }
        return;
      }

      console.warn('[GameContext] Failed to hydrate current question:', error?.message || error);
    }
  }, [applyGamePayload]);

  const startGame = useCallback((sessionId) => {
    console.log('[GameContext] Starting game:', sessionId);

    if (activeSessionRef.current === sessionId && topicSubRef.current) {
      console.log('[GameContext] Session already active, refreshing snapshot:', sessionId);
      hydrateCurrentQuestion(sessionId);
      return;
    }

    if (topicSubRef.current) {
      try {
        topicSubRef.current.unsubscribe();
      } catch (error) {
        console.error('[GameContext] Error unsubscribing previous topic listener:', error);
      } finally {
        topicSubRef.current = null;
      }
    }

    if (privateSubRef.current) {
      try {
        privateSubRef.current.unsubscribe();
      } catch (error) {
        console.error('[GameContext] Error unsubscribing previous private listener:', error);
      } finally {
        privateSubRef.current = null;
      }
    }

    activeSessionRef.current = sessionId;
    setActiveSession(sessionId);
    setGameStatus('playing');
    setRound('round1');
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setGuessResult(null);
    setScores(null);
    setCorrectCount(0);
    setIsTransitioning(false);
    setIsInvitationPending(false);

    const gameTopic = `/topic/game/${sessionId}`;
    const sub = WebSocketService.subscribe(gameTopic, (payload) => {
      applyGamePayload(payload);
    });

    topicSubRef.current = sub;

    const privateSub = WebSocketService.subscribe(
      '/user/queue/game-events',
      (payload) => {
        if (payload.type === 'GUESS_RESULT') {
          console.log('[GameContext] Guess result:', payload.correct ? 'CORRECT' : 'WRONG');
          triggerHaptic(payload.correct ? HAPTIC_EVENTS.GUESS_CORRECT : HAPTIC_EVENTS.GUESS_INCORRECT);
          setGuessResult(payload);
          setCorrectCount(payload.correctCount || 0);
          setWaitingForPartner(true);
        } else {
          applyGamePayload(payload);
        }
      },
    );
    privateSubRef.current = privateSub;

    console.log('[GameContext] Subscribed to:', gameTopic);

    hydrateCurrentQuestion(sessionId);
  }, [applyGamePayload, hydrateCurrentQuestion]);

  const submitAnswer = (answer) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return;
    }

    console.log('[GameContext] Submitting answer:', answer);

    setMyAnswer(answer);
    setWaitingForPartner(true);

    try {
      const sent = WebSocketService.sendMessage('/app/game.answer', {
        sessionId: activeSession,
        questionId: currentQuestion.questionId,
        answer: answer,
      });
      if (!sent) {
        throw new Error('Realtime unavailable');
      }
      triggerHaptic(HAPTIC_EVENTS.ANSWER_SUBMITTED);
    } catch (error) {
      console.error('[GameContext] Error sending answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      setWaitingForPartner(false);
    }
  };

  const submitGuess = (guess) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return;
    }

    console.log('[GameContext] Submitting guess:', guess);

    setMyAnswer(guess);
    setWaitingForPartner(true);

    try {
      const sent = WebSocketService.sendMessage('/app/game.guess', {
        sessionId: activeSession,
        questionId: currentQuestion.questionId,
        guess: guess,
      });
      if (!sent) {
        throw new Error('Realtime unavailable');
      }
      triggerHaptic(HAPTIC_EVENTS.GUESS_SUBMITTED);
    } catch (error) {
      console.error('[GameContext] Error sending guess:', error);
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      setWaitingForPartner(false);
    }
  };

  const clearGuessResult = () => {
    setGuessResult(null);
  };

  const acceptPendingInvitation = () => {
    const sessionId = activeSessionRef.current;
    if (!sessionId) {
      return false;
    }

    if (!WebSocketService.isConnected()) {
      Alert.alert(
        'Realtime Disconnected',
        'Cannot accept invitation right now because realtime connection is not ready. Please retry in a few seconds.'
      );
      triggerHaptic(HAPTIC_EVENTS.REALTIME_UNAVAILABLE);
      return false;
    }

    const sent = WebSocketService.sendMessage('/app/game.accept', { sessionId });
    if (!sent) {
      Alert.alert(
        'Realtime Disconnected',
        'Unable to send invitation acceptance. Please retry once connection is restored.'
      );
      triggerHaptic(HAPTIC_EVENTS.REALTIME_UNAVAILABLE);
      return false;
    }

    triggerHaptic(HAPTIC_EVENTS.INVITATION_ACCEPTED);
    setGameStatus('joining');
    setIsInvitationPending(false);
    return true;
  };

  const refreshCurrentQuestion = () => {
    const sessionId = activeSessionRef.current;
    if (!sessionId) {
      return;
    }
    hydrateCurrentQuestion(sessionId);
  };

  const endGame = useCallback(() => {
    console.log('[GameContext] Ending game');

    if (topicSubRef.current) {
      try { topicSubRef.current.unsubscribe(); } catch (error) {
        console.error('[GameContext] Error unsubscribing:', error);
      } finally {
        topicSubRef.current = null;
      }
    }
    if (privateSubRef.current) {
      try { privateSubRef.current.unsubscribe(); } catch (error) {
        console.error('[GameContext] Error unsubscribing private:', error);
      } finally {
        privateSubRef.current = null;
      }
    }

    setActiveSession(null);
    activeSessionRef.current = null;
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setGameStatus(null);
    setRound(null);
    setGuessResult(null);
    setScores(null);
    setCorrectCount(0);
    setIsTransitioning(false);
    setIsInvitationPending(false);
  }, []);

  useEffect(() => {
    return () => {
      if (topicSubRef.current) {
        try { topicSubRef.current.unsubscribe(); } catch (error) {
          console.error('[GameContext] Error during cleanup:', error);
        } finally {
          topicSubRef.current = null;
        }
      }
      if (privateSubRef.current) {
        try { privateSubRef.current.unsubscribe(); } catch (error) {
          console.error('[GameContext] Error during private cleanup:', error);
        } finally {
          privateSubRef.current = null;
        }
      }
      activeSessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (setGameContextRef) {
      setGameContextRef({ startGame, endGame, submitAnswer });
    }
  }, [endGame, setGameContextRef, startGame, submitAnswer]);

  const value = {
    activeSession,
    currentQuestion,
    myAnswer,
    waitingForPartner,
    gameStatus,
    round,
    guessResult,
    scores,
    correctCount,
    isTransitioning,
    isInvitationPending,

    startGame,
    submitAnswer,
    submitGuess,
    acceptPendingInvitation,
    refreshCurrentQuestion,
    clearGuessResult,
    endGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
