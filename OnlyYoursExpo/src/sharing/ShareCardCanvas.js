import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../theme/useTheme';

// eslint-disable-next-line react/prop-types
const ShareCardCanvas = ({ model }) => {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        frame: {
          width: 720,
          minHeight: 960,
          borderRadius: 36,
          padding: 32,
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          borderColor: theme.colors.borderAccent,
          overflow: 'hidden',
        },
        orbTop: {
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
          opacity: 0.12,
          top: -70,
          right: -40,
        },
        orbBottom: {
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: theme.colors.accent,
          opacity: 0.1,
          bottom: -90,
          left: -60,
        },
        badge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          marginBottom: 18,
        },
        eyebrow: {
          color: theme.colors.textPrimary,
          fontSize: 16,
          fontWeight: '800',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        },
        title: {
          fontSize: 44,
          lineHeight: 50,
          fontWeight: '900',
          color: theme.colors.textPrimary,
          marginBottom: 10,
        },
        subtitle: {
          fontSize: 22,
          lineHeight: 30,
          color: theme.colors.textSecondary,
          marginBottom: 24,
        },
        heroCard: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.borderAccent,
          borderRadius: 28,
          padding: 24,
          marginBottom: 20,
        },
        heroLabel: {
          fontSize: 16,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
          fontWeight: '700',
        },
        heroValue: {
          fontSize: 40,
          fontWeight: '900',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        body: {
          fontSize: 20,
          lineHeight: 28,
          color: theme.colors.textSecondary,
        },
        statsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        statCard: {
          width: '48.5%',
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 20,
          padding: 18,
          marginBottom: 12,
        },
        statLabel: {
          fontSize: 14,
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          marginBottom: 6,
          fontWeight: '700',
        },
        statValue: {
          fontSize: 28,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        chipsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 18,
        },
        chip: {
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
          marginBottom: 8,
        },
        chipText: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '700',
        },
        footerWrap: {
          marginTop: 'auto',
          paddingTop: 18,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        footerBrand: {
          fontSize: 18,
          fontWeight: '900',
          color: theme.colors.textPrimary,
          marginBottom: 6,
        },
        footerText: {
          fontSize: 16,
          lineHeight: 24,
          color: theme.colors.textSecondary,
        },
      }),
    [theme]
  );

  if (!model) {
    return null;
  }

  return (
    <View style={styles.frame} collapsable={false}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <View style={styles.badge}>
        <Text style={styles.eyebrow}>{model.eyebrow}</Text>
      </View>

      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{model.spotlightLabel}</Text>
        <Text style={styles.heroValue}>{model.spotlightValue}</Text>
        {model.body ? <Text style={styles.body}>{model.body}</Text> : null}
      </View>

      {model.stats?.length ? (
        <View style={styles.statsGrid}>
          {model.stats.map((stat) => (
            <View key={`${stat.label}-${stat.value}`} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {model.chips?.length ? (
        <View style={styles.chipsRow}>
          {model.chips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footerWrap}>
        <Text style={styles.footerBrand}>Only Yours</Text>
        <Text style={styles.footerText}>{model.footer}</Text>
      </View>
    </View>
  );
};

export default ShareCardCanvas;
