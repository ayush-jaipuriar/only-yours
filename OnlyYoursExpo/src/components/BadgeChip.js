import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';

const BADGE_THEME = {
  FIRST_GAME: { surface: 'badgeSurfaceGold', border: 'warning', icon: '✨' },
  FIVE_GAMES: { surface: 'badgeSurfaceSky', border: 'info', icon: '🎯' },
  TEN_GAMES: { surface: 'badgeSurfaceLavender', border: 'primary', icon: '🏆' },
  SHARP_GUESSER: { surface: 'badgeSurfaceRose', border: 'accent', icon: '🧠' },
  STREAK_3: { surface: 'badgeSurfacePeach', border: 'warning', icon: '🔥' },
  RESPONSIVE_COUPLE: { surface: 'badgeSurfaceMint', border: 'success', icon: '💌' },
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
      }),
    [theme]
  );

  if (!badge) {
    return null;
  }

  const { code, title, description } = badge;
  const badgeTheme = BADGE_THEME[code] || DEFAULT_THEME;
  const backgroundColor = theme.colors[badgeTheme.surface] || theme.colors.surfaceMuted;
  const borderColor = theme.colors[badgeTheme.border] || theme.colors.borderStrong;

  return (
    <View style={[styles.chip, { backgroundColor, borderColor }]}>
      <Text style={styles.icon}>{badgeTheme.icon}</Text>
      <View style={styles.textWrap}>
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
