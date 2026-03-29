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
          width: '100%',
          alignSelf: 'stretch',
          backgroundColor: theme.mode === 'light' ? theme.colors.surfaceOverlay : theme.colors.surface,
        },
        container: {
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 18 : 6,
          paddingTop: isTablet ? 12 : 10,
          paddingBottom: isTablet ? 10 : 8,
          backgroundColor: theme.mode === 'light' ? theme.colors.surfaceOverlay : theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        item: {
          flex: 1,
          minWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: isTablet ? 8 : 6,
          paddingHorizontal: isTablet ? 8 : 2,
        },
        iconText: {
          fontSize: isTablet ? 26 : 22,
          lineHeight: isTablet ? 29 : 25,
          fontWeight: '700',
        },
        label: {
          marginTop: 4,
          fontSize: isTablet ? 13 : 10,
          fontWeight: '600',
          letterSpacing: isTablet ? 0.2 : 0.1,
          width: '100%',
          textAlign: 'center',
        },
        indicator: {
          marginTop: 4,
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
                numberOfLines={1}
                ellipsizeMode="clip"
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
