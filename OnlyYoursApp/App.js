import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/state/AuthContext';
import { GameProvider } from './src/state/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '216762620268-7cqrrmkujnqat14tsusuhokhjoqeqlme.apps.googleusercontent.com',
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <GameProvider>
          <AppNavigator />
        </GameProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App; 