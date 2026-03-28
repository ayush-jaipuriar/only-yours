import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '../../theme/useTheme';

const clampProgress = (value) => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

const VelvetProgressBar = ({ progress = 0, height = 8, glow = true, style }) => {
  const { theme } = useTheme();
  const normalized = clampProgress(progress);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          width: '100%',
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceHero,
        },
        fill: {
          height: '100%',
          width: `${normalized * 100}%`,
          borderRadius: height / 2,
          backgroundColor: theme.colors.primary,
          shadowColor: glow ? theme.colors.primary : 'transparent',
          shadowOpacity: glow ? 0.45 : 0,
          shadowRadius: glow ? 10 : 0,
          shadowOffset: { width: 0, height: 0 },
        },
      }),
    [glow, height, normalized, theme]
  );

  return (
    <View style={[styles.track, style]}>
      <View style={styles.fill} />
    </View>
  );
};

export default VelvetProgressBar;
