import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import useTheme from '../../theme/useTheme';

const VelvetOptionCard = ({
  children,
  onPress,
  selected = false,
  submitted = false,
  disabled = false,
  tone = 'primary',
  style,
  activeOpacity = 0.7,
  ...rest
}) => {
  const { theme } = useTheme();
  const isAccentTone = tone === 'accent';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.mode === 'light'
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.mode === 'light'
            ? theme.colors.borderStrong
            : theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.overlayScrim,
        },
        selected: {
          borderColor: isAccentTone ? theme.colors.accent : theme.colors.primary,
          backgroundColor: theme.mode === 'light'
            ? (isAccentTone ? theme.colors.badgeSurfaceLavender : theme.colors.badgeSurfaceRose)
            : (isAccentTone ? theme.colors.badgeSurfaceMint : theme.colors.surfaceEmphasis),
        },
        submitted: {
          borderColor: theme.colors.accent,
          backgroundColor: theme.mode === 'light'
            ? theme.colors.celebrationSurface
            : theme.colors.badgeSurfaceMint,
        },
        disabled: {
          opacity: 0.6,
        },
      }),
    [isAccentTone, theme]
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[
        styles.card,
        selected && styles.selected,
        submitted && styles.submitted,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

export default VelvetOptionCard;
