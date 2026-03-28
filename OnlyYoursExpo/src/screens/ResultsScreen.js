import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useGame } from '../state/GameContext';
import useTheme from '../theme/useTheme';
import api from '../services/api';
import { accessibilityAlertProps, announceForAccessibility, decorativeAccessibilityProps } from '../accessibility';
import MilestoneHighlights from '../components/MilestoneHighlights';
import ProgressionCard from '../components/ProgressionCard';
import { buildMilestoneShareCard, buildResultShareCard, useShareCardComposer } from '../sharing';

// eslint-disable-next-line react/prop-types
const ResultsScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const incomingScores = route?.params?.scores || null;
  const sessionId = route?.params?.sessionId || null;
  const { endGame } = useGame();
  const [scores, setScores] = useState(incomingScores);
  const [isLoadingScores, setIsLoadingScores] = useState(!incomingScores && Boolean(sessionId));
  const [scoreLoadError, setScoreLoadError] = useState(null);
  const { isSharing, shareCard, shareHost } = useShareCardComposer();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const p1ScoreAnim = useRef(new Animated.Value(0)).current;
  const p2ScoreAnim = useRef(new Animated.Value(0)).current;

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
      if (status === 409) {
        setScoreLoadError('not-ready');
      } else {
        setScoreLoadError('unavailable');
      }
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
      try {
        setIsLoadingScores(true);
        setScoreLoadError(null);
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
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const playerOneAnimation = Animated.timing(p1ScoreAnim, {
      toValue: scores.player1Score,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    });

    const playerTwoAnimation = Animated.timing(p2ScoreAnim, {
      toValue: scores.player2Score,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    });

    entryAnimation.start();
    playerOneAnimation.start();
    playerTwoAnimation.start();

    return () => {
      entryAnimation.stop();
      playerOneAnimation.stop();
      playerTwoAnimation.stop();
    };
  }, [scores, fadeAnim, p1ScoreAnim, p2ScoreAnim, scaleAnim]);

  useEffect(() => {
    if (!scores) {
      return;
    }

    announceForAccessibility(`Game complete. ${scores.message}. Combined score ${combinedScore} out of ${maxCombined}.`);
  }, [combinedScore, maxCombined, scores]);

  const handlePlayAgain = () => {
    endGame();
    navigation.replace('CategorySelection');
  };

  const handleBackToDashboard = () => {
    endGame();
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
    shareCard(buildResultShareCard(scores));
  };

  const handleShareMilestone = () => {
    shareCard(buildMilestoneShareCard(scores?.recentMilestones?.[0]));
  };

  const combinedScore = (scores?.player1Score || 0) + (scores?.player2Score || 0);
  const maxCombined = (scores?.totalQuestions || 0) * 2;
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        scrollContainer: {
          backgroundColor: theme.colors.background,
        },
        title: {
          color: theme.colors.textPrimary,
        },
        scoreCard: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.overlayScrim,
        },
        playerName: {
          color: theme.colors.textSecondary,
        },
        scoreCircle: {
          backgroundColor: theme.colors.surfaceEmphasis,
        },
        vsText: {
          color: theme.colors.textTertiary,
        },
        messageContainer: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderColor: theme.colors.borderAccent,
          shadowColor: theme.colors.overlayScrim,
        },
        messageText: {
          color: theme.colors.textPrimary,
        },
        combinedScore: {
          color: theme.colors.textSecondary,
        },
        playAgainButton: {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.glowPrimary,
        },
        playAgainText: {
          color: theme.colors.primaryContrast,
        },
        dashboardButton: {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.primary,
        },
        dashboardText: {
          color: theme.colors.primary,
        },
        shareButton: {
          backgroundColor: theme.colors.accent,
          shadowColor: theme.colors.glowAccent,
        },
        shareButtonText: {
          color: theme.colors.primaryContrast,
        },
      }),
    [theme]
  );

  const getHeaderEmoji = () => {
    if (combinedScore >= 14) return '💕';
    if (combinedScore >= 10) return '🎉';
    if (combinedScore >= 6) return '👍';
    return '💪';
  };

  if (isLoadingScores) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading results...</Text>
      </View>
    );
  }

  if (scoreLoadError || !scores) {
    if (scoreLoadError === 'not-ready') {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>Results Aren&apos;t Ready Yet</Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]} {...accessibilityAlertProps}>
            Your session is still active, but final results have not unlocked yet. Return to the game or refresh after your partner finishes.
          </Text>
          <TouchableOpacity
            style={[styles.playAgainButton, dynamicStyles.playAgainButton, { marginTop: 12 }]}
            onPress={handleReturnToGame}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Return to game"
          >
            <Text style={[styles.playAgainText, dynamicStyles.playAgainText]}>Return to Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dashboardButton, dynamicStyles.dashboardButton, { marginTop: 12 }]}
            onPress={loadResults}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Refresh results"
          >
            <Text style={[styles.dashboardText, dynamicStyles.dashboardText]}>Refresh Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dashboardButton, dynamicStyles.dashboardButton, { marginTop: 12 }]}
            onPress={handleBackToDashboard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <Text style={[styles.dashboardText, dynamicStyles.dashboardText]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>Results Unavailable</Text>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]} {...accessibilityAlertProps}>
          This game result is no longer available.
        </Text>
        <TouchableOpacity
          style={[styles.dashboardButton, dynamicStyles.dashboardButton, { marginTop: 12 }]}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
        >
          <Text style={[styles.dashboardText, dynamicStyles.dashboardText]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollContainer, dynamicStyles.scrollContainer]}
      contentContainerStyle={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { width: '100%', maxWidth: isTablet ? 820 : 560 },
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}>
        {/* Header */}
        <Text style={styles.emoji} {...decorativeAccessibilityProps}>{getHeaderEmoji()}</Text>
        <Text style={[styles.title, dynamicStyles.title]}>Game Complete!</Text>

        {/* Score Cards */}
        <View style={styles.scoresRow}>
          <View
            style={[styles.scoreCard, dynamicStyles.scoreCard]}
            accessible
            accessibilityLabel={`${scores.player1Name} scored ${scores.player1Score} out of ${scores.totalQuestions}.`}
          >
            <Text style={[styles.playerName, dynamicStyles.playerName]} numberOfLines={1}>
              {scores.player1Name}
            </Text>
            <View style={[styles.scoreCircle, dynamicStyles.scoreCircle]}>
              <AnimatedScore
                animatedValue={p1ScoreAnim}
                total={scores.totalQuestions}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.vsContainer}>
            <Text style={[styles.vsText, dynamicStyles.vsText]}>vs</Text>
          </View>

          <View
            style={[styles.scoreCard, dynamicStyles.scoreCard]}
            accessible
            accessibilityLabel={`${scores.player2Name} scored ${scores.player2Score} out of ${scores.totalQuestions}.`}
          >
            <Text style={[styles.playerName, dynamicStyles.playerName]} numberOfLines={1}>
              {scores.player2Name}
            </Text>
            <View style={[styles.scoreCircle, dynamicStyles.scoreCircle]}>
              <AnimatedScore
                animatedValue={p2ScoreAnim}
                total={scores.totalQuestions}
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* Result Message */}
        <View style={[styles.messageContainer, dynamicStyles.messageContainer]} accessible {...accessibilityAlertProps}>
          <Text style={[styles.messageText, dynamicStyles.messageText]}>{scores.message}</Text>
          <Text style={[styles.combinedScore, dynamicStyles.combinedScore]}>
            Combined: {combinedScore}/{maxCombined}
          </Text>
        </View>

        <MilestoneHighlights milestones={scores.recentMilestones} title="Unlocked This Game" />
        <ProgressionCard snapshot={scores.coupleProgression} />

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.playAgainButton, dynamicStyles.shareButton]}
          onPress={handleShareResult}
          activeOpacity={0.8}
          disabled={isSharing}
          accessibilityRole="button"
          accessibilityLabel="Share result card"
          accessibilityHint="Generates a branded image card for this game result."
        >
          <Text style={[styles.playAgainText, dynamicStyles.shareButtonText]}>
            {isSharing ? 'Preparing Share...' : 'Share Result Card'}
          </Text>
        </TouchableOpacity>

        {scores?.recentMilestones?.length ? (
          <TouchableOpacity
            style={[styles.dashboardButton, dynamicStyles.dashboardButton]}
            onPress={handleShareMilestone}
            activeOpacity={0.8}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel="Share latest celebration"
            accessibilityHint="Generates a branded image card for the latest unlocked celebration."
          >
            <Text style={[styles.dashboardText, dynamicStyles.dashboardText]}>
              {isSharing ? 'Preparing Share...' : 'Share Latest Celebration'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.playAgainButton, dynamicStyles.playAgainButton]}
          onPress={handlePlayAgain}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Play again"
          accessibilityHint="Starts a new game from category selection.">
          <Text style={[styles.playAgainText, dynamicStyles.playAgainText]}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dashboardButton, dynamicStyles.dashboardButton]}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
          accessibilityHint="Returns to the dashboard.">
          <Text style={[styles.dashboardText, dynamicStyles.dashboardText]}>Back to Dashboard</Text>
        </TouchableOpacity>
        {shareHost}
      </Animated.View>
    </ScrollView>
  );
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
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        total: {
          fontSize: 22,
          fontWeight: '600',
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
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  return <Text style={scoreStyles.score}>{displayValue}</Text>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },

  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },

  // Scores
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
  },

  // Message
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  combinedScore: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },

  // Buttons
  playAgainButton: {
    backgroundColor: '#6200ea',
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dashboardButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6200ea',
  },
  dashboardText: {
    color: '#6200ea',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ResultsScreen;
