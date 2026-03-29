import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { AuthContext } from '../state/AuthContext';
import { useGame } from '../state/GameContext';
import {
  accessibilityStatusProps,
  announceForAccessibility,
  decorativeAccessibilityProps,
} from '../accessibility';
import {
  VelvetHeroCard,
  VelvetOptionCard,
  VelvetPrimaryButton,
  VelvetProgressBar,
  VelvetScreen,
  VelvetSectionCard,
  VelvetSecondaryButton,
  VelvetStatusPill,
  VelvetTopBar,
} from '../components/velvet';
import useTheme from '../theme/useTheme';

const getRoundMeta = (round, currentQuestion, correctCount = 0) => {
  const questionNumber = currentQuestion?.questionNumber || 1;
  const totalQuestions = currentQuestion?.totalQuestions || 1;

  if (round === 'round2') {
    return {
      title: `Question ${questionNumber} of ${totalQuestions}`,
      subtitle: "Round 2: Guess your partner's answer",
      tone: 'accent',
      prompt: 'How did your partner answer this?',
      footerCta: 'Submit Guess',
      helper: 'Your guess locks in immediately and counts toward your final match score.',
      statLabel: `${correctCount}/${Math.max(questionNumber - 1, 0)} correct`,
    };
  }

  return {
    title: `Question ${questionNumber} of ${totalQuestions}`,
    subtitle: "Round 1: You're answering",
    tone: 'primary',
    prompt: null,
    footerCta: 'Lock Selection',
    helper: 'Your partner will guess this answer in Round 2.',
    statLabel: null,
  };
};

