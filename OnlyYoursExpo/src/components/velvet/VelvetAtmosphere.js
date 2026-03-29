import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '../../theme/useTheme';
import { decorativeAccessibilityProps } from '../../accessibility';

const GLOW_VARIANTS = {
  default: {
    top: { top: -110, left: -36, size: 240, color: 'glowPrimary', opacity: 0.95 },
    bottom: { bottom: -120, right: -48, size: 260, color: 'glowAccent', opacity: 0.7 },
  },
  auth: {
    top: { top: -120, left: -40, size: 260, color: 'glowPrimary', opacity: 1 },
    bottom: { bottom: -120, right: -60, size: 300, color: 'glowAccent', opacity: 0.8 },
  },
  focused: {
    top: { top: -90, left: -28, size: 210, color: 'glowPrimary', opacity: 0.7 },
    bottom: { bottom: -90, right: -40, size: 220, color: 'glowPrimary', opacity: 0.35 },
  },
};

const createGlowStyle = ({ size, color, opacity, top, left, right, bottom }, theme) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: theme.colors[color],
  opacity,
  top,
  left,
  right,
  bottom,
});

const VelvetAtmosphere = ({ variant = 'default' }) => {
  const { theme } = useTheme();
  const baseGlowConfig = GLOW_VARIANTS[variant] || GLOW_VARIANTS.default;
  const glowConfig = useMemo(() => {
    if (variant !== 'focused' || theme.mode !== 'light') {
      return baseGlowConfig;
    }

    return {
      top: {
        ...baseGlowConfig.top,
        size: 290,
        opacity: 0.88,
      },
      bottom: {
        ...baseGlowConfig.bottom,
        size: 300,
        color: 'glowAccent',
        opacity: 0.54,
      },
    };
  }, [baseGlowConfig, theme.mode, variant]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        canvas: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: variant === 'focused' && theme.mode === 'light'
            ? theme.colors.backgroundMuted
            : theme.colors.backgroundCanvas,
        },
        topGlow: createGlowStyle(glowConfig.top, theme),
        bottomGlow: createGlowStyle(glowConfig.bottom, theme),
      }),
    [glowConfig, theme, variant]
  );

  return (
    <View style={styles.canvas} pointerEvents="none" {...decorativeAccessibilityProps}>
      <View style={styles.topGlow} {...decorativeAccessibilityProps} />
      <View style={styles.bottomGlow} {...decorativeAccessibilityProps} />
    </View>
  );
};

export default VelvetAtmosphere;
