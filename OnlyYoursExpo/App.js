import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { GameProvider } from './src/state/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import ReconnectionBanner from './src/components/ReconnectionBanner';
import LoadingScreen from './src/components/LoadingScreen';

const AppShell = () => {
  const { wsConnectionState, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

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
