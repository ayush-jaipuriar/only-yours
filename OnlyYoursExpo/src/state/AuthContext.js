import React, { createContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import WebSocketService from '../services/WebSocketService';
import NotificationService from '../services/NotificationService';
import api, { setLogoutHandler } from '../services/api';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();
const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  userData: 'userData',
};

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wsConnectionState, setWsConnectionState] = useState('disconnected');

  // Store navigation ref for invitation handling
  const navigationRef = useRef(null);
  const gameContextRef = useRef(null);
  const connectingRef = useRef(false);
  const gameEventsSubRef = useRef(null);

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

    const openGameSession = (sessionId) => {
      if (!sessionId) {
        return;
      }
      if (gameContextRef.current) {
        gameContextRef.current.startGame(sessionId);
      }
      if (navigationRef.current) {
        const currentRoute = navigationRef.current.getCurrentRoute?.();
        const isSameGameRoute =
          currentRoute?.name === 'Game' &&
          currentRoute?.params?.sessionId === sessionId;
        if (!isSameGameRoute) {
          navigationRef.current.navigate('Game', { sessionId });
        }
      }
    };

    switch (status.status) {
      case 'INVITATION_DECLINED':
        Alert.alert('Invitation Declined', status.message);
        break;
      case 'INVITATION_SENT':
      case 'INVITATION_ACCEPTED':
        openGameSession(status.sessionId);
        break;
      default:
        break;
    }
  };

  /**
   * Subscribe to game events after WebSocket connects.
   */
  const subscribeToGameEvents = () => {
    console.log('[AuthContext] Subscribing to game events');
    
    try {
      if (gameEventsSubRef.current) {
        try {
          gameEventsSubRef.current.unsubscribe();
        } catch (error) {
          console.warn('[AuthContext] Failed to unsubscribe previous game-events listener');
        }
      }

      gameEventsSubRef.current = WebSocketService.subscribe('/user/queue/game-events', (payload) => {
        console.log('[AuthContext] Game event received:', payload.type);
        
        if (payload.type === 'INVITATION') {
          handleInvitation(payload);
        } else if (payload.type === 'STATUS') {
          handleGameStatus(payload);
        }
      });
    } catch (error) {
      console.error('[AuthContext] Error subscribing to game events:', error);
    }
  };

  const persistAuthPayload = async (authPayload) => {
    const writes = [];
    if (authPayload?.accessToken) {
      writes.push([STORAGE_KEYS.accessToken, authPayload.accessToken]);
    }
    if (authPayload?.refreshToken) {
      writes.push([STORAGE_KEYS.refreshToken, authPayload.refreshToken]);
    }
    if (authPayload?.user) {
      writes.push([STORAGE_KEYS.userData, JSON.stringify(authPayload.user)]);
    }
    if (writes.length > 0) {
      await AsyncStorage.multiSet(writes);
    }
  };

  const clearAuthStorage = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.userData,
    ]);
  };

  const registerPushNotifications = async () => {
    try {
      const pushToken = await NotificationService.registerForPushNotifications();
      if (pushToken) {
        await NotificationService.sendTokenToBackend(pushToken);
      }
    } catch (error) {
      console.warn('[AuthContext] Push notification registration failed:', error?.message);
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const connectRealtime = async () => {
    if (connectingRef.current || WebSocketService.isConnected()) {
      return;
    }
    connectingRef.current = true;
    WebSocketService.setConnectionStateListener(setWsConnectionState);
    try {
      let lastError = null;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await WebSocketService.connect(API_BASE_URL);
          subscribeToGameEvents();
          registerPushNotifications();
          return;
        } catch (error) {
          lastError = error;
          console.warn(
            `[AuthContext] WebSocket connect attempt ${attempt}/${maxAttempts} failed:`,
            error?.message || error
          );
          if (attempt < maxAttempts) {
            await wait(1500 * attempt);
          }
        }
      }

      throw lastError || new Error('WebSocket connection failed');
    } finally {
      connectingRef.current = false;
    }
  };

  /**
   * Login and persist auth payload.
   *
   * authPayload must match backend AuthResponseDto:
   * {
   *   accessToken: string,
   *   refreshToken: string,
   *   user: { id, username, email }
   * }
   */
  const login = async (authPayload) => {
    await persistAuthPayload(authPayload);
    setIsLoggedIn(true);
    if (authPayload?.user) {
      setUser(authPayload.user);
    }

    // 401-triggered logout should skip server logout endpoint to avoid loops.
    setLogoutHandler(() => logout({ skipServerLogout: true }));

    try {
      await connectRealtime();
    } catch (error) {
      console.error('[AuthContext] WebSocket connection error:', error);
    }
  };

  /**
   * Logout and disconnect WebSocket.
   */
  const logout = async ({ skipServerLogout = false } = {}) => {
    if (!skipServerLogout) {
      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken });
        }
      } catch (error) {
        console.warn('[AuthContext] Logout API call failed; continuing local logout');
      }
    }

    await clearAuthStorage();
    if (gameEventsSubRef.current) {
      try {
        gameEventsSubRef.current.unsubscribe();
      } catch (error) {
        console.warn('[AuthContext] Failed to unsubscribe game-events listener during logout');
      } finally {
        gameEventsSubRef.current = null;
      }
    }
    setIsLoggedIn(false);
    setUser(null);
    setWsConnectionState('disconnected');
    WebSocketService.disconnect();
  };

  /**
   * Silent authentication on app start.
   * Uses refresh token to bootstrap a fresh access token.
   */
  useEffect(() => {
    let isMounted = true;
    setLogoutHandler(() => logout({ skipServerLogout: true }));

    (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
        const storedUserJson = await AsyncStorage.getItem(STORAGE_KEYS.userData);

        if (storedUserJson) {
          try {
            setUser(JSON.parse(storedUserJson));
          } catch (error) {
            console.warn('[AuthContext] Failed to parse stored user data');
          }
        }

        if (!refreshToken) {
          return;
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        if (!isMounted) {
          return;
        }

        await persistAuthPayload(response.data);
        setIsLoggedIn(true);
        if (response.data?.user) {
          setUser(response.data.user);
        }

        await connectRealtime();
      } catch (error) {
        if (isMounted) {
          await logout({ skipServerLogout: true });
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keep trying to recover realtime connection while user is logged in.
  useEffect(() => {
    if (!isLoggedIn || isAuthLoading || wsConnectionState === 'connected') {
      return;
    }

    const timer = setTimeout(() => {
      connectRealtime().catch((error) => {
        console.warn('[AuthContext] Background reconnect attempt failed:', error?.message || error);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, isAuthLoading, wsConnectionState]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn,
      isAuthLoading,
      user, 
      login, 
      logout,
      wsConnectionState,
      setNavigationRef,
      setGameContextRef,
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 