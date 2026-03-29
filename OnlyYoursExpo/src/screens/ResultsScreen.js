import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useGame } from '../state/GameContext';
import useTheme from '../theme/useTheme';
import api from '../services/api';
import { accessibilityAlertProps, announceForAccessibility, decorativeAccessibilityProps } from '../accessibility';
import MilestoneHighlights from '../components/MilestoneHighlights';
import ProgressionCard from '../components/ProgressionCard';
import {
  VelvetHeroCard,
  VelvetPrimaryButton,
  VelvetScreen,
  VelvetSecondaryButton,
  VelvetSectionCard,
  VelvetStatCard,
  VelvetStatusPill,
  VelvetTopBar,
} from '../components/velvet';
import { buildMilestoneShareCard, buildResultShareCard, useShareCardComposer } from '../sharing';

const RESULTS_SUBTITLE = 'Your shared reveal';

const ResultsScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const incomingScores = route?.params?.scores || null;
  const sessionId = route?.params?.sessionId || incomingScores?.sessionId || null;
  const { clearLatestCompletedSession, endGame } = useGame();
  const [scores, setScores] = useState(incomingScores);
  const [isLoadingScores, setIsLoadingScores] = useState(!incomingScores && Boolean(sessionId));
  const [scoreLoadError, setScoreLoadError] = useState(null);
  const { isSharing, shareCard, shareHost } = useShareCardComposer();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const p1ScoreAnim = useRef(new Animated.Value(0)).current;
  const p2ScoreAnim = useRef(new Animated.Value(0)).current;

  const combinedScore = (scores?.player1Score || 0) + (scores?.player2Score || 0);
  const maxCombined = (scores?.totalQuestions || 0) * 2;

  const loadResults = React.useCallback(async () => {
    if (!sessionId || incomingScores) {
      return;
    }

    setIsLoadingScores(true);
    setScoreLoadError(null);

    try {
      const response = await api.get(`/game/${sessionId}/results`);
      setScores(response.data);
      setScoreLoadError(null);
    } catch (error) {
      const status = error?.response?.status;
      setScoreLoadError(status === 409 ? 'not-ready' : 'unavailable');
    } finally {
      setIsLoadingScores(false);
    }
  }, [incomingScores, sessionId]);

  useEffect(() => {
    let isMounted = true;

    if (incomingScores || !sessionId) {
      return undefined;
    }

    (async () => {
      setIsLoadingScores(true);
      setScoreLoadError(null);

      try {
        const response = await api.get(`/game/${sessionId}/results`);
        if (!isMounted) {
          return;
        }
        setScores(response.data);
        setScoreLoadError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const status = error?.response?.status;
        setScoreLoadError(status === 409 ? 'not-ready' : 'unavailable');
      } finally {
        if (isMounted) {
          setIsLoadingScores(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [incomingScores, sessionId]);

  useEffect(() => {
    if (!scores) {
      return;
    }

    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 48,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(p1ScoreAnim, {
        toValue: scores.player1Score,
        duration: 900,
        delay: 180,
        useNativeDriver: false,
      }),
      Animated.timing(p2ScoreAnim, {
        toValue: scores.player2Score,
        duration: 900,
        delay: 180,
        useNativeDriver: false,
      }),
    ]);

    entryAnimation.start();

    return () => {
      entryAnimation.stop();
    };
  }, [fadeAnim, p1ScoreAnim, p2ScoreAnim, scaleAnim, scores]);

  useEffect(() => {
    if (!scores) {
      return;
    }

    announceForAccessibility(
      `Game complete. ${scores.message}. Combined score ${combinedScore} out of ${maxCombined}.`
    );
  }, [combinedScore, maxCombined, scores]);

  const leaveResultsContext = React.useCallback(() => {
    clearLatestCompletedSession();
    endGame();
  }, [clearLatestCompletedSession, endGame]);

  const handlePlayAgain = () => {
    leaveResultsContext();
    navigation.replace('CategorySelection');
  };

  const handleBackToDashboard = () => {
    leaveResultsContext();
    navigation.replace('Dashboard');
  };

  const handleReturnToGame = () => {
    if (!sessionId) {
      handleBackToDashboard();
      return;
    }
    navigation.replace('Game', { sessionId });
  };

  const handleShareResult = () => {
    if (!scores) {
      return;
    }
    shareCard(buildResultShareCard(scores));
  };

  const handleShareMilestone = () => {
    if (!scores?.recentMilestones?.[0]) {
      return;
    }
    shareCard(buildMilestoneShareCard(scores.recentMilestones[0]));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: isTablet ? 28 : 20,
          paddingTop: 20,
          paddingBottom: 30,
          alignItems: 'center',
        },
        contentWrap: {
          width: '100%',
          maxWidth: isTablet ? 860 : 560,
        },
        centeredWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 40 : 24,
          paddingVertical: 24,
        },
        recoveryCard: {
          width: '100%',
          maxWidth: 620,
          alignItems: 'center',
        },
        recoveryTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 34 : 30,
          lineHeight: isTablet ? 38 : 34,
          textAlign: 'center',
          marginTop: 14,
          marginBottom: 10,
        },
        recoveryBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
          marginBottom: 20,
        },
        recoveryAction: {
          width: '100%',
          marginTop: 10,
        },
        heroCard: {
          width: '100%',
          marginBottom: 14,
          overflow: 'hidden',
        },
        heroGlow: {
          position: 'absolute',
          top: -40,
          right: -20,
          width: isTablet ? 240 : 180,
          height: isTablet ? 240 : 180,
          borderRadius: 999,
          backgroundColor: theme.colors.glowPrimary,
          opacity: theme.mode === 'light' ? 0.72 : 0.48,
        },
        heroEyebrowRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        },
        heroEmoji: {
          fontSize: isTablet ? 56 : 50,
          marginBottom: 6,
          textAlign: 'center',
        },
        heroTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 42 : 36,
          lineHeight: isTablet ? 46 : 40,
          textAlign: 'center',
          marginBottom: 10,
        },
        heroBody: {
          color: theme.colors.textSecondary,
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'center',
        },
        combinedRow: {
          marginTop: 18,
          alignItems: 'center',
        },
        combinedLabel: {
          color: theme.colors.textTertiary,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
        },
        combinedValue: {
          color: theme.colors.textPrimary,
          fontSize: isTablet ? 26 : 22,
          fontWeight: '800',
        },
        scoresRow: {
          width: '100%',
          flexDirection: isTablet ? 'row' : 'column',
          justifyContent: 'space-between',
          marginBottom: 14,
        },
        scoreCard: {
          width: isTablet ? '48.5%' : '100%',
          marginBottom: isTablet ? 0 : 12,
          alignItems: 'center',
          paddingTop: 18,
          paddingBottom: 18,
        },
        playerName: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          fontWeight: '700',
          marginBottom: 12,
        },
        scoreCircle: {
          width: isTablet ? 124 : 112,
          height: isTablet ? 124 : 112,
          borderRadius: 999,
          backgroundColor: theme.colors.surfaceHero,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        },
        scoreHint: {
          color: theme.colors.textTertiary,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontWeight: '700',
        },
        actionsCard: {
          width: '100%',
          marginBottom: 14,
        },
        actionsTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 24,
          lineHeight: 28,
          marginBottom: 8,
        },
        actionsBody: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 14,
        },
        actionButton: {
          marginBottom: 10,
        },
      }),
    [isTablet, theme]
  );

  if (isLoadingScores) {
    return (
      <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
        <VelvetTopBar title="Results" subtitle={RESULTS_SUBTITLE} />
        <View style={styles.centeredWrap}>
          <VelvetHeroCard style={styles.recoveryCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.recoveryTitle}>Loading results...</Text>
            <Text style={styles.recoveryBody}>
              We&apos;re pulling the final score and milestone details for this session.
            </Text>
          </VelvetHeroCard>
        </View>
      </VelvetScreen>
    );
  }

  if (scoreLoadError || !scores) {
    const isNotReady = scoreLoadError === 'not-ready';

    return (
      <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
        <VelvetTopBar title="Results" subtitle={RESULTS_SUBTITLE} />
        <View style={styles.centeredWrap}>
          <VelvetHeroCard style={styles.recoveryCard}>
            <VelvetStatusPill
              label={isNotReady ? 'Results pending' : 'Unavailable'}
              tone={isNotReady ? 'warning' : 'neutral'}
            />
            <Text style={styles.recoveryTitle}>
              {isNotReady ? "Results Aren't Ready Yet" : 'Results Unavailable'}
            </Text>
            <Text style={styles.recoveryBody} {...accessibilityAlertProps}>
              {isNotReady
                ? 'Your session is still active, but final results have not unlocked yet. Return to the game or refresh after your partner finishes.'
                : 'This game result is no longer available.'}
            </Text>

            {isNotReady ? (
              <>
                <VelvetPrimaryButton
                  label="Return to Game"
                  onPress={handleReturnToGame}
                  style={styles.recoveryAction}
                  accessibilityLabel="Return to game"
                />
                <VelvetSecondaryButton
                  label="Refresh Results"
                  onPress={loadResults}
                  style={styles.recoveryAction}
                  accessibilityLabel="Refresh results"
                />
              </>
            ) : null}

            <VelvetSecondaryButton
              label="Back to Dashboard"
              onPress={handleBackToDashboard}
              style={styles.recoveryAction}
              accessibilityLabel="Back to dashboard"
            />
          </VelvetHeroCard>
        </View>
      </VelvetScreen>
    );
  }

  return (
    <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
      <View style={styles.root}>
        <VelvetTopBar title="Results" subtitle={RESULTS_SUBTITLE} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentWrap,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <VelvetHeroCard style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <View style={styles.heroEyebrowRow}>
                <VelvetStatusPill label="Session complete" tone="accent" />
                <VelvetStatusPill label={`${combinedScore}/${maxCombined} combined`} tone="success" />
              </View>
              <Text style={styles.heroEmoji} {...decorativeAccessibilityProps}>
                {getHeaderEmoji(combinedScore)}
              </Text>
              <Text style={styles.heroTitle}>Game Complete!</Text>
              <Text style={styles.heroBody} {...accessibilityAlertProps}>
                {scores.message}
              </Text>
              <View style={styles.combinedRow}>
                <Text style={styles.combinedLabel}>Shared Score</Text>
                <Text style={styles.combinedValue}>Combined: {combinedScore}/{maxCombined}</Text>
              </View>
            </VelvetHeroCard>

            <View style={styles.scoresRow}>
              <VelvetStatCard
                style={styles.scoreCard}
                accessible
                accessibilityLabel={`${scores.player1Name} scored ${scores.player1Score} out of ${scores.totalQuestions}.`}
              >
                <Text style={styles.playerName} numberOfLines={1}>{scores.player1Name}</Text>
                <View style={styles.scoreCircle}>
                  <AnimatedScore
                    animatedValue={p1ScoreAnim}
                    total={scores.totalQuestions}
                    theme={theme}
                  />
                </View>
                <Text style={styles.scoreHint}>Your match score</Text>
              </VelvetStatCard>

              <VelvetStatCard
                style={styles.scoreCard}
                accessible
                accessibilityLabel={`${scores.player2Name} scored ${scores.player2Score} out of ${scores.totalQuestions}.`}
              >
                <Text style={styles.playerName} numberOfLines={1}>{scores.player2Name}</Text>
                <View style={styles.scoreCircle}>
                  <AnimatedScore
                    animatedValue={p2ScoreAnim}
                    total={scores.totalQuestions}
                    theme={theme}
                  />
                </View>
                <Text style={styles.scoreHint}>Partner match score</Text>
              </VelvetStatCard>
            </View>

            <MilestoneHighlights milestones={scores.recentMilestones} title="Unlocked This Game" />
            <ProgressionCard snapshot={scores.coupleProgression} />

            <VelvetSectionCard style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Choose your next moment</Text>
              <Text style={styles.actionsBody}>
                Share the reveal, start another ritual, or head back to your relationship home with this session wrapped up.
              </Text>

              <VelvetPrimaryButton
                label={isSharing ? 'Preparing Share...' : 'Share Result Card'}
                onPress={handleShareResult}
                disabled={isSharing}
                style={styles.actionButton}
                accessibilityLabel="Share result card"
                accessibilityHint="Generates a branded image card for this game result."
              />

              {scores?.recentMilestones?.length ? (
                <VelvetSecondaryButton
                  label={isSharing ? 'Preparing Share...' : 'Share Latest Celebration'}
                  onPress={handleShareMilestone}
                  disabled={isSharing}
                  style={styles.actionButton}
                  accessibilityLabel="Share latest celebration"
                  accessibilityHint="Generates a branded image card for the latest unlocked celebration."
                />
              ) : null}

              <VelvetPrimaryButton
                label="Play Again"
                onPress={handlePlayAgain}
                style={styles.actionButton}
                accessibilityLabel="Play again"
                accessibilityHint="Starts a new game from category selection."
              />

              <VelvetSecondaryButton
                label="Back to Dashboard"
                onPress={handleBackToDashboard}
                accessibilityLabel="Back to dashboard"
                accessibilityHint="Returns to the dashboard."
              />
            </VelvetSectionCard>
            {shareHost}
          </Animated.View>
        </ScrollView>
      </View>
    </VelvetScreen>
  );
};

const getHeaderEmoji = (combinedScore) => {
  if (combinedScore >= 14) return '💕';
  if (combinedScore >= 10) return '🎉';
  if (combinedScore >= 6) return '✨';
  return '💪';
};

const AnimatedScore = ({ animatedValue, total, theme }) => {
  const scoreStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
        },
        score: {
          fontSize: 48,
          fontWeight: '800',
          color: theme.colors.primary,
        },
        total: {
          fontSize: 22,
          fontWeight: '700',
          color: theme.colors.textTertiary,
        },
      }),
    [theme]
  );

  return (
    <View style={scoreStyles.container}>
      <AnimatedText animatedValue={animatedValue} scoreStyles={scoreStyles} />
      <Text style={scoreStyles.total}>/{total}</Text>
    </View>
  );
};

const AnimatedText = ({ animatedValue, scoreStyles }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  return <Text style={scoreStyles.score}>{displayValue}</Text>;
};

export default ResultsScreen;
