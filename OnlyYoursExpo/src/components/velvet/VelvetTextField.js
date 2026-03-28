import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import useTheme from '../../theme/useTheme';

const VelvetTextField = forwardRef(({
  label,
  rightLabel,
  error,
  style,
  inputStyle,
  containerStyle,
  ...inputProps
}, ref) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 14,
        },
        labelRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        label: {
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        rightLabel: {
          color: theme.colors.accent,
          fontSize: 12,
          fontWeight: '600',
        },
        input: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surfaceInput,
          color: theme.colors.textPrimary,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        },
        error: {
          color: theme.colors.danger,
          fontSize: 12,
          marginTop: 6,
        },
      }),
    [error, theme]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label || rightLabel ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
        </View>
      ) : null}
      <TextInput
        ref={ref}
        style={[styles.input, style, inputStyle]}
        placeholderTextColor={theme.colors.textTertiary}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

VelvetTextField.displayName = 'VelvetTextField';

export default VelvetTextField;
