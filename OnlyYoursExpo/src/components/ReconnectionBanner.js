import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { accessibilityAlertProps, announceForAccessibility } from '../accessibility';

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
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-44)).current;
  const isVisible = connectionState === 'reconnecting' || connectionState === 'disconnected';

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : -44,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isVisible, translateY]);

  useEffect(() => {
    if (connectionState === 'reconnecting') {
      announceForAccessibility('Disconnected. Trying to reconnect.');
      return;
    }

    if (connectionState === 'disconnected') {
      announceForAccessibility('No connection. Real-time updates may be delayed.');
    }
  }, [connectionState]);

  const bannerColor = connectionState === 'reconnecting'
    ? theme.colors.bannerWarning
    : theme.colors.bannerDanger;
  const bannerBorderColor = connectionState === 'reconnecting'
    ? theme.colors.bannerWarningBorder
    : theme.colors.bannerDangerBorder;
  const message = connectionState === 'reconnecting'
    ? 'Reconnecting...'
    : 'No connection';

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          borderBottomWidth: 1,
          shadowColor: theme.colors.overlayScrim,
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
          color: theme.colors.textOnEmphasis,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }),
    [theme]
  );

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bannerColor, borderBottomColor: bannerBorderColor, transform: [{ translateY }] },
      ]}
      testID="reconnection-banner"
      pointerEvents="none"
    >
      <View
        style={styles.content}
        accessible
        accessibilityLabel={message}
        {...accessibilityAlertProps}
      >
        <ActivityIndicator size="small" color={theme.colors.textOnEmphasis} style={styles.spinner} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default ReconnectionBanner;
