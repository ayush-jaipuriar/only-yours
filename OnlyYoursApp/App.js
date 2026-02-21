import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { GameProvider } from './src/state/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import ReconnectionBanner from './src/components/ReconnectionBanner';

/**
 * AppShell — the inner component that has access to AuthContext.
 *
 * We need this wrapper because ReconnectionBanner reads wsConnectionState from
 * AuthContext, but AuthProvider is a parent — so we need a child component
 * to consume the context value.
 *
 * Architecture pattern: Provider → Consumer (child component reads the context)
 */
const AppShell = () => {
  const { wsConnectionState } = useAuth();

  return (
    <View style={styles.root}>
      <ReconnectionBanner connectionState={wsConnectionState} />
      <GameProvider>
        <AppNavigator />
      </GameProvider>
    </View>
  );
};

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '216762620268-7cqrrmkujnqat14tsusuhokhjoqeqlme.apps.googleusercontent.com',
    });
  }, []);

  return (
    /**
     * AppErrorBoundary: Outermost wrapper — catches any unhandled React errors.
     * GestureHandlerRootView: Required by @react-navigation for gesture support.
     * AuthProvider: Provides isLoggedIn, user, wsConnectionState to all children.
     * AppShell: Reads wsConnectionState and renders ReconnectionBanner + navigation.
     */
    <AppErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
