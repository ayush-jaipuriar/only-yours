import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { GameProvider } from './src/state/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import ReconnectionBanner from './src/components/ReconnectionBanner';

/**
 * AppShell — the inner component that has access to AuthContext.
 *
 * We need this wrapper because ReconnectionBanner reads wsConnectionState from
 * AuthContext, but AuthProvider is a parent — so we need a child component
 * to consume the context value.
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

export default function App() {
  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <AuthProvider>
          <AppShell />
          <StatusBar style="auto" />
        </AuthProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
