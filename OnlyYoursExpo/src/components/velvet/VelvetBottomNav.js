import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../theme/useTheme';

const VelvetBottomNav = ({ items = [], activeKey, onPress, style }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          backgroundColor: theme.mode === 'light' ? theme.colors.surfaceOverlay : theme.colors.surface,
        },
        container: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 20 : 12,
          paddingTop: isTablet ? 12 : 10,
          paddingBottom: isTablet ? 10 : 8,
          backgroundColor: theme.mode === 'light' ? theme.colors.surfaceOverlay : theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        item: {
          minWidth: isTablet ? 92 : 78,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: isTablet ? 8 : 6,
          paddingHorizontal: 8,
        },
        iconText: {
          fontSize: isTablet ? 27 : 24,
          lineHeight: isTablet ? 30 : 27,
          fontWeight: '700',
        },
        label: {
          marginTop: 5,
          fontSize: isTablet ? 13 : 12,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        indicator: {
          marginTop: 5,
          width: 5,
          height: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        },
      }),
    [isTablet, theme]
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={[styles.container, style]}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => onPress?.(item.key)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
            >
              {typeof item.icon === 'string' ? (
                <Text
                  style={[
                    styles.iconText,
                    { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {item.icon}
                </Text>
              ) : (
                item.icon
              )}
              <Text
                style={[
                  styles.label,
                  { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {isActive ? <View style={styles.indicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default VelvetBottomNav;
