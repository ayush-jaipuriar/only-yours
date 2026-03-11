import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../state/AuthContext';
import useTheme from '../theme/useTheme';
import { getGradientToken } from '../theme/gradients';

/* eslint-disable react/prop-types */

const ONBOARDING_STEPS = [
  {
    key: 'connect',
    emoji: '💞',
    title: 'Link with your partner',
    description:
      'Generate a secure code and connect your partner account so both of you can play in real time.',
  },
  {
    key: 'play',
    emoji: '🎯',
    title: 'Play round-by-round',
    description:
      'You answer one question at a time, then guess how your partner answered in round two.',
  },
  {
    key: 'track',
    emoji: '🏆',
    title: 'Track growth together',
    description:
      'Review history, streaks, and badges to celebrate consistency and learn your patterns.',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { startOnboarding, completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const gradient = getGradientToken('romanceSoft', theme.mode);
  const currentStep = ONBOARDING_STEPS[currentIndex];
  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;
  const contentWidth = Math.min(width - 32, 640);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        card: {
          width: contentWidth,
          backgroundColor: theme.colors.surfaceOverlay,
          borderColor: theme.colors.borderAccent,
          shadowColor: theme.colors.glowPrimary,
        },
        heroCard: {
          backgroundColor: gradient.fallback,
        },
        title: {
          color: theme.colors.textPrimary,
        },
        subtitle: {
          color: theme.colors.textSecondary,
        },
        progressTrack: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        progressFill: {
          backgroundColor: theme.colors.primary,
        },
        stepTitle: {
          color: theme.colors.textPrimary,
        },
        stepDescription: {
          color: theme.colors.textSecondary,
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
        },
        primaryButtonText: {
          color: theme.colors.primaryContrast,
        },
        secondaryButton: {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
        },
        secondaryButtonText: {
          color: theme.colors.textSecondary,
        },
      }),
    [contentWidth, gradient.fallback, theme]
  );

  useEffect(() => {
    startOnboarding().catch(() => {
      console.warn('[OnboardingScreen] Could not mark onboarding as started');
    });
    // We only need this side effect once when the onboarding screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToNext = async () => {
    if (!isLastStep) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    try {
      setIsFinishing(true);
      await completeOnboarding();
      navigation.replace('Dashboard');
    } finally {
      setIsFinishing(false);
    }
  };

  const skipOnboarding = async () => {
    try {
      setIsFinishing(true);
      await completeOnboarding();
      navigation.replace('Dashboard');
    } finally {
      setIsFinishing(false);
    }
  };

  const progressPercent = ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <ScrollView
      style={dynamicStyles.screen}
      contentContainerStyle={styles.scrollContent}
      testID="onboarding-screen"
    >
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={[styles.heroCard, dynamicStyles.heroCard]}>
          <Text style={styles.heroEmoji}>💗</Text>
          <Text style={[styles.title, dynamicStyles.title]}>Welcome to Only Yours</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Let’s set up your experience in under a minute.
          </Text>
        </View>

        <View style={[styles.progressTrack, dynamicStyles.progressTrack]}>
          <View style={[styles.progressFill, dynamicStyles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={[styles.progressLabel, dynamicStyles.subtitle]}>
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length}
        </Text>

        <View style={styles.stepCard}>
          <Text style={styles.stepEmoji}>{currentStep.emoji}</Text>
          <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>{currentStep.title}</Text>
          <Text style={[styles.stepDescription, dynamicStyles.stepDescription]}>
            {currentStep.description}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, dynamicStyles.primaryButton, isFinishing && styles.disabledButton]}
          onPress={goToNext}
          disabled={isFinishing}
        >
          <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {!isLastStep && (
          <TouchableOpacity
            style={[styles.secondaryButton, dynamicStyles.secondaryButton, isFinishing && styles.disabledButton]}
            onPress={skipOnboarding}
            disabled={isFinishing}
          >
            <Text style={[styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  heroCard: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressTrack: {
    height: 8,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    marginTop: 8,
    marginHorizontal: 20,
    fontSize: 13,
    textAlign: 'right',
  },
  stepCard: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default OnboardingScreen;
