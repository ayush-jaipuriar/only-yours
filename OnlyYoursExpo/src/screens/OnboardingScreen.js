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
import { VelvetPrimaryButton, VelvetScreen, VelvetSecondaryButton, VelvetSurfaceCard } from '../components/velvet';
import useTheme from '../theme/useTheme';
import { announceForAccessibility, decorativeAccessibilityProps } from '../accessibility';

/* eslint-disable react/prop-types */

const ONBOARDING_STEPS = [
  {
    key: 'connect',
    stepLabel: 'Step 1 of 3',
    eyebrow: 'Private Shared Space',
    title: 'Connect Your Worlds',
    description:
      'Link with your partner to unlock a private sanctuary designed for the two of you alone.',
    supporting:
      'Generate a secure code, connect in seconds, and step into a shared experience that feels personal from the very beginning.',
    visual: {
      emoji: '💞',
      highlights: ['Secure partner code', 'Private couple connection'],
    },
  },
  {
    key: 'play',
    stepLabel: 'Step 2 of 3',
    eyebrow: 'Round-by-Round Play',
    title: 'Discover Each Other',
    description:
      'Answer one question at a time, then guess how your partner answered when round two begins.',
    supporting:
      'The flow is designed to build anticipation slowly, so every answer feels intimate and every guess feels meaningful.',
    visual: {
      emoji: '🎯',
      highlights: ['Answer first, guess later', 'Momentum without overwhelm'],
    },
  },
  {
    key: 'track',
    stepLabel: 'Step 3 of 3',
    eyebrow: 'Celebrate Growth',
    title: 'Celebrate Your Bond',
    description:
      'Track streaks, milestones, badges, and meaningful progress as your shared story evolves over time.',
    supporting:
      'You are not just playing a quiz. You are building a private ritual and a record of how your connection grows.',
    visual: {
      emoji: '🏆',
      highlights: ['Milestones worth sharing', 'Progress you can feel'],
    },
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { startOnboarding, completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentStep = ONBOARDING_STEPS[currentIndex];
  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;
  const progressPercent = ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100;
  const contentWidth = Math.min(width - 32, 640);
  const isTablet = width >= 768;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 28,
          paddingBottom: 32,
        },
        shell: {
          width: contentWidth,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        },
        brand: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 30,
          fontStyle: 'italic',
        },
        stepMeta: {
          color: theme.colors.textTertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        progressTrack: {
          height: 4,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceElevated,
          marginBottom: 24,
        },
        progressFill: {
          height: '100%',
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        },
        heroCard: {
          marginBottom: 18,
          overflow: 'hidden',
        },
        heroVisual: {
          minHeight: isTablet ? 340 : 292,
          borderRadius: 22,
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 20,
          backgroundColor: theme.colors.surfaceOverlay,
          position: 'relative',
          justifyContent: 'space-between',
        },
        glowLarge: {
          position: 'absolute',
          width: isTablet ? 300 : 220,
          height: isTablet ? 300 : 220,
          borderRadius: 999,
          backgroundColor: theme.colors.glowPrimary,
          opacity: 0.42,
          top: -42,
          right: -26,
        },
        glowSmall: {
          position: 'absolute',
          width: isTablet ? 180 : 132,
          height: isTablet ? 180 : 132,
          borderRadius: 999,
          backgroundColor: theme.colors.glowAccent,
          opacity: 0.24,
          bottom: 24,
          left: -10,
        },
        visualBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderAccent,
        },
        visualBadgeText: {
          color: theme.colors.accent,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        },
        visualCenter: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 12,
          marginBottom: 12,
        },
        visualHalo: {
          width: isTablet ? 188 : 160,
          height: isTablet ? 188 : 160,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.borderAccent,
          backgroundColor: theme.colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        visualHaloInner: {
          width: isTablet ? 138 : 118,
          height: isTablet ? 138 : 118,
          borderRadius: 999,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        visualEmoji: {
          fontSize: isTablet ? 58 : 50,
        },
        visualHighlights: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
        },
        highlightPill: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        highlightPillText: {
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
        },
        contentCard: {
          marginBottom: 20,
        },
        eyebrow: {
          color: theme.colors.accent,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          marginBottom: 12,
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 42 : 36,
          lineHeight: isTablet ? 48 : 42,
          marginBottom: 12,
        },
        description: {
          color: theme.colors.textPrimary,
          fontSize: 18,
          lineHeight: 28,
          marginBottom: 12,
        },
        supporting: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 24,
        },
        footer: {
          marginTop: 4,
        },
        primaryAction: {
          marginBottom: 12,
        },
        secondaryAction: {
          marginBottom: 12,
        },
        tertiaryActionText: {
          color: theme.colors.textSecondary,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: '600',
        },
        disabledAction: {
          opacity: 0.6,
        },
      }),
    [contentWidth, isTablet, theme]
  );

  useEffect(() => {
    startOnboarding().catch(() => {
      console.warn('[OnboardingScreen] Could not mark onboarding as started');
    });
    // We only need this side effect once when the onboarding screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    announceForAccessibility(
      `Onboarding step ${currentIndex + 1} of ${ONBOARDING_STEPS.length}. ${currentStep.title}.`
    );
  }, [currentIndex, currentStep.title]);

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

  const goBack = () => {
    if (currentIndex === 0 || isFinishing) {
      return;
    }
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <VelvetScreen withAtmosphere atmosphere="auth" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        testID="onboarding-screen"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <View style={styles.topRow}>
            <Text style={styles.brand}>Only Yours</Text>
            <Text style={styles.stepMeta}>{currentStep.stepLabel}</Text>
          </View>

          <View
            style={styles.progressTrack}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Onboarding progress"
            accessibilityValue={{ min: 1, now: currentIndex + 1, max: ONBOARDING_STEPS.length }}
          >
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <VelvetSurfaceCard variant="default" glow style={styles.heroCard}>
            <View style={styles.heroVisual}>
              <View style={styles.glowLarge} />
              <View style={styles.glowSmall} />

              <View style={styles.visualBadge}>
                <Text style={styles.visualBadgeText}>{currentStep.eyebrow}</Text>
              </View>

              <View style={styles.visualCenter}>
                <View style={styles.visualHalo}>
                  <View style={styles.visualHaloInner}>
                    <Text style={styles.visualEmoji} {...decorativeAccessibilityProps}>
                      {currentStep.visual.emoji}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.visualHighlights}>
                {currentStep.visual.highlights.map((highlight) => (
                  <View key={highlight} style={styles.highlightPill}>
                    <Text style={styles.highlightPillText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          </VelvetSurfaceCard>

          <VelvetSurfaceCard variant="solid" style={styles.contentCard}>
            <Text style={styles.eyebrow}>{currentStep.eyebrow}</Text>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.description}>{currentStep.description}</Text>
            <Text style={styles.supporting}>{currentStep.supporting}</Text>
          </VelvetSurfaceCard>

          <View style={styles.footer}>
            <VelvetPrimaryButton
              label={isLastStep ? 'Get Started' : 'Next'}
              onPress={goToNext}
              loading={isFinishing}
              style={styles.primaryAction}
              accessibilityLabel={isLastStep ? 'Get started' : 'Next onboarding step'}
              accessibilityHint={
                isLastStep
                  ? 'Completes onboarding and opens the dashboard.'
                  : 'Moves to the next onboarding step.'
              }
            />

            {currentIndex > 0 ? (
              <VelvetSecondaryButton
                label="Back"
                onPress={goBack}
                disabled={isFinishing}
                style={styles.secondaryAction}
                accessibilityLabel="Previous onboarding step"
                accessibilityHint="Returns to the previous onboarding step."
              />
            ) : null}

            {!isLastStep ? (
              <TouchableOpacity
                onPress={skipOnboarding}
                disabled={isFinishing}
                style={isFinishing && styles.disabledAction}
                accessibilityRole="button"
                accessibilityLabel="Skip onboarding for now"
                accessibilityHint="Completes onboarding immediately and opens the dashboard."
                accessibilityState={{ disabled: isFinishing }}
              >
                <Text style={styles.tertiaryActionText}>Skip for now</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </VelvetScreen>
  );
};

export default OnboardingScreen;
