import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * EmptyState — reusable component for when a list or resource is empty or failed to load.
 *
 * UX principle: Empty states should always explain WHY the state is empty and
 * provide a clear ACTION the user can take. A blank screen with no guidance
 * causes confusion and abandonment.
 *
 * Pattern: Error states and empty states are different but share the same component:
 * - Empty: "No categories yet" (genuine absence of data)
 * - Error: "Couldn't load categories. Tap to retry." (network/server failure)
 *
 * Props:
 *   icon        {string}   — emoji or icon character (e.g., "📂", "⚠️")
 *   title       {string}   — primary headline
 *   message     {string}   — secondary descriptive text
 *   actionLabel {string}   — button label (optional — omit to show no button)
 *   onAction    {function} — callback for the action button
 */
const EmptyState = ({ icon = '📭', title, message, actionLabel, onAction }) => {
  return (
    <View style={styles.container} testID="empty-state">
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actionButton: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default EmptyState;
