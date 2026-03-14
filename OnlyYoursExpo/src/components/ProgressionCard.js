import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../theme/useTheme';

const SURFACE_BY_SCOPE = {
  COUPLE: 'badgeSurfaceRose',
  USER: 'badgeSurfaceMint',
};

// eslint-disable-next-line react/prop-types
const ProgressionCard = ({ snapshot, compact = false }) => {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 18,
          padding: compact ? 14 : 18,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          backgroundColor: theme.colors[SURFACE_BY_SCOPE[snapshot?.scope]] || theme.colors.surfaceElevated,
          marginBottom: 10,
        },
        eyebrow: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: theme.colors.textSecondary,
          marginBottom: 4,
        },
        title: {
          fontSize: compact ? 16 : 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          marginBottom: 4,
        },
        subtitle: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: compact ? 10 : 12,
        },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 10,
        },
        levelValue: {
          fontSize: compact ? 24 : 30,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        xpLabel: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        track: {
          height: 10,
          borderRadius: 999,
          backgroundColor: theme.colors.surfaceMuted,
          overflow: 'hidden',
          marginBottom: 10,
        },
        fill: {
          height: '100%',
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        },
        helperRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        },
        helperText: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          marginTop: 2,
        },
      }),
    [compact, snapshot?.scope, theme]
  );

  if (!snapshot) {
    return null;
  }

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${snapshot.label}. Level ${snapshot.level}. ${snapshot.xp} experience points.`}
    >
      <Text style={styles.eyebrow}>{snapshot.scope === 'COUPLE' ? 'Couple Progression' : 'Personal Progression'}</Text>
      <Text style={styles.title}>{snapshot.label}</Text>
      <Text style={styles.subtitle}>Level {snapshot.level} with {snapshot.xp} XP</Text>

      <View style={styles.statsRow}>
        <Text style={styles.levelValue}>Lv {snapshot.level}</Text>
        <Text style={styles.xpLabel}>{snapshot.xpToNextLevel} XP to next level</Text>
      </View>

      <View style={styles.track} accessible={false}>
        <View style={[styles.fill, { width: `${snapshot.progressPercent || 0}%` }]} />
      </View>

      <View style={styles.helperRow}>
        <Text style={styles.helperText}>This level: {snapshot.xpIntoCurrentLevel}/{snapshot.xpNeededForNextLevel}</Text>
        <Text style={styles.helperText}>Streak: {snapshot.currentStreakDays} now · {snapshot.longestStreakDays} best</Text>
        <Text style={styles.helperText}>{snapshot.achievementsUnlocked} achievements</Text>
      </View>
    </View>
  );
};

export default ProgressionCard;
