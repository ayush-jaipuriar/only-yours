import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/WebSocketService';
import api from '../services/api';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';

const GameContext = createContext();
const LATEST_COMPLETED_SESSION_STORAGE_KEY = 'latest_completed_session_v1';
const RESULTS_RECOVERY_TTL_MS = 30 * 60 * 1000;

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { setGameContextRef, wsConnectionState } = useContext(AuthContext);
  const { triggerHaptic } = useHaptics();
  const SUBMIT_SNAPSHOT_FALLBACK_MS = 2000;

  const [activeSession, setActiveSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [roundState, setRoundState] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);
  const [expiredMessage, setExpiredMessage] = useState(null);
  const [latestCompletedSession, setLatestCompletedSession] = useState(null);

  const [round, setRound] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [scores, setScores] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInvitationPending, setIsInvitationPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSessionRef = useRef(null);
  const topicSubRef = useRef(null);
  const submitRecoveryTimeoutRef = useRef(null);
  const hydrationRequestIdRef = useRef(0);

  const clearSubmitRecoveryTimeout = useCallback(() => {
    if (submitRecoveryTimeoutRef.current) {
      clearTimeout(submitRecoveryTimeoutRef.current);
      submitRecoveryTimeoutRef.current = null;
    }
  }, []);

  const persistLatestCompletedSession = useCallback(async (sessionSnapshot) => {
    if (!sessionSnapshot?.sessionId) {
      return;
    }

    try {
      await AsyncStorage.setItem(
        LATEST_COMPLETED_SESSION_STORAGE_KEY,
        JSON.stringify(sessionSnapshot)
      );
    } catch (error) {
      console.warn('[GameContext] Failed to persist latest completed session:', error?.message || error);
    }
  }, []);

  const clearLatestCompletedSession = useCallback(async () => {
    setLatestCompletedSession(null);
    try {
      await AsyncStorage.removeItem(LATEST_COMPLETED_SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('[GameContext] Failed to clear latest completed session:', error?.message || error);
    }
  }, []);

  const applyGamePayload = useCallback((payload) => {
    if (!payload || !activeSessionRef.current) {
      return false;
    }

    const payloadSessionId = payload.sessionId ? String(payload.sessionId) : null;
    if (payloadSessionId && payloadSessionId !== String(activeSessionRef.current)) {
      return false;
    }

    const payloadKey = payload.type || payload.status;
    console.log('[GameContext] Received message:', payloadKey);

    if (payload.type === 'QUESTION') {
      clearSubmitRecoveryTimeout();
      const nextRound = payload.round === 'ROUND2' ? 'round2' : 'round1';
      setRound(nextRound);
      setCurrentQuestion(payload);
      setRoundState(null);
      setMyAnswer(null);
      setWaitingForPartner(false);
      setIsSubmitting(false);
      setGuessResult(null);
      setGameStatus('playing');
      setStatusNotice(null);
      setExpiredMessage(null);
      setCorrectCount(payload.round === 'ROUND2' ? payload.correctCountSoFar || 0 : 0);
      setIsTransitioning(false);
      setIsInvitationPending(false);
      return true;
    }

    if (payload.type === 'ROUND_STATE') {
      clearSubmitRecoveryTimeout();
      setRound(payload.round === 'ROUND2' ? 'round2' : 'round1');
      setCurrentQuestion(null);
      setRoundState(payload);
      setMyAnswer(null);
      setWaitingForPartner(payload.status === 'WAITING_FOR_PARTNER');
      setGuessResult(null);
      setGameStatus('waiting');
      setStatusNotice(null);
      setExpiredMessage(null);
      setCorrectCount(payload.round === 'ROUND2' ? payload.correctCount || 0 : 0);
      setIsTransitioning(false);
      setIsInvitationPending(false);
      setIsSubmitting(false);
      return true;
    }

    if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
      clearSubmitRecoveryTimeout();
      console.log('[GameContext] Round 1 complete, transitioning...');
      triggerHaptic(HAPTIC_EVENTS.ROUND_UNLOCKED);
      setRound('round2');
      setIsTransitioning(true);
      setCurrentQuestion(null);
      setRoundState(null);
      setMyAnswer(null);
      setWaitingForPartner(false);
      setGameStatus('playing');
      setStatusNotice(null);
      setExpiredMessage(null);
      setIsInvitationPending(false);
      setIsSubmitting(false);
      return true;
    }

    if (payload.type === 'STATUS' && payload.status === 'PARTNER_LEFT') {
      setStatusNotice({
        type: 'partner-left',
        message: payload.message || 'Your partner stepped away. We will keep this session ready for them.',
      });
      return true;
    }

    if (payload.type === 'STATUS' && payload.status === 'PARTNER_RETURNED') {
      setStatusNotice({
        type: 'partner-returned',
        message: payload.message || 'Your partner is back. You can continue together.',
      });
      return true;
    }

    if (payload.type === 'STATUS' && payload.status === 'SESSION_EXPIRED') {
      clearSubmitRecoveryTimeout();
      setCurrentQuestion(null);
      setRoundState(null);
      setWaitingForPartner(false);
      setMyAnswer(null);
      setIsSubmitting(false);
      setIsTransitioning(false);
      setIsInvitationPending(false);
      setStatusNotice(null);
      setExpiredMessage(payload.message || 'This session has expired. Start a new game from the dashboard.');
      setGameStatus('expired');
      return true;
    }

    if (payload.type === 'GAME_RESULTS') {
      clearSubmitRecoveryTimeout();
      console.log('[GameContext] Game completed:', payload);
      triggerHaptic(HAPTIC_EVENTS.GAME_COMPLETED);
      const completedSnapshot = {
        sessionId: payloadSessionId || String(activeSessionRef.current || ''),
        createdAt: Date.now(),
      };
      setCurrentQuestion(null);
      setRoundState(null);
      setWaitingForPartner(false);
      setIsSubmitting(false);
      setScores(payload);
      setLatestCompletedSession(completedSnapshot.sessionId ? completedSnapshot : null);
      setGameStatus('completed');
      setStatusNotice(null);
      setExpiredMessage(null);
      setIsTransitioning(false);
      setIsInvitationPending(false);
      if (completedSnapshot.sessionId) {
        persistLatestCompletedSession(completedSnapshot);
      }
      return true;
    }

    return false;
  }, [clearSubmitRecoveryTimeout, triggerHaptic]);

  const handleRealtimePayload = useCallback((payload) => applyGamePayload(payload), [applyGamePayload]);

  const hydrateCurrentQuestion = useCallback(async (sessionId) => {
    const normalizedSessionId = sessionId ? String(sessionId) : null;
    const requestId = hydrationRequestIdRef.current + 1;
    hydrationRequestIdRef.current = requestId;

    try {
      const response = await api.get(`/game/${sessionId}/current-question`);
      if (
        requestId !== hydrationRequestIdRef.current ||
        !activeSessionRef.current ||
        String(activeSessionRef.current) !== normalizedSessionId
      ) {
        return;
      }
      const payload = response?.data;
      if (payload?.type === 'QUESTION' || payload?.type === 'ROUND_STATE' || payload?.type === 'GAME_RESULTS') {
        applyGamePayload(payload);
      }
    } catch (error) {
      if (
        requestId !== hydrationRequestIdRef.current ||
        !activeSessionRef.current ||
        String(activeSessionRef.current) !== normalizedSessionId
      ) {
        return;
      }

      const status = error?.response?.status;
      if (status === 404 || status === 410) {
        if (status === 410) {
          clearSubmitRecoveryTimeout();
          setCurrentQuestion(null);
          setRoundState(null);
          setWaitingForPartner(false);
          setMyAnswer(null);
          setIsSubmitting(false);
          setIsTransitioning(false);
          setIsInvitationPending(false);
          setStatusNotice(null);
          setExpiredMessage(
            error?.response?.data?.message || 'This session has expired. Start a new game from the dashboard.'
          );
          setGameStatus('expired');
        }
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
            setStatusNotice(null);
            setExpiredMessage(null);
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

  const scheduleSubmitRecovery = useCallback(() => {
    clearSubmitRecoveryTimeout();

    const sessionId = activeSessionRef.current;
    if (!sessionId) {
      return;
    }

    submitRecoveryTimeoutRef.current = setTimeout(() => {
      console.log('[GameContext] No realtime follow-up after submit, refreshing snapshot:', sessionId);
      hydrateCurrentQuestion(sessionId);
    }, SUBMIT_SNAPSHOT_FALLBACK_MS);
  }, [SUBMIT_SNAPSHOT_FALLBACK_MS, clearSubmitRecoveryTimeout, hydrateCurrentQuestion]);

  const unsubscribeTopic = useCallback(() => {
    if (!topicSubRef.current) {
      return;
    }

    try {
      topicSubRef.current.unsubscribe();
    } catch (error) {
      console.error('[GameContext] Error unsubscribing previous topic listener:', error);
    } finally {
      topicSubRef.current = null;
    }
  }, []);

  const ensureTopicSubscription = useCallback((sessionId) => {
    if (!sessionId || !WebSocketService.isConnected()) {
      return false;
    }

    unsubscribeTopic();

    const gameTopic = `/topic/game/${sessionId}`;
    topicSubRef.current = WebSocketService.subscribe(gameTopic, (payload) => {
      handleRealtimePayload(payload);
    });
    console.log('[GameContext] Subscribed to:', gameTopic);
    return Boolean(topicSubRef.current);
  }, [handleRealtimePayload, unsubscribeTopic]);

  const startGame = useCallback((sessionId) => {
    console.log('[GameContext] Starting game:', sessionId);

    if (activeSessionRef.current === sessionId) {
      console.log('[GameContext] Session already active, refreshing snapshot:', sessionId);
      ensureTopicSubscription(sessionId);
      hydrateCurrentQuestion(sessionId);
      return;
    }

    unsubscribeTopic();

    activeSessionRef.current = sessionId;
    hydrationRequestIdRef.current += 1;
    setActiveSession(sessionId);
    setGameStatus('playing');
    setRound('round1');
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setRoundState(null);
    setGuessResult(null);
    setScores(null);
    setCorrectCount(0);
    setIsTransitioning(false);
    setIsInvitationPending(false);
    setIsSubmitting(false);
    setStatusNotice(null);
    setExpiredMessage(null);
    clearSubmitRecoveryTimeout();
    setLatestCompletedSession(null);
    AsyncStorage.removeItem(LATEST_COMPLETED_SESSION_STORAGE_KEY).catch((error) => {
      console.warn('[GameContext] Failed to clear latest completed session on start:', error?.message || error);
    });

    ensureTopicSubscription(sessionId);
    hydrateCurrentQuestion(sessionId);
  }, [clearSubmitRecoveryTimeout, ensureTopicSubscription, hydrateCurrentQuestion, unsubscribeTopic]);

  const submitAnswer = (answer) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return;
    }

    console.log('[GameContext] Submitting answer:', answer);

    setMyAnswer(answer);
    setIsSubmitting(true);
    setWaitingForPartner(false);

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
      scheduleSubmitRecovery();
    } catch (error) {
      console.error('[GameContext] Error sending answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      clearSubmitRecoveryTimeout();
      setMyAnswer(null);
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    setWaitingForPartner(false);

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
      scheduleSubmitRecovery();
    } catch (error) {
      console.error('[GameContext] Error sending guess:', error);
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      clearSubmitRecoveryTimeout();
      setMyAnswer(null);
      setIsSubmitting(false);
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

    unsubscribeTopic();

    setActiveSession(null);
    activeSessionRef.current = null;
    hydrationRequestIdRef.current += 1;
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setRoundState(null);
    setGameStatus(null);
    setRound(null);
    setGuessResult(null);
    setScores(null);
    setCorrectCount(0);
    setIsTransitioning(false);
    setIsInvitationPending(false);
    setIsSubmitting(false);
    setStatusNotice(null);
    setExpiredMessage(null);
    clearSubmitRecoveryTimeout();
    setLatestCompletedSession(null);
    AsyncStorage.removeItem(LATEST_COMPLETED_SESSION_STORAGE_KEY).catch((error) => {
      console.warn('[GameContext] Failed to clear latest completed session on end:', error?.message || error);
    });
  }, [clearSubmitRecoveryTimeout, unsubscribeTopic]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const rawValue = await AsyncStorage.getItem(LATEST_COMPLETED_SESSION_STORAGE_KEY);
        if (!isMounted || !rawValue) {
          return;
        }

        const parsed = JSON.parse(rawValue);
        const isFreshEnough =
          parsed?.sessionId &&
          parsed?.createdAt &&
          Date.now() - parsed.createdAt < RESULTS_RECOVERY_TTL_MS;

        if (isFreshEnough) {
          setLatestCompletedSession(parsed);
          return;
        }

        await AsyncStorage.removeItem(LATEST_COMPLETED_SESSION_STORAGE_KEY);
      } catch (error) {
        console.warn('[GameContext] Failed to hydrate latest completed session:', error?.message || error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (wsConnectionState !== 'connected' || !activeSessionRef.current) {
      return;
    }

    ensureTopicSubscription(activeSessionRef.current);
    console.log('[GameContext] Realtime connected, refreshing active session snapshot:', activeSessionRef.current);
    hydrateCurrentQuestion(activeSessionRef.current);
  }, [ensureTopicSubscription, hydrateCurrentQuestion, wsConnectionState]);

  useEffect(() => {
    return () => {
      unsubscribeTopic();
      clearSubmitRecoveryTimeout();
      hydrationRequestIdRef.current += 1;
      activeSessionRef.current = null;
    };
  }, [clearSubmitRecoveryTimeout, unsubscribeTopic]);

  useEffect(() => {
    if (setGameContextRef) {
      setGameContextRef({ startGame, endGame, submitAnswer, handleRealtimePayload });
    }
  }, [endGame, handleRealtimePayload, setGameContextRef, startGame, submitAnswer]);

  const value = {
    activeSession,
    currentQuestion,
    myAnswer,
    waitingForPartner,
    roundState,
    gameStatus,
    statusNotice,
    expiredMessage,
    latestCompletedSession,
    round,
    guessResult,
    scores,
    correctCount,
    isTransitioning,
    isInvitationPending,
    isSubmitting,

    startGame,
    submitAnswer,
    submitGuess,
    acceptPendingInvitation,
    refreshCurrentQuestion,
    clearGuessResult,
    clearLatestCompletedSession,
    endGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
