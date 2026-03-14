import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { accessibilityStatusProps, decorativeAccessibilityProps } from '../accessibility';

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
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
          backgroundColor: theme.colors.background,
        },
        panel: {
          width: '100%',
          maxWidth: 420,
          alignItems: 'center',
          borderRadius: 24,
          paddingHorizontal: 28,
          paddingVertical: 32,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.glowPrimary,
        },
        icon: {
          fontSize: 56,
          marginBottom: 20,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: 10,
        },
        message: {
          fontSize: 15,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 28,
        },
        actionButton: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 32,
          paddingVertical: 13,
          borderRadius: 25,
          ...theme.shadows.button,
          shadowColor: theme.colors.primary,
        },
        actionText: {
          color: theme.colors.primaryContrast,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container} testID="empty-state">
      <View style={styles.panel} accessible={!actionLabel} {...(!actionLabel ? accessibilityStatusProps : {})}>
        {icon ? <Text style={styles.icon} {...decorativeAccessibilityProps}>{icon}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onAction}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            accessibilityHint={title ? `${actionLabel}. ${title}.` : actionLabel}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default EmptyState;
