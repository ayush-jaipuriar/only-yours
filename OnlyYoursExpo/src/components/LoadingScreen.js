import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import useTheme from '../theme/useTheme';
import { accessibilityStatusProps, decorativeAccessibilityProps } from '../accessibility';

const LoadingScreen = () => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const dotAnimations = dotAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, {
            toValue: -8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      )
    );
    dotAnimations.forEach((a) => a.start());

    return () => {
      pulseAnim.stopAnimation();
      dotAnims.forEach((a) => a.stopAnimation());
    };
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        },
        content: {
          alignItems: 'center',
          borderRadius: 28,
          paddingHorizontal: 34,
          paddingVertical: 30,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.glowPrimary,
        },
        logo: {
          fontSize: 36,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: 1,
        },
        tagline: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginTop: 6,
          fontStyle: 'italic',
        },
        dotsRow: {
          flexDirection: 'row',
          marginTop: 32,
          gap: 8,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.primary,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <View
        style={styles.content}
        accessible
        {...accessibilityStatusProps}
        accessibilityRole="progressbar"
        accessibilityLabel="Only Yours is loading"
        accessibilityHint="Please wait while the app finishes loading."
      >
        <Animated.Text style={[styles.logo, { opacity: pulseAnim }]}>
          Only Yours
        </Animated.Text>
        <Text style={styles.tagline}>made for two</Text>

        <View style={styles.dotsRow} {...decorativeAccessibilityProps}>
          {dotAnims.map((anim, i) => (
            <Animated.View
              key={`dot-${i}`}
              style={[
                styles.dot,
                { transform: [{ translateY: anim }] },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default LoadingScreen;
