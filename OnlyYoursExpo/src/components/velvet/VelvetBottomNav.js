import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../theme/useTheme';

const VelvetBottomNav = ({ items = [], activeKey, onPress, style }) => {
  const { theme } = useTheme();
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
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: theme.mode === 'light' ? theme.colors.surfaceOverlay : theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        item: {
          minWidth: 64,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 6,
          paddingHorizontal: 8,
        },
        label: {
          marginTop: 4,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        indicator: {
          marginTop: 4,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.primary,
        },
      }),
    [theme]
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
                <Text style={{ color: isActive ? theme.colors.primary : theme.colors.textSecondary }}>
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
