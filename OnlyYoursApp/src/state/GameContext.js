import React, { createContext, useContext, useState, useEffect } from 'react';
import WebSocketService from '../services/WebSocketService';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';

/**
 * GameContext provides global state management for active game sessions.
 * 
 * Manages:
 * - Active game session ID
 * - Current question data
 * - Player's answer and waiting state
 * - Game status (playing, waiting, complete)
 * - WebSocket subscription to game topic
 * 
 * Used by GameScreen and navigation components.
 */
const GameContext = createContext();

/**
 * Hook to access game context.
 * Must be used within GameProvider.
 * 
 * @returns {Object} Game context value with state and methods
 * @throws {Error} If used outside GameProvider
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

/**
 * GameProvider component wraps the app to provide game state.
 * Should be placed inside AuthProvider and above AppNavigator.
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export const GameProvider = ({ children }) => {
  const { setGameContextRef } = useContext(AuthContext);
  
  // Game session state
  const [activeSession, setActiveSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [gameStatus, setGameStatus] = useState(null); // 'playing', 'waiting', 'complete'
  
  // WebSocket subscription reference for cleanup
  const [subscription, setSubscription] = useState(null);

  /**
   * Starts a new game session and subscribes to game topic.
   * Called when invitation is accepted.
   * 
   * @param {string} sessionId UUID of the game session
   */
  const startGame = (sessionId) => {
    console.log('[GameContext] Starting game:', sessionId);
    
    setActiveSession(sessionId);
    setGameStatus('playing');
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    
    // Subscribe to game topic for this session
    const gameTopic = `/topic/game/${sessionId}`;
    const sub = WebSocketService.subscribe(gameTopic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        console.log('[GameContext] Received message:', payload.type);
        
        if (payload.type === 'QUESTION') {
          // New question arrived - reset state for new question
          console.log('[GameContext] New question:', payload.questionNumber);
          setCurrentQuestion(payload);
          setMyAnswer(null);
          setWaitingForPartner(false);
        } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
          // Round 1 finished
          console.log('[GameContext] Round 1 complete');
          setGameStatus('complete');
          Alert.alert(
            'Round 1 Complete!',
            'Great job! Round 2 coming soon...',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('[GameContext] Error parsing message:', error);
      }
    });
    
    setSubscription(sub);
    console.log('[GameContext] Subscribed to:', gameTopic);
  };

  /**
   * Submits an answer for the current question.
   * Sets waiting state until partner answers or next question arrives.
   * 
   * @param {string} answer Selected answer ("A", "B", "C", or "D")
   */
  const submitAnswer = (answer) => {
    if (!activeSession || !currentQuestion) {
      console.error('[GameContext] No active session or question');
      Alert.alert('Error', 'No active game or question');
      return;
    }

    console.log('[GameContext] Submitting answer:', answer);
    
    // Update local state
    setMyAnswer(answer);
    setWaitingForPartner(true);

    // Send to backend via WebSocket
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

  /**
   * Ends the current game session and cleans up subscriptions.
   * Called when game finishes or player navigates away.
   */
  const endGame = () => {
    console.log('[GameContext] Ending game');
    
    // Unsubscribe from game topic
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('[GameContext] Error unsubscribing:', error);
      }
    }
    
    // Reset all state
    setActiveSession(null);
    setCurrentQuestion(null);
    setMyAnswer(null);
    setWaitingForPartner(false);
    setGameStatus(null);
    setSubscription(null);
  };

  /**
   * Cleanup on component unmount.
   * Ensures WebSocket subscription is properly closed.
   */
  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('[GameContext] Error during cleanup:', error);
        }
      }
    };
  }, [subscription]);

  /**
   * Register this context with AuthContext on mount.
   * Allows AuthContext to call startGame when invitation is accepted.
   */
  useEffect(() => {
    if (setGameContextRef) {
      setGameContextRef({ startGame, endGame, submitAnswer });
    }
  }, [setGameContextRef]);

  // Context value provided to children
  const value = {
    // State
    activeSession,
    currentQuestion,
    myAnswer,
    waitingForPartner,
    gameStatus,
    
    // Methods
    startGame,
    submitAnswer,
    endGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
