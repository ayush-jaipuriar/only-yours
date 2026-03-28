import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import useTheme from '../../theme/useTheme';

const VelvetSecondaryButton = ({
  label,
  onPress,
  disabled = false,
  tone = 'default',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const isDanger = tone === 'danger';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: 50,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          paddingVertical: 13,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: isDanger ? theme.colors.danger : theme.colors.border,
        },
        disabled: {
          opacity: 0.65,
        },
        label: {
          color: isDanger ? theme.colors.danger : theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [isDanger, theme]
  );

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default VelvetSecondaryButton;
