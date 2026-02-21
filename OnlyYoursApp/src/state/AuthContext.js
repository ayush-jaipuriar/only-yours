import React, { createContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import WebSocketService from '../services/WebSocketService';

export const AuthContext = createContext();

/**
 * Custom hook to access auth context.
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * AuthProvider manages authentication state and WebSocket connection.
 * 
 * Sprint 4 Update: Added game invitation handling
 * - Subscribes to /user/queue/game-events
 * - Shows invitation alert with accept/decline options
 * - Handles invitation responses via WebSocket
 */
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [apiBase, setApiBase] = useState('http://localhost:8080');
  
  // Store navigation ref for invitation handling
  const navigationRef = useRef(null);
  const gameContextRef = useRef(null);

  /**
   * Set navigation ref from AppNavigator.
   * Used to navigate when invitation is accepted.
   */
  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  /**
   * Set game context ref from GameProvider.
   * Used to start game session when invitation is accepted.
   */
  const setGameContextRef = (ref) => {
    gameContextRef.current = ref;
  };

  /**
   * Handle incoming game invitation.
   * Shows alert with accept/decline options.
   */
  const handleInvitation = (invitation) => {
    console.log('[AuthContext] Game invitation received:', invitation);

    Alert.alert(
      `Game Invitation from ${invitation.inviterName}`,
      `Category: ${invitation.categoryName}\n${invitation.categoryDescription || ''}`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => {
            console.log('[AuthContext] Declining invitation');
            try {
              WebSocketService.sendMessage('/app/game.decline', {
                sessionId: invitation.sessionId,
              });
            } catch (error) {
              console.error('[AuthContext] Error declining invitation:', error);
            }
          },
        },
        {
          text: 'Accept',
          onPress: () => {
            console.log('[AuthContext] Accepting invitation');
            try {
              // Send acceptance message
              WebSocketService.sendMessage('/app/game.accept', {
                sessionId: invitation.sessionId,
              });
              
              // Start game in GameContext
              if (gameContextRef.current) {
                gameContextRef.current.startGame(invitation.sessionId);
              }
              
              // Navigate to Game screen
              if (navigationRef.current) {
                navigationRef.current.navigate('Game', { 
                  sessionId: invitation.sessionId 
                });
              }
            } catch (error) {
              console.error('[AuthContext] Error accepting invitation:', error);
              Alert.alert('Error', 'Failed to accept invitation. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle game status messages (invitation declined, etc.).
   */
  const handleGameStatus = (status) => {
    console.log('[AuthContext] Game status:', status.status);
    
    if (status.status === 'INVITATION_DECLINED') {
      Alert.alert('Invitation Declined', status.message);
    } else if (status.status === 'INVITATION_SENT') {
      // Confirmation that invitation was sent successfully
      console.log('[AuthContext] Invitation sent confirmation');
    }
  };

  /**
   * Subscribe to game events after WebSocket connects.
   */
  const subscribeToGameEvents = () => {
    console.log('[AuthContext] Subscribing to game events');
    
    try {
      WebSocketService.subscribe('/user/queue/game-events', (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('[AuthContext] Game event received:', payload.type);
          
          if (payload.type === 'INVITATION') {
            handleInvitation(payload);
          } else if (payload.type === 'STATUS') {
            handleGameStatus(payload);
          }
        } catch (error) {
          console.error('[AuthContext] Error parsing game event:', error);
        }
      });
    } catch (error) {
      console.error('[AuthContext] Error subscribing to game events:', error);
    }
  };

  /**
   * Login and connect WebSocket with game event subscription.
   */
  const login = async (userData) => {
    setIsLoggedIn(true);
    if (userData) {
      setUser(userData);
    }
    
    try {
      await WebSocketService.connect(apiBase);
      // Subscribe to game events after connection
      subscribeToGameEvents();
    } catch (error) {
      console.error('[AuthContext] WebSocket connection error:', error);
      // Service will auto-retry
    }
  };

  /**
   * Logout and disconnect WebSocket.
   */
  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setUser(null);
    WebSocketService.disconnect();
  };

  /**
   * Silent authentication on app start.
   */
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setIsLoggedIn(true);
        try {
          await WebSocketService.connect(apiBase);
          // Subscribe to game events after silent auth
          subscribeToGameEvents();
        } catch (error) {
          console.error('[AuthContext] Silent auth WebSocket error:', error);
        }
      }
    })();
  }, [apiBase]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      login, 
      logout,
      setNavigationRef,
      setGameContextRef,
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 