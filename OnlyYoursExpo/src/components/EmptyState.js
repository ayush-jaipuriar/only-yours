import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { accessibilityStatusProps, decorativeAccessibilityProps } from '../accessibility';
import { VelvetPrimaryButton, VelvetSurfaceCard } from './velvet';

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
          paddingHorizontal: 28,
          paddingVertical: 32,
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
          minWidth: 180,
        },
        actionText: {
          fontSize: 16,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container} testID="empty-state">
      <VelvetSurfaceCard
        style={styles.panel}
        glow
        accessible={!actionLabel}
        {...(!actionLabel ? accessibilityStatusProps : {})}
      >
        {icon ? <Text style={styles.icon} {...decorativeAccessibilityProps}>{icon}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? (
          <VelvetPrimaryButton
            style={styles.actionButton}
            onPress={onAction}
            accessibilityHint={title ? `${actionLabel}. ${title}.` : actionLabel}
            label={actionLabel}
            textStyle={styles.actionText}
          />
        ) : null}
      </VelvetSurfaceCard>
    </View>
  );
};

export default EmptyState;
