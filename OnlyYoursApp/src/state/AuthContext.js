import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/WebSocketService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [apiBase, setApiBase] = useState('http://localhost:8080');

  const login = async () => {
    setIsLoggedIn(true);
    try {
      await WebSocketService.connect(apiBase);
    } catch (e) {
      // noop for now; service will auto-retry
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setUser(null);
    WebSocketService.disconnect();
  };

  useEffect(() => {
    // Attempt silent auth based on stored token
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setIsLoggedIn(true);
        try {
          await WebSocketService.connect(apiBase);
        } catch (e) {}
      }
    })();
  }, [apiBase]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 