import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const LoadingScreen = () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Text style={[styles.logo, { opacity: pulseAnim }]}>
          Only Yours
        </Animated.Text>
        <Text style={styles.tagline}>made for two</Text>

        <View style={styles.dotsRow}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2D225A',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#6B5FA8',
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
    backgroundColor: '#6A4CFF',
  },
});

export default LoadingScreen;
