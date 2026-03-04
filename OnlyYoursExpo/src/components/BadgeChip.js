import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';

const BADGE_THEME = {
  FIRST_GAME: { background: '#FFF4C2', border: '#D4A431', icon: '✨' },
  FIVE_GAMES: { background: '#E7F3FF', border: '#4A90E2', icon: '🎯' },
  TEN_GAMES: { background: '#EDE9FF', border: '#7B5AF0', icon: '🏆' },
  SHARP_GUESSER: { background: '#FDE6EA', border: '#DB4B73', icon: '🧠' },
  STREAK_3: { background: '#FFE8D5', border: '#F97316', icon: '🔥' },
  RESPONSIVE_COUPLE: { background: '#E2FAEE', border: '#2E9B66', icon: '💌' },
};

const DEFAULT_THEME = { background: '#F1F1F5', border: '#BDBDCB', icon: '🏅' };

// eslint-disable-next-line react/prop-types
const BadgeChip = ({ badge }) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
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

  return (
    <View style={[styles.chip, { backgroundColor: badgeTheme.background, borderColor: badgeTheme.border }]}>
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
