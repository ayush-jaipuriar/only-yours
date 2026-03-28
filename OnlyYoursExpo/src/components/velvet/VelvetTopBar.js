import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../theme/useTheme';

const VelvetTopBar = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightContent,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          backgroundColor: theme.colors.background,
        },
        bar: {
          minHeight: 64,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.background,
        },
        leftZone: {
          minWidth: 36,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
        iconButton: {
          paddingVertical: 8,
          paddingRight: 8,
        },
        iconText: {
          color: theme.colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
        center: {
          flex: 1,
          paddingHorizontal: 8,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 24,
          fontWeight: '700',
        },
        subtitle: {
          color: theme.colors.textSecondary,
          fontSize: 12,
          marginTop: 2,
        },
        rightZone: {
          minWidth: 36,
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.bar, style]}>
        <View style={styles.leftZone}>
          {leftIcon ? (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={typeof leftIcon === 'string' ? leftIcon : 'Back'}
            >
              {typeof leftIcon === 'string' ? <Text style={styles.iconText}>{leftIcon}</Text> : leftIcon}
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.center}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.rightZone}>{rightContent}</View>
      </View>
    </SafeAreaView>
  );
};

export default VelvetTopBar;
