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
import { HapticsProvider } from './src/haptics';
import { ThemeProvider, useTheme } from './src/theme';

const AppShell = () => {
  const { wsConnectionState, isAuthLoading } = useAuth();
  const { theme, resolvedMode } = useTheme();

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ReconnectionBanner connectionState={wsConnectionState} />
      <GameProvider>
        <AppNavigator />
      </GameProvider>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </View>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <ThemeProvider>
          <HapticsProvider>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </HapticsProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
