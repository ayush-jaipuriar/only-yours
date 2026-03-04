import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';

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
        message: {
          marginTop: 12,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: 0.2,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container} testID="loading-spinner">
      <ActivityIndicator size={size} color={spinnerColor} />
      {message ? <Text style={[styles.message, { color: spinnerColor }]}>{message}</Text> : null}
    </View>
  );
};

export default LoadingSpinner;
