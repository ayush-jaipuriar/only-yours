import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useTheme from '../../theme/useTheme';

const TONE_CONFIG = {
  primary: { background: 'surfaceEmphasis', border: 'borderAccent', text: 'primary' },
  accent: { background: 'badgeSurfaceRose', border: 'accent', text: 'accent' },
  success: { background: 'badgeSurfaceMint', border: 'success', text: 'success' },
  warning: { background: 'badgeSurfacePeach', border: 'warning', text: 'warning' },
  danger: { background: 'bannerDanger', border: 'bannerDangerBorder', text: 'danger' },
  neutral: { background: 'surfaceMuted', border: 'border', text: 'textSecondary' },
};

const VelvetStatusPill = ({ label, tone = 'neutral', style, textStyle }) => {
  const { theme } = useTheme();
  const config = TONE_CONFIG[tone] || TONE_CONFIG.neutral;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          alignSelf: 'flex-start',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: theme.colors[config.background],
          borderWidth: 1,
          borderColor: theme.colors[config.border],
        },
        label: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: theme.colors[config.text],
        },
      }),
    [config, theme]
  );

  return (
    <View style={[styles.pill, style]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
};

export default VelvetStatusPill;
