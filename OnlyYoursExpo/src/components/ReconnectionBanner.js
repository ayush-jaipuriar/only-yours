import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * ReconnectionBanner — slides down from the top when the WebSocket connection is lost.
 *
 * UX principle: Real-time features depend on an active connection. If the connection
 * drops silently, users may think the app is frozen or their actions are being
 * recorded when they're not. An explicit indicator builds trust and sets expectations.
 *
 * Animation: Uses React Native's Animated API with a translateY animation.
 * - Disconnected: banner slides INTO view (translateY: -40 → 0)
 * - Connected: banner slides OUT of view (translateY: 0 → -40)
 *
 * The banner stays off-screen (not just invisible) when hidden, so it doesn't
 * block touch events on other elements.
 *
 * Props:
 *   connectionState {string} — 'connected' | 'disconnected' | 'reconnecting'
 */
const ReconnectionBanner = ({ connectionState }) => {
  const translateY = useRef(new Animated.Value(-44)).current;
  const isVisible = connectionState === 'reconnecting' || connectionState === 'disconnected';

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : -44,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isVisible, translateY]);

  const bannerColor = connectionState === 'reconnecting' ? '#f57c00' : '#c62828';
  const message = connectionState === 'reconnecting'
    ? 'Reconnecting...'
    : 'No connection';

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: bannerColor, transform: [{ translateY }] }]}
      testID="reconnection-banner"
      pointerEvents="none"
    >
      <View style={styles.content}>
        <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 1000,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default ReconnectionBanner;
