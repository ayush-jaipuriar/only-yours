import { StyleSheet } from 'react-native';

const createAuthFormStyles = (theme, overrides = {}) =>
  StyleSheet.create({
    eyebrow: {
      fontSize: overrides.eyebrowSize || 11,
      color: theme.colors.accent,
      textAlign: 'center',
      marginBottom: overrides.eyebrowMarginBottom || 10,
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: overrides.titleSize || 30,
      fontFamily: theme.fontFamilies.heading,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: overrides.titleMarginBottom || 8,
    },
    subtitle: {
      fontSize: overrides.subtitleSize || 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: overrides.subtitleLineHeight || 22,
      marginBottom: overrides.subtitleMarginBottom || 24,
    },
    formStack: {
      width: '100%',
      marginTop: overrides.formStackMarginTop || 4,
    },
    primaryAction: {
      marginTop: overrides.primaryActionMarginTop || 6,
      marginBottom: overrides.primaryActionMarginBottom || 14,
    },
    secondaryAction: {
      marginTop: 8,
    },
    linkText: {
      textAlign: 'center',
      color: theme.colors.accent,
      marginBottom: 12,
      fontSize: 14,
      fontWeight: '600',
    },
    supportText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: 4,
      marginBottom: 4,
      fontSize: 13,
      lineHeight: 18,
    },
    supportLinkInline: {
      color: theme.colors.accent,
      fontWeight: '700',
    },
    linkCluster: {
      width: '100%',
      marginTop: overrides.linkClusterMarginTop || 4,
    },
    messageCard: {
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
    },
    messageCardError: {
      backgroundColor: theme.colors.bannerDanger,
      borderColor: theme.colors.bannerDangerBorder,
    },
    messageCardSuccess: {
      backgroundColor: theme.colors.badgeSurfaceMint,
      borderColor: theme.colors.success,
    },
    messageText: {
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 18,
    },
    errorText: {
      color: theme.colors.danger,
    },
    successText: {
      color: theme.colors.success,
    },
    subtleMeta: {
      textAlign: 'center',
      color: theme.colors.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
  });

export default createAuthFormStyles;
