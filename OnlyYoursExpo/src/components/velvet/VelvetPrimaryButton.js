import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import useTheme from '../../theme/useTheme';

const VelvetPrimaryButton = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: 52,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: theme.colors.primary,
          ...theme.shadows.button,
          shadowColor: theme.colors.glowPrimary,
        },
        disabled: {
          opacity: 0.7,
        },
        label: {
          color: theme.colors.primaryContrast,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }),
    [theme]
  );

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.primaryContrast} />
      ) : (
        <Text style={[styles.label, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export default VelvetPrimaryButton;