// eslint-disable-next-line react/prop-types
const GameScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const authContext = useContext(AuthContext) || {};
  const wsConnectionState = authContext.wsConnectionState || 'connected';
  const {
    activeSession,
    currentQuestion,
    myAnswer,
    waitingForPartner,
    roundState,
    startGame,
    submitAnswer,
    submitGuess,
    gameStatus,
    statusNotice,
    expiredMessage,
    round,
    scores,
    correctCount,
    isTransitioning,
    isInvitationPending,
    isSubmitting,
    acceptPendingInvitation,
    refreshCurrentQuestion,
    endGame,
  } = useGame();

  const [selectedOption, setSelectedOption] = useState(null);
  const { width, height } = useWindowDimensions();
  const routeSessionId = route?.params?.sessionId;
  const isCompactLandscape = width > height && height < 520;
  const isRound2 = round === 'round2';
  const isLightMode = theme.mode === 'light';

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
    }
  }, [currentQuestion?.questionId]);

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
    if (roundState?.status === 'WAITING_FOR_PARTNER') {
      announceForAccessibility(roundState.message || 'Waiting for your partner to finish the round.');
    }
  }, [roundState]);

  useEffect(() => {
    if (statusNotice?.message) {
      announceForAccessibility(statusNotice.message);
    }
  }, [statusNotice]);

  useEffect(() => {
    if (gameStatus === 'expired' && expiredMessage) {
      announceForAccessibility(expiredMessage);
    }
  }, [expiredMessage, gameStatus]);

  const handleOptionSelect = useCallback((option) => {
    if (waitingForPartner || isSubmitting || myAnswer) {
      return;
    }
    setSelectedOption(option);
  }, [isSubmitting, myAnswer, waitingForPartner]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption) {
      return;
    }
    if (round === 'round2') {
      submitGuess(selectedOption);
      return;
    }
    submitAnswer(selectedOption);
  }, [round, selectedOption, submitAnswer, submitGuess]);

  const handleAcceptPendingInvitation = useCallback(() => {
    const accepted = acceptPendingInvitation();
    if (!accepted) {
      return;
    }
    if (activeSession) {
      startGame(activeSession);
    }
  }, [acceptPendingInvitation, activeSession, startGame]);

  const handleReturnToDashboard = useCallback(() => {
    endGame();
    navigation.navigate('Dashboard');
  }, [endGame, navigation]);

  const roundMeta = getRoundMeta(round, currentQuestion, correctCount);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        topBar: {
          backgroundColor: isLightMode ? theme.colors.backgroundMuted : theme.colors.background,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: isCompactLandscape ? 14 : 20,
          paddingTop: isCompactLandscape ? 10 : 20,
          paddingBottom: 24,
          alignItems: 'center',
        },
        panelWrap: {
          width: '100%',
          maxWidth: 720,
        },
        statusBanner: {
          width: '100%',
          borderRadius: 18,
          borderWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 14,
          backgroundColor: wsConnectionState === 'connected'
            ? (isLightMode ? theme.colors.surfacePanel : theme.colors.surfaceMuted)
            : theme.colors.bannerWarning,
          borderColor: wsConnectionState === 'connected'
            ? (isLightMode ? theme.colors.borderStrong : theme.colors.border)
            : theme.colors.bannerWarningBorder,
        },
        statusBannerText: {
          color: theme.colors.textPrimary,
          fontSize: 13,
          lineHeight: 19,
          fontWeight: '600',
        },
        heroCard: {
          width: '100%',
          marginBottom: 14,
          overflow: 'hidden',
          backgroundColor: isLightMode
            ? (isRound2 ? theme.colors.surfaceElevated : theme.colors.surfaceHero)
            : undefined,
          borderColor: isLightMode
            ? (isRound2 ? theme.colors.borderStrong : theme.colors.borderAccent)
            : undefined,
          shadowColor: isRound2 ? theme.colors.glowAccent : theme.colors.glowPrimary,
        },
        heroGlow: {
          position: 'absolute',
          top: -30,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: isRound2 ? theme.colors.glowAccent : theme.colors.glowPrimary,
          opacity: isLightMode ? 0.75 : 0.5,
        },
        heroTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isCompactLandscape ? 28 : 34,
          lineHeight: isCompactLandscape ? 32 : 38,
          marginTop: 12,
          marginBottom: 12,
          textAlign: 'center',
        },
        heroPrompt: {
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isRound2 ? theme.colors.accent : theme.colors.borderAccent,
          backgroundColor: isRound2
            ? (isLightMode ? theme.colors.badgeSurfaceLavender : theme.colors.badgeSurfaceMint)
            : theme.colors.surfaceEmphasis,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 14,
        },
        heroPromptText: {
          color: isRound2 ? theme.colors.accentContrast : theme.colors.textPrimary,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '700',
        },
        questionMetaRow: {
          marginBottom: 14,
        },
        questionMetaTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        questionMetaText: {
          color: isLightMode ? theme.colors.textPrimary : theme.colors.textSecondary,
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
        helperText: {
          color: isLightMode ? theme.colors.textSecondary : theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
          textAlign: 'center',
          marginTop: 10,
        },
        customBadge: {
          alignSelf: 'center',
          marginBottom: 12,
        },
        optionsWrap: {
          width: '100%',
          marginBottom: 12,
        },
        optionCard: {
          marginBottom: 12,
          paddingVertical: isCompactLandscape ? 14 : 16,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        optionLetter: {
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
          backgroundColor: isRound2 ? theme.colors.accent : theme.colors.primary,
        },
        optionLetterMuted: {
          backgroundColor: isLightMode ? theme.colors.surfaceOverlay : theme.colors.surfaceEmphasis,
        },
        optionLetterText: {
          color: isRound2 ? theme.colors.accentContrast : theme.colors.primaryContrast,
          fontSize: 14,
          fontWeight: '800',
        },
        optionLetterTextMuted: {
          color: theme.colors.textSecondary,
        },
        optionText: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '600',
        },
        selectedMark: {
          marginLeft: 10,
          color: isRound2 ? theme.colors.accent : theme.colors.primary,
          fontSize: 16,
          fontWeight: '800',
        },
        footerCard: {
          width: '100%',
          marginTop: 2,
          backgroundColor: isLightMode ? theme.colors.surfaceElevated : undefined,
          borderColor: isLightMode ? theme.colors.borderStrong : undefined,
        },
        footerStatus: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        },
        footerStatusText: {
          marginLeft: 10,
          color: theme.colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
        footerSubmitted: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 12,
        },
        transitionWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        },
        transitionCard: {
          width: '100%',
          maxWidth: 520,
          alignItems: 'center',
          paddingTop: 30,
          paddingBottom: 26,
        },
        transitionEmoji: {
          fontSize: 42,
          marginBottom: 16,
        },
        transitionTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 34,
          lineHeight: 38,
          textAlign: 'center',
          marginBottom: 10,
        },
        transitionSubtitle: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
          marginBottom: 18,
        },
        centeredWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        },
        pendingCard: {
          width: '100%',
          maxWidth: 540,
        },
        pendingTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 30,
          lineHeight: 34,
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 10,
        },
        pendingBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
        pendingActions: {
          marginTop: 18,
        },
        actionGap: {
          marginBottom: 10,
        },
        waitingScrollContent: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 24,
          alignItems: 'center',
        },
        waitingWrap: {
          width: '100%',
          maxWidth: 720,
        },
        waitingHero: {
          width: '100%',
          marginBottom: 14,
        },
        waitingTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 30,
          lineHeight: 34,
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 10,
        },
        waitingBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
        waitingStat: {
          color: theme.colors.primary,
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 12,
        },
        reviewSection: {
          width: '100%',
          marginBottom: 14,
        },
        reviewSectionTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 24,
          lineHeight: 28,
          marginBottom: 10,
        },
        reviewCard: {
          marginBottom: 12,
        },
        reviewQuestionNumber: {
          color: theme.colors.primary,
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        reviewQuestionText: {
          color: theme.colors.textPrimary,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '700',
          marginBottom: 10,
        },
        reviewSubmittedValue: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
        },
        loadingTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 30,
          lineHeight: 34,
          textAlign: 'center',
          marginTop: 18,
          marginBottom: 10,
        },
        loadingText: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
      }),
    [isCompactLandscape, isLightMode, isRound2, theme, wsConnectionState]
  );

  const renderConnectionBanner = () => {
    if (wsConnectionState === 'connected') {
      return null;
    }

    return (
      <View style={styles.statusBanner}>
        <Text style={styles.statusBannerText} {...accessibilityStatusProps}>
          {wsConnectionState === 'connecting'
            ? 'Reconnecting to your session... We will refresh the latest game state as soon as realtime is ready.'
            : 'Realtime connection is unavailable right now. You can still refresh, and the session will recover when connection returns.'}
        </Text>
      </View>
    );
  };

  const renderStatusNoticeBanner = () => {
    if (!statusNotice) {
      return null;
    }

    const isPartnerLeft = statusNotice.type === 'partner-left';

    return (
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isPartnerLeft ? theme.colors.bannerWarning : theme.colors.surfaceEmphasis,
            borderColor: isPartnerLeft ? theme.colors.bannerWarningBorder : theme.colors.borderAccent,
          },
        ]}
      >
        <Text style={styles.statusBannerText} {...accessibilityStatusProps}>
          {statusNotice.message}
        </Text>
      </View>
    );
  };

  const renderOption = (letter, text) => {
    const isSelected = selectedOption === letter;
    const isMyAnswer = myAnswer === letter;
    const isDisabled = waitingForPartner || isSubmitting || Boolean(myAnswer);
    const tone = isRound2 ? 'accent' : 'primary';

    return (
      <VelvetOptionCard
        key={letter}
        style={styles.optionCard}
        onPress={() => handleOptionSelect(letter)}
        selected={isSelected}
        submitted={isMyAnswer}
        disabled={isDisabled}
        tone={tone}
        accessibilityRole="button"
        accessibilityLabel={`Option ${letter}. ${text}`}
        accessibilityHint={isRound2 ? 'Select this answer as your guess.' : 'Select this as your answer.'}
        accessibilityState={{ selected: isSelected || isMyAnswer, disabled: isDisabled }}
      >
        <View style={styles.optionRow}>
          <View
            style={[
              styles.optionLetter,
              !(isSelected || isMyAnswer) && styles.optionLetterMuted,
            ]}
            {...decorativeAccessibilityProps}
          >
            <Text
              style={[
                styles.optionLetterText,
                !(isSelected || isMyAnswer) && styles.optionLetterTextMuted,
              ]}
            >
              {letter}
            </Text>
          </View>
          <Text style={styles.optionText}>{text}</Text>
          {isSelected || isMyAnswer ? (
            <Text style={styles.selectedMark} {...decorativeAccessibilityProps}>
              ✓
            </Text>
          ) : null}
        </View>
      </VelvetOptionCard>
    );
  };

  const renderTransitionState = () => (
    <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
      <VelvetTopBar title="Round 2 Unlocked" subtitle="Transitioning into guesses" />
      <View style={styles.transitionWrap}>
        <VelvetHeroCard style={styles.transitionCard}>
          <Text style={styles.transitionEmoji} {...decorativeAccessibilityProps}>🎯</Text>
          <Text style={styles.transitionTitle}>Round 1 complete.</Text>
          <Text style={styles.transitionSubtitle} {...accessibilityStatusProps}>
            Now guess how your partner answered. The tone changes here on purpose: this round should feel more suspenseful and more revealing.
          </Text>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </VelvetHeroCard>
      </View>
    </VelvetScreen>
  );

  const renderInvitationPendingState = () => (
    <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
      <VelvetTopBar title="Invitation Pending" subtitle="Session invite still active" />
      <View style={styles.centeredWrap}>
        <VelvetHeroCard style={styles.pendingCard}>
          {renderStatusNoticeBanner()}
          <VelvetStatusPill label="Invite state" tone="warning" />
          <Text style={styles.pendingTitle}>Invitation pending</Text>
          <Text style={styles.pendingBody}>
            This session is still in invite state. Accept the invitation to start Round 1, or refresh the session while you wait for the latest state.
          </Text>
          <View style={styles.pendingActions}>
            <VelvetPrimaryButton
              label="Accept Invitation"
              onPress={handleAcceptPendingInvitation}
              style={styles.actionGap}
              accessibilityLabel="Accept invitation"
              accessibilityHint="Accepts the current invitation and starts round 1."
            />
            <VelvetSecondaryButton
              label="Refresh Session"
              onPress={refreshCurrentQuestion}
              style={styles.actionGap}
              accessibilityLabel="Refresh session"
              accessibilityHint="Checks again for the latest invitation state."
            />
            <VelvetSecondaryButton
              label="Back to Dashboard"
              onPress={() => navigation.navigate('Dashboard')}
            />
          </View>
        </VelvetHeroCard>
      </View>
    </VelvetScreen>
  );

  const renderWaitingState = () => {
    const isRound2Waiting = roundState?.round === 'ROUND2';
    const submittedLabel = isRound2Waiting ? 'guesses' : 'answers';

    return (
      <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
        <VelvetTopBar
          title={isRound2Waiting ? 'Round 2 Complete' : 'Round 1 Complete'}
          subtitle="Waiting for your partner"
        />
        <ScrollView contentContainerStyle={styles.waitingScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.waitingWrap}>
            {renderConnectionBanner()}
            {renderStatusNoticeBanner()}
            <VelvetHeroCard style={styles.waitingHero}>
              <VelvetStatusPill
                label={isRound2Waiting ? 'Your guesses are locked' : 'Your answers are locked'}
                tone={isRound2Waiting ? 'accent' : 'primary'}
              />
              <Text style={styles.waitingTitle}>Waiting for your partner</Text>
              <Text style={styles.waitingBody} {...accessibilityStatusProps}>
                {roundState?.message}
              </Text>
              <Text style={styles.waitingStat}>
                {roundState?.completedCount}/{roundState?.totalQuestions} {submittedLabel} locked in
              </Text>
              <View style={styles.pendingActions}>
                <VelvetSecondaryButton
                  label="Refresh Status"
                  onPress={refreshCurrentQuestion}
                  style={styles.actionGap}
                  accessibilityLabel="Refresh game status"
                  accessibilityHint="Checks whether your partner finished the round."
                />
                <VelvetSecondaryButton
                  label="Back to Dashboard"
                  onPress={() => navigation.navigate('Dashboard')}
                />
              </View>
            </VelvetHeroCard>

            <VelvetSectionCard style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Your submitted {submittedLabel}</Text>
              {roundState?.reviewItems?.map((item) => (
                <VelvetSectionCard
                  key={`${roundState?.round}-${item.questionId}`}
                  style={styles.reviewCard}
                >
                  <Text style={styles.reviewQuestionNumber}>Question {item.questionNumber}</Text>
                  <Text style={styles.reviewQuestionText}>{item.questionText}</Text>
                  <Text style={styles.reviewSubmittedValue}>
                    Your {isRound2Waiting ? 'guess' : 'answer'}: {item.submittedValue}
                  </Text>
                </VelvetSectionCard>
              ))}
            </VelvetSectionCard>
          </View>
        </ScrollView>
      </VelvetScreen>
    );
  };

  const renderLoadingState = () => (
    <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
      <VelvetTopBar title="Preparing Session" subtitle="Syncing the latest question" />
      <View style={styles.centeredWrap}>
        <VelvetHeroCard style={styles.pendingCard}>
          {renderStatusNoticeBanner()}
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading question..."
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Loading question...</Text>
          <Text style={styles.loadingText}>
            We&apos;re syncing the latest session state so both partners stay aligned.
          </Text>
          {renderConnectionBanner()}
        </VelvetHeroCard>
      </View>
    </VelvetScreen>
  );

  const renderExpiredState = () => (
    <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
      <VelvetTopBar title="Session Expired" subtitle="This game can no longer continue" />
      <View style={styles.centeredWrap}>
        <VelvetHeroCard style={styles.pendingCard}>
          <VelvetStatusPill label="Expired session" tone="warning" />
          <Text style={styles.pendingTitle}>This session has expired</Text>
          <Text style={styles.pendingBody} {...accessibilityStatusProps}>
            {expiredMessage || 'This game session is no longer active. Head back to the dashboard to start again.'}
          </Text>
          <View style={styles.pendingActions}>
            <VelvetPrimaryButton
              label="Back to Dashboard"
              onPress={handleReturnToDashboard}
              style={styles.actionGap}
              accessibilityLabel="Back to dashboard"
              accessibilityHint="Leaves this expired session and returns to the dashboard."
            />
          </View>
        </VelvetHeroCard>
      </View>
    </VelvetScreen>
  );

  const renderQuestionState = () => {
    const progress = currentQuestion?.totalQuestions
      ? currentQuestion.questionNumber / currentQuestion.totalQuestions
      : 0;
    const primaryTone = isRound2 ? 'accent' : 'primary';

    return (
      <VelvetScreen withAtmosphere atmosphere="focused" safeAreaEdges={['left', 'right']}>
        <View style={styles.root}>
          <VelvetTopBar
            style={styles.topBar}
            title={roundMeta.title}
            subtitle={roundMeta.subtitle}
            rightContent={
              roundMeta.statLabel ? (
                <VelvetStatusPill label={roundMeta.statLabel} tone={primaryTone} />
              ) : null
            }
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.panelWrap}>
              {renderConnectionBanner()}
              {renderStatusNoticeBanner()}

              <VelvetHeroCard style={styles.heroCard}>
                <View style={styles.heroGlow} />
                <VelvetStatusPill
                  label={isRound2 ? 'Guessing mode' : 'Answering mode'}
                  tone={primaryTone}
                />
                <Text style={styles.heroTitle}>{currentQuestion.questionText}</Text>

                {roundMeta.prompt ? (
                  <View style={styles.heroPrompt}>
                    <Text style={styles.heroPromptText}>{roundMeta.prompt}</Text>
                  </View>
                ) : null}

                <View style={styles.questionMetaRow}>
                  <View style={styles.questionMetaTop}>
                    <Text style={styles.questionMetaText}>
                      Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
                    </Text>
                    {currentQuestion.customQuestion ? (
                      <View style={styles.customBadge}>
                        <VelvetStatusPill label="Custom Couple Question" tone="success" />
                      </View>
                    ) : null}
                  </View>
                  <VelvetProgressBar
                    progress={progress}
                    accessibilityRole="progressbar"
                    accessibilityLabel="Question progress"
                    accessibilityValue={{ min: 1, now: currentQuestion.questionNumber, max: currentQuestion.totalQuestions }}
                  />
                  <Text style={styles.helperText}>{roundMeta.helper}</Text>
                </View>
              </VelvetHeroCard>

              <View style={styles.optionsWrap}>
                {renderOption('A', currentQuestion.optionA)}
                {renderOption('B', currentQuestion.optionB)}
                {renderOption('C', currentQuestion.optionC)}
                {renderOption('D', currentQuestion.optionD)}
              </View>

              <VelvetSectionCard style={styles.footerCard}>
                {isSubmitting ? (
                  <View style={styles.footerStatus}>
                    <ActivityIndicator size="small" color={isRound2 ? theme.colors.accent : theme.colors.primary} />
                    <Text style={styles.footerStatusText} {...accessibilityStatusProps}>
                      {isRound2 ? 'Submitting guess...' : 'Submitting answer...'}
                    </Text>
                  </View>
                ) : myAnswer ? (
                  <>
                    <Text style={styles.footerSubmitted} {...accessibilityStatusProps}>
                      {isRound2 ? 'Guess submitted!' : 'Answer submitted!'}
                    </Text>
                    <VelvetSecondaryButton
                      label="Waiting for the next state"
                      onPress={() => null}
                      disabled
                    />
                  </>
                ) : (
                  <VelvetPrimaryButton
                    label={roundMeta.footerCta}
                    onPress={handleSubmit}
                    disabled={!selectedOption}
                    accessibilityLabel={isRound2 ? 'Submit guess' : 'Submit answer'}
                    accessibilityHint={isRound2 ? 'Submits your selected guess.' : 'Submits your selected answer.'}
                  />
                )}
              </VelvetSectionCard>
            </View>
          </ScrollView>
        </View>
      </VelvetScreen>
    );
  };

  if (isTransitioning) {
    return renderTransitionState();
  }

  if (gameStatus === 'expired') {
    return renderExpiredState();
  }

  if (!currentQuestion) {
    if (isInvitationPending || gameStatus === 'invited') {
      return renderInvitationPendingState();
    }

    if (roundState?.status === 'WAITING_FOR_PARTNER') {
      return renderWaitingState();
    }

    return renderLoadingState();
  }

  return renderQuestionState();
};

export default GameScreen;
