import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '../../theme/useTheme';

const SURFACE_BY_VARIANT = {
  default: 'surfaceOverlay',
  elevated: 'surfaceElevated',
  muted: 'surfaceMuted',
  emphasis: 'surfaceEmphasis',
  solid: 'surface',
};

const BORDER_BY_VARIANT = {
  default: 'border',
  elevated: 'border',
  muted: 'border',
  emphasis: 'borderAccent',
  solid: 'border',
};

const VelvetSurfaceCard = ({
  children,
  variant = 'default',
  padding = 20,
  radius = 24,
  glow = false,
  style,
  accessible = false,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius,
          padding,
          backgroundColor: theme.colors[SURFACE_BY_VARIANT[variant]] || theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors[BORDER_BY_VARIANT[variant]] || theme.colors.border,
          ...theme.shadows.card,
          shadowColor: glow ? theme.colors.glowPrimary : theme.colors.overlayScrim,
        },
      }),
    [glow, padding, radius, theme, variant]
  );

  return (
    <View style={[styles.card, style]} accessible={accessible} {...rest}>
      {children}
    </View>
  );
};

export default VelvetSurfaceCard;
