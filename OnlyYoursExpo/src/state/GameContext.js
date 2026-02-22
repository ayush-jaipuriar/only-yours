import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import WebSocketService from '../services/WebSocketService';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';

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

  const [subscription, setSubscription] = useState(null);
  const privateSubRef = useRef(null);

  const startGame = (sessionId) => {
    console.log('[GameContext] Starting game:', sessionId);

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

    const gameTopic = `/topic/game/${sessionId}`;
    const sub = WebSocketService.subscribe(gameTopic, (payload) => {
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
      } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
        console.log('[GameContext] Round 1 complete, transitioning...');
        setIsTransitioning(true);
        setCurrentQuestion(null);
        setMyAnswer(null);
        setWaitingForPartner(false);
      } else if (payload.type === 'GAME_RESULTS') {
        console.log('[GameContext] Game completed:', payload);
        setScores(payload);
        setGameStatus('completed');
        setIsTransitioning(false);
      }
    });

    setSubscription(sub);

    const privateSub = WebSocketService.subscribe(
      '/user/queue/game-events',
      (payload) => {
        if (payload.type === 'GUESS_RESULT') {
          console.log('[GameContext] Guess result:', payload.correct ? 'CORRECT' : 'WRONG');
          setGuessResult(payload);
          setCorrectCount(payload.correctCount || 0);
          setWaitingForPartner(true);
        }
      },
    );
    privateSubRef.current = privateSub;

    console.log('[GameContext] Subscribed to:', gameTopic);
  };

  const submitAnswer = (answer) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      return;
    }

    console.log('[GameContext] Submitting answer:', answer);

    setMyAnswer(answer);
    setWaitingForPartner(true);

    try {
      WebSocketService.sendMessage('/app/game.answer', {
        sessionId: activeSession,
        questionId: currentQuestion.questionId,
        answer: answer,
      });
    } catch (error) {
      console.error('[GameContext] Error sending answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
      setWaitingForPartner(false);
    }
  };

  const submitGuess = (guess) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      return;
    }

    console.log('[GameContext] Submitting guess:', guess);

    setMyAnswer(guess);
    setWaitingForPartner(true);

    try {
      WebSocketService.sendMessage('/app/game.guess', {
        sessionId: activeSession,
        questionId: currentQuestion.questionId,
        guess: guess,
      });
    } catch (error) {
      console.error('[GameContext] Error sending guess:', error);
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
      setWaitingForPartner(false);
    }
  };

  const clearGuessResult = () => {
    setGuessResult(null);
  };

  const endGame = () => {
    console.log('[GameContext] Ending game');

    if (subscription) {
      try { subscription.unsubscribe(); } catch (error) {
        console.error('[GameContext] Error unsubscribing:', error);
      }
    }
    if (privateSubRef.current) {
      try { privateSubRef.current.unsubscribe(); } catch (error) {
        console.error('[GameContext] Error unsubscribing private:', error);
      }
    }

    setActiveSession(null);
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setGameStatus(null);
    setSubscription(null);
    setRound(null);
    setGuessResult(null);
    setScores(null);
    setCorrectCount(0);
    setIsTransitioning(false);
    privateSubRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (subscription) {
        try { subscription.unsubscribe(); } catch (error) {
          console.error('[GameContext] Error during cleanup:', error);
        }
      }
      if (privateSubRef.current) {
        try { privateSubRef.current.unsubscribe(); } catch (error) {
          console.error('[GameContext] Error during private cleanup:', error);
        }
      }
    };
  }, [subscription]);

  useEffect(() => {
    if (setGameContextRef) {
      setGameContextRef({ startGame, endGame, submitAnswer });
    }
  }, [setGameContextRef]);

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

    startGame,
    submitAnswer,
    submitGuess,
    clearGuessResult,
    endGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
