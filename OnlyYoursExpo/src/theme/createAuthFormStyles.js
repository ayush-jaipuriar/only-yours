import { StyleSheet } from 'react-native';

const createAuthFormStyles = (theme, overrides = {}) =>
  StyleSheet.create({
    title: {
      fontSize: overrides.titleSize || 30,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: overrides.titleMarginBottom || 8,
    },
    subtitle: {
      fontSize: overrides.subtitleSize || 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: overrides.subtitleMarginBottom || 24,
    },
    input: {
      backgroundColor: theme.colors.surfaceInput,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 12,
      color: theme.colors.textPrimary,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 16,
      shadowColor: theme.colors.glowPrimary,
      ...theme.shadows.button,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: theme.colors.primaryContrast,
      fontWeight: '700',
      fontSize: 16,
    },
    linkText: {
      textAlign: 'center',
      color: theme.colors.accent,
      marginBottom: 12,
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      color: theme.colors.danger,
      marginBottom: 10,
      textAlign: 'center',
    },
    successText: {
      color: theme.colors.success,
      marginBottom: 10,
      textAlign: 'center',
    },
  });

export default createAuthFormStyles;
