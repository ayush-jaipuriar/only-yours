import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useGame } from '../state/GameContext';
import useTheme from '../theme/useTheme';
import {
  accessibilityAlertProps,
  accessibilityStatusProps,
  announceForAccessibility,
  decorativeAccessibilityProps,
} from '../accessibility';

const GUESS_RESULT_DISPLAY_MS = 2500;

// eslint-disable-next-line react/prop-types
const GameScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const {
    activeSession,
    currentQuestion,
    myAnswer,
    waitingForPartner,
    startGame,
    submitAnswer,
    submitGuess,
    gameStatus,
    round,
    guessResult,
    scores,
    correctCount,
    isTransitioning,
    isInvitationPending,
    acceptPendingInvitation,
    refreshCurrentQuestion,
    clearGuessResult,
  } = useGame();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showingResult, setShowingResult] = useState(false);
  const { width, height } = useWindowDimensions();
  const routeSessionId = route?.params?.sessionId;

  useEffect(() => {
    if (!routeSessionId) {
      return;
    }
    if (activeSession !== routeSessionId) {
      startGame(routeSessionId);
    }
  }, [routeSessionId, activeSession, startGame]);

  useEffect(() => {
    if (gameStatus === 'completed' && scores) {
      navigation.replace('Results', { scores });
    }
  }, [gameStatus, scores, navigation]);

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setShowingResult(false);
    }
  }, [currentQuestion?.questionId]);

  useEffect(() => {
    if (guessResult && round === 'round2') {
      setShowingResult(true);
      const timer = setTimeout(() => {
        setShowingResult(false);
        clearGuessResult();
      }, GUESS_RESULT_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [guessResult, round, clearGuessResult]);

  useEffect(() => {
    if (isInvitationPending || gameStatus === 'invited') {
      announceForAccessibility('Invitation pending. Accept the invitation or refresh the session.');
    }
  }, [gameStatus, isInvitationPending]);

  useEffect(() => {
    if (isTransitioning) {
      announceForAccessibility('Round 1 complete. Round 2 has started. Guess how your partner answered.');
    }
  }, [isTransitioning]);

  useEffect(() => {
    if (guessResult && round === 'round2') {
      announceForAccessibility(
        guessResult.correct
          ? `Correct guess. ${guessResult.correctCount} correct so far.`
          : `Incorrect guess. Your partner chose ${guessResult.partnerAnswer}. ${guessResult.correctCount} correct so far.`
      );
    }
  }, [guessResult, round]);

  const handleOptionSelect = useCallback((option) => {
    if (waitingForPartner || myAnswer) return;
    setSelectedOption(option);
  }, [waitingForPartner, myAnswer]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption) return;
    if (round === 'round2') {
      submitGuess(selectedOption);
    } else {
      submitAnswer(selectedOption);
    }
  }, [selectedOption, round, submitAnswer, submitGuess]);

  const handleAcceptPendingInvitation = useCallback(() => {
    const accepted = acceptPendingInvitation();
    if (!accepted) {
      return;
    }
    if (activeSession) {
      startGame(activeSession);
    }
  }, [acceptPendingInvitation, activeSession, startGame]);

  const isRound2 = round === 'round2';
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          backgroundColor: theme.colors.background,
        },
        loadingText: {
          color: theme.colors.textSecondary,
        },
        pendingTitle: {
          color: theme.colors.textPrimary,
        },
        pendingText: {
          color: theme.colors.textSecondary,
        },
        pendingButtonText: {
          color: theme.colors.primaryContrast,
        },
        pendingButtonSecondaryText: {
          color: theme.colors.textPrimary,
        },
        roundBadge: {
          backgroundColor: isRound2 ? theme.colors.badgeSurfaceMint : theme.colors.surfaceEmphasis,
          borderColor: isRound2 ? theme.colors.accent : theme.colors.borderAccent,
        },
        roundBadgeText: {
          color: isRound2 ? theme.colors.accentContrast : theme.colors.primary,
        },
        runningScore: {
          color: theme.colors.accentContrast,
        },
        progressBar: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        guessPrompt: {
          backgroundColor: theme.colors.surfaceElevated,
          borderLeftColor: theme.colors.accent,
          borderColor: theme.colors.border,
        },
        guessPromptText: {
          color: theme.colors.textOnEmphasis,
        },
        customBadge: {
          alignSelf: 'center',
          marginBottom: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.badgeSurfaceMint,
          borderWidth: 1,
          borderColor: theme.colors.accent,
        },
        customBadgeText: {
          color: theme.colors.accentContrast,
          fontSize: 12,
          fontWeight: '700',
        },
        questionContainer: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.overlayScrim,
        },
        questionText: {
          color: theme.colors.textPrimary,
        },
        optionCard: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.overlayScrim,
        },
        selectedOption: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.surfaceEmphasis,
        },
        selectedOptionR2: {
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.badgeSurfaceMint,
        },
        submittedOption: {
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.badgeSurfaceMint,
        },
        optionLetterRound1: {
          backgroundColor: theme.colors.primary,
        },
        optionLetterRound2: {
          backgroundColor: theme.colors.accent,
        },
        optionLetterText: {
          color: isRound2 ? theme.colors.accentContrast : theme.colors.primaryContrast,
        },
        optionText: {
          color: theme.colors.textPrimary,
        },
        submitButtonDisabled: {
          backgroundColor: theme.colors.border,
        },
        submitButtonText: {
          color: isRound2 ? theme.colors.accentContrast : theme.colors.primaryContrast,
        },
        waitingText: {
          color: theme.colors.textSecondary,
        },
        transitionContainer: {
          backgroundColor: theme.colors.celebrationSurface,
        },
        transitionTitle: {
          color: theme.colors.textPrimary,
        },
        transitionSubtitle: {
          color: theme.colors.textSecondary,
        },
        resultOverlay: {
          backgroundColor: theme.colors.overlayScrim,
        },
        resultCard: {
          backgroundColor: theme.colors.surfaceOverlay,
          shadowColor: theme.colors.overlayScrim,
        },
        resultCorrect: {
          borderColor: theme.colors.success,
        },
        resultWrong: {
          borderColor: theme.colors.danger,
        },
        resultTitle: {
          color: theme.colors.textPrimary,
        },
        resultDetail: {
          color: theme.colors.textSecondary,
        },
        resultBold: {
          color: theme.colors.textPrimary,
        },
        resultQuestion: {
          color: theme.colors.textTertiary,
        },
        resultScore: {
          color: theme.colors.accent,
        },
      }),
    [isRound2, theme]
  );

  const renderOption = (letter, text) => {
    const isSelected = selectedOption === letter;
    const isMyAnswer = myAnswer === letter;
    const isDisabled = waitingForPartner || myAnswer;

    const optionLetterBg = round === 'round2'
      ? styles.optionLetterRound2
      : styles.optionLetterRound1;

    return (
      <TouchableOpacity
        key={letter}
        style={[
          styles.optionCard,
          dynamicStyles.optionCard,
          isSelected && (round === 'round2' ? styles.selectedOptionR2 : styles.selectedOption),
          isSelected && (round === 'round2' ? dynamicStyles.selectedOptionR2 : dynamicStyles.selectedOption),
          isMyAnswer && styles.submittedOption,
          isMyAnswer && dynamicStyles.submittedOption,
          isDisabled && styles.disabledOption,
        ]}
        onPress={() => handleOptionSelect(letter)}
        disabled={isDisabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Option ${letter}. ${text}`}
        accessibilityHint={isRound2 ? 'Select this answer as your guess.' : 'Select this as your answer.'}
        accessibilityState={{ selected: isSelected || isMyAnswer, disabled: isDisabled }}>
        <View
          style={[
            styles.optionLetter,
            optionLetterBg,
            round === 'round2' ? dynamicStyles.optionLetterRound2 : dynamicStyles.optionLetterRound1,
          ]}
          {...decorativeAccessibilityProps}
        >
          <Text style={[styles.optionLetterText, dynamicStyles.optionLetterText]}>{letter}</Text>
        </View>
        <Text style={[styles.optionText, dynamicStyles.optionText]}>{text}</Text>
      </TouchableOpacity>
    );
  };

  if (isTransitioning) {
    return (
      <View style={[styles.transitionContainer, dynamicStyles.transitionContainer]}>
        <Text style={styles.transitionEmoji} {...decorativeAccessibilityProps}>🎯</Text>
        <Text style={[styles.transitionTitle, dynamicStyles.transitionTitle]}>Round 1 Complete!</Text>
        <Text style={[styles.transitionSubtitle, dynamicStyles.transitionSubtitle]} {...accessibilityStatusProps}>
          Now guess how your partner answered...
        </Text>
        <ActivityIndicator
          size="large"
          color={theme.colors.accent}
          style={styles.transitionSpinner}
        />
      </View>
    );
  }

  if (showingResult && guessResult && round === 'round2') {
    return (
      <View style={[styles.resultOverlay, dynamicStyles.resultOverlay]}>
        <View
          style={[
            styles.resultCard,
            dynamicStyles.resultCard,
            guessResult.correct ? styles.resultCorrect : styles.resultWrong,
            guessResult.correct ? dynamicStyles.resultCorrect : dynamicStyles.resultWrong,
          ]}>
          <Text style={styles.resultEmoji} {...decorativeAccessibilityProps}>
            {guessResult.correct ? '✅' : '❌'}
          </Text>
          <Text style={[styles.resultTitle, dynamicStyles.resultTitle]}>
            {guessResult.correct ? 'Correct!' : 'Not quite!'}
          </Text>
          <Text style={[styles.resultDetail, dynamicStyles.resultDetail]} {...accessibilityAlertProps}>
            Your partner chose{' '}
            <Text style={[styles.resultBold, dynamicStyles.resultBold]}>{guessResult.partnerAnswer}</Text>
          </Text>
          {guessResult.questionText && (
            <Text style={[styles.resultQuestion, dynamicStyles.resultQuestion]} numberOfLines={2}>
              "{guessResult.questionText}"
            </Text>
          )}
          <Text style={[styles.resultScore, dynamicStyles.resultScore]}>
            {guessResult.correctCount} correct so far
          </Text>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    if (isInvitationPending || gameStatus === 'invited') {
      return (
        <View style={[styles.centered, dynamicStyles.centered]}>
          <Text style={[styles.pendingTitle, dynamicStyles.pendingTitle]}>
            Invitation pending
          </Text>
          <Text style={[styles.pendingText, dynamicStyles.pendingText]}>
            This session is still in invite state. Accept the invite to start Round 1, or wait for your partner to accept.
          </Text>
          <TouchableOpacity
            style={[styles.pendingButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAcceptPendingInvitation}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Accept invitation"
            accessibilityHint="Accepts the current invitation and starts round 1."
          >
            <Text style={[styles.pendingButtonText, dynamicStyles.pendingButtonText]}>Accept Invitation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pendingButtonSecondary, { borderColor: theme.colors.border }]}
            onPress={refreshCurrentQuestion}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Refresh session"
            accessibilityHint="Checks again for the latest invitation state."
          >
            <Text style={[styles.pendingButtonSecondaryText, dynamicStyles.pendingButtonSecondaryText]}>
              Refresh Session
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[styles.centered, dynamicStyles.centered]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading question..."
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading question...</Text>
      </View>
    );
  }

  const primaryColor = isRound2 ? theme.colors.accent : theme.colors.primary;
  const progressPercent =
    (currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100;
  const isCompactLandscape = width > height && height < 520;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isCompactLandscape && styles.containerCompact,
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Round Badge */}
          <View
            style={[
              styles.roundBadge,
              dynamicStyles.roundBadge,
              isRound2 && styles.roundBadgeR2,
            ]}
            accessible
            accessibilityLabel={isRound2 ? `Round 2. ${correctCount} correct so far.` : 'Round 1. Answer the question.'}
          >
            <Text
              style={[
                styles.roundBadgeText,
                dynamicStyles.roundBadgeText,
                isRound2 && styles.roundBadgeTextR2,
              ]}
            >
              {isRound2 ? 'Round 2: Guess' : 'Round 1: Answer'}
            </Text>
            {isRound2 && (
              <Text style={[styles.runningScore, dynamicStyles.runningScore]}>
                {correctCount}/{currentQuestion.questionNumber - 1} correct
              </Text>
            )}
          </View>

          {/* Progress */}
          <View style={styles.header}>
            <Text style={[styles.questionNumber, { color: primaryColor }]}>
              Question {currentQuestion.questionNumber} of{' '}
              {currentQuestion.totalQuestions}
            </Text>
            <View
              style={[styles.progressBar, dynamicStyles.progressBar]}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Question progress"
              accessibilityValue={{ min: 1, now: currentQuestion.questionNumber, max: currentQuestion.totalQuestions }}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: primaryColor },
                ]}
                {...decorativeAccessibilityProps}
              />
            </View>
          </View>

          {/* Round 2 Prompt */}
          {isRound2 && (
            <View style={[styles.guessPrompt, dynamicStyles.guessPrompt]}>
              <Text style={[styles.guessPromptText, dynamicStyles.guessPromptText]}>
                How did your partner answer this?
              </Text>
            </View>
          )}

          {/* Question */}
          <View style={[styles.questionContainer, dynamicStyles.questionContainer]}>
            {currentQuestion.customQuestion ? (
              <View
                style={dynamicStyles.customBadge}
                accessible
                accessibilityLabel="Custom couple question"
              >
                <Text style={dynamicStyles.customBadgeText}>Custom Couple Question</Text>
              </View>
            ) : null}
            <Text style={[styles.questionText, dynamicStyles.questionText]}>
              {currentQuestion.questionText}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {renderOption('A', currentQuestion.optionA)}
            {renderOption('B', currentQuestion.optionB)}
            {renderOption('C', currentQuestion.optionC)}
            {renderOption('D', currentQuestion.optionD)}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {waitingForPartner ? (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color={primaryColor} />
                <Text style={[styles.waitingText, { color: theme.colors.textSecondary }]} {...accessibilityStatusProps}>
                  Waiting for partner...
                </Text>
              </View>
            ) : myAnswer ? (
              <Text style={[styles.waitingText, { color: theme.colors.textSecondary }]} {...accessibilityStatusProps}>
                {isRound2 ? 'Guess submitted!' : 'Answer submitted!'}
              </Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: primaryColor },
                  !selectedOption && [styles.submitButtonDisabled, dynamicStyles.submitButtonDisabled],
                ]}
                onPress={handleSubmit}
                disabled={!selectedOption}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isRound2 ? 'Submit guess' : 'Submit answer'}
                accessibilityHint={isRound2 ? 'Submits your selected guess.' : 'Submits your selected answer.'}
                accessibilityState={{ disabled: !selectedOption }}>
                <Text style={[styles.submitButtonText, dynamicStyles.submitButtonText]}>
                  {isRound2 ? 'Submit Guess' : 'Submit Answer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  containerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  pendingButton: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginBottom: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  pendingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pendingButtonSecondary: {
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 22,
    minWidth: 220,
    alignItems: 'center',
    borderWidth: 1,
  },
  pendingButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Round badge
  roundBadge: {
    alignSelf: 'center',
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundBadgeR2: {
    backgroundColor: '#e0f7fa',
  },
  roundBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6200ea',
  },
  roundBadgeTextR2: {
    color: '#00796b',
  },
  runningScore: {
    fontSize: 13,
    color: '#00796b',
    marginLeft: 10,
    fontWeight: '600',
  },

  // Header
  header: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Guess prompt
  guessPrompt: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#03dac6',
  },
  guessPromptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00796b',
    textAlign: 'center',
  },

  // Question
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
  },

  // Options
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedOption: {
    borderColor: '#6200ea',
    backgroundColor: '#f3e5f5',
  },
  selectedOptionR2: {
    borderColor: '#03dac6',
    backgroundColor: '#e0f7fa',
  },
  submittedOption: {
    borderColor: '#03dac6',
    backgroundColor: '#e0f7fa',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionLetterRound1: {
    backgroundColor: '#6200ea',
  },
  optionLetterRound2: {
    backgroundColor: '#03dac6',
  },
  optionLetterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },

  // Footer
  footer: {
    paddingTop: 16,
    paddingBottom: 10,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#b0b0b0',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  waitingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    textAlign: 'center',
  },

  // Transition screen
  transitionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 40,
  },
  transitionEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  transitionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 12,
    textAlign: 'center',
  },
  transitionSubtitle: {
    fontSize: 18,
    color: '#00897b',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  transitionSpinner: {
    marginTop: 10,
  },

  // Guess result overlay
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 30,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 3,
  },
  resultCorrect: {
    borderColor: '#4caf50',
  },
  resultWrong: {
    borderColor: '#f44336',
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultDetail: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  resultQuestion: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#03dac6',
    marginTop: 12,
  },
});

export default GameScreen;
