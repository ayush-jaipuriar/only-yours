import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

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
const LoadingSpinner = ({ message = 'Loading...', color = '#6200ea', size = 'large' }) => {
  return (
    <View style={styles.container} testID="loading-spinner">
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={[styles.message, { color }]}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

export default LoadingSpinner;
