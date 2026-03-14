import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { decorativeAccessibilityProps } from '../accessibility';

const BADGE_THEME = {
  FIRST_GAME: { surface: 'badgeSurfaceGold', border: 'warning', icon: '✨' },
  FIVE_GAMES: { surface: 'badgeSurfaceSky', border: 'info', icon: '🎯' },
  TEN_GAMES: { surface: 'badgeSurfaceLavender', border: 'primary', icon: '🏆' },
  SHARP_GUESSER: { surface: 'badgeSurfaceRose', border: 'accent', icon: '🧠' },
  STREAK_3: { surface: 'badgeSurfacePeach', border: 'warning', icon: '🔥' },
  RESPONSIVE_COUPLE: { surface: 'badgeSurfaceMint', border: 'success', icon: '💌' },
  PROFILE_READY: { surface: 'badgeSurfaceSky', border: 'info', icon: '🪄' },
  MATCH_WINNER: { surface: 'badgeSurfaceRose', border: 'accent', icon: '🥇' },
  MIND_READER_25: { surface: 'badgeSurfaceLavender', border: 'primary', icon: '🔮' },
  DAILY_DEVOTION_7: { surface: 'badgeSurfaceMint', border: 'success', icon: '🌞' },
  STREAK_7: { surface: 'badgeSurfacePeach', border: 'warning', icon: '🔥' },
  LEVEL_5_USER: { surface: 'badgeSurfaceGold', border: 'warning', icon: '⭐' },
  LEVEL_10_USER: { surface: 'badgeSurfaceGold', border: 'warning', icon: '🌟' },
  COUPLE_FIRST_GAME: { surface: 'badgeSurfaceRose', border: 'accent', icon: '💞' },
  COUPLE_FIVE_GAMES: { surface: 'badgeSurfaceMint', border: 'success', icon: '🤝' },
  COUPLE_TEN_GAMES: { surface: 'badgeSurfaceLavender', border: 'primary', icon: '💎' },
  COUPLE_STREAK_3: { surface: 'badgeSurfacePeach', border: 'warning', icon: '🔥' },
  COUPLE_STREAK_7: { surface: 'badgeSurfacePeach', border: 'warning', icon: '🚀' },
  HEART_SYNC: { surface: 'badgeSurfaceRose', border: 'accent', icon: '💕' },
  PERFECT_PAIR: { surface: 'badgeSurfaceGold', border: 'warning', icon: '👑' },
  LEVEL_5_COUPLE: { surface: 'badgeSurfaceSky', border: 'info', icon: '💫' },
  LEVEL_10_COUPLE: { surface: 'badgeSurfaceSky', border: 'info', icon: '🌠' },
};

const DEFAULT_THEME = { surface: 'surfaceMuted', border: 'borderStrong', icon: '🏅' };

// eslint-disable-next-line react/prop-types
const BadgeChip = ({ badge }) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 16,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 8,
        },
        icon: {
          fontSize: 16,
          marginRight: 8,
        },
        textWrap: {
          flex: 1,
        },
        title: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 2,
        },
        description: {
          fontSize: 11,
          color: theme.colors.textSecondary,
        },
        scope: {
          fontSize: 10,
          color: theme.colors.textTertiary,
          fontWeight: '700',
          marginBottom: 3,
          textTransform: 'uppercase',
        },
      }),
    [theme]
  );

  if (!badge) {
    return null;
  }

  const { code, title, description, scope } = badge;
  const badgeTheme = BADGE_THEME[code] || DEFAULT_THEME;
  const backgroundColor = theme.colors[badgeTheme.surface] || theme.colors.surfaceMuted;
  const borderColor = theme.colors[badgeTheme.border] || theme.colors.borderStrong;

  return (
    <View
      style={[styles.chip, { backgroundColor, borderColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description}`}
    >
      <Text style={styles.icon} {...decorativeAccessibilityProps}>{badgeTheme.icon}</Text>
      <View style={styles.textWrap}>
        {scope ? <Text style={styles.scope}>{scope === 'COUPLE' ? 'Couple' : 'Personal'}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </View>
  );
};

export default BadgeChip;
