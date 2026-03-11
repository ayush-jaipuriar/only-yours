import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { accessibilityStatusProps } from '../accessibility';

/**
 * LoadingSpinner — reusable full-screen loading indicator.
 *
 * Design principle: Consistent loading states across all screens prevent
 * "blank screen flash" (screen is empty while data loads) which causes a jarring UX.
 *
 * Props:
 *   message {string} — optional text shown below the spinner (e.g., "Loading categories...")
 *   color   {string} — spinner color (defaults to the app's primary purple)
 *   size    {'small'|'large'} — spinner size (defaults to 'large')
 */
const LoadingSpinner = ({ message = 'Loading...', color, size = 'large' }) => {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.primary;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        },
        panel: {
          minWidth: 220,
          maxWidth: 320,
          alignItems: 'center',
          borderRadius: 24,
          paddingHorizontal: 26,
          paddingVertical: 28,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.glowPrimary,
        },
        message: {
          marginTop: 12,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: 0.2,
          textAlign: 'center',
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container} testID="loading-spinner">
      <View
        style={styles.panel}
        accessible
        {...accessibilityStatusProps}
        accessibilityRole="progressbar"
        accessibilityLabel={message || 'Loading'}
      >
        <ActivityIndicator size={size} color={spinnerColor} />
        {message ? <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text> : null}
      </View>
    </View>
  );
};

export default LoadingSpinner;
