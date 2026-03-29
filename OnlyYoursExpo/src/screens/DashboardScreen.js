import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import BadgeChip from '../components/BadgeChip';
import MilestoneHighlights from '../components/MilestoneHighlights';
import ProgressionCard from '../components/ProgressionCard';
import {
  VelvetBrowseLayout,
  VelvetHeroCard,
  VelvetPrimaryButton,
  VelvetProgressBar,
  VelvetScreen,
  VelvetSectionCard,
  VelvetSecondaryButton,
  VelvetStatCard,
  VelvetStatusPill,
} from '../components/velvet';
import useDashboardGameFlow from './useDashboardGameFlow';
import useTheme from '../theme/useTheme';
import {
  buildMilestoneShareCard,
  buildProgressionShareCard,
  useShareCardComposer,
} from '../sharing';

const formatResponseTime = (seconds) => {
  if (!seconds) {
    return '0s';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
};

const getHeroState = ({ couple, shouldShowContinueGame, latestCompletedSession }) => {
  if (!couple) {
    return 'not_linked';
  }

  if (shouldShowContinueGame) {
    return 'active_game';
  }

  if (latestCompletedSession?.sessionId) {
    return 'results_ready';
  }

  return 'ready_to_start';
};

// eslint-disable-next-line react/prop-types
const DashboardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isSharing, shareCard, shareHost } = useShareCardComposer();
  const {
    user,
    couple,
    activeGame,
    stats,
    progression,
    badges,
    loading,
    latestCompletedSession,
    shouldShowContinueGame,
    handleStartGame,
    handleContinueGame,
    getPartnerName,
  } = useDashboardGameFlow(navigation);

  const heroState = getHeroState({ couple, shouldShowContinueGame, latestCompletedSession });
  const partnerName = getPartnerName();
  const latestMilestone = progression?.recentMilestones?.[0] || null;
  const activeProgress = activeGame?.totalQuestions
    ? (activeGame.currentQuestionNumber || 1) / activeGame.totalQuestions
    : 0;

  const metricCards = [
    { label: 'Games Played', value: stats?.gamesPlayed ?? 0 },
    { label: 'Average Score', value: stats?.averageScore ?? 0 },
    { label: 'Best Score', value: stats?.bestScore ?? 0 },
    { label: 'Streak Days', value: stats?.streakDays ?? 0 },
    { label: 'Acceptance', value: `${stats?.invitationAcceptanceRate ?? 0}%` },
    { label: 'Avg Accept Time', value: formatResponseTime(stats?.avgInvitationResponseSeconds ?? 0) },
  ];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 24,
        },
        loadingCard: {
          width: '100%',
          maxWidth: 420,
          alignItems: 'center',
        },
        loadingText: {
          marginTop: 14,
          fontSize: 15,
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
        container: {
          paddingHorizontal: isTablet ? 8 : 0,
          paddingBottom: 30,
        },
        introSection: {
          width: '100%',
          marginBottom: 18,
        },
        eyebrow: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: theme.colors.textTertiary,
          marginBottom: 8,
        },
        title: {
          fontSize: isTablet ? 40 : 34,
          lineHeight: isTablet ? 44 : 38,
          color: theme.colors.textPrimary,
          marginBottom: 8,
          fontFamily: theme.fontFamilies.heading,
        },
        titleAccent: {
          color: theme.colors.primary,
        },
        subtitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 6,
        },
        subtitleDot: {
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
          marginRight: 8,
          shadowColor: theme.colors.glowPrimary,
          shadowOpacity: 0.7,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        },
        subtitle: {
          fontSize: 14,
          lineHeight: 20,
          color: theme.colors.textSecondary,
          flexShrink: 1,
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
          opacity: 0.5,
        },
        heroTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        },
        heroHeaderCopy: {
          flex: 1,
          paddingRight: 12,
        },
        heroTitle: {
          fontSize: isTablet ? 32 : 28,
          lineHeight: isTablet ? 36 : 32,
          color: theme.colors.textPrimary,
          marginTop: 12,
          marginBottom: 8,
          fontFamily: theme.fontFamilies.heading,
        },
        heroBody: {
          fontSize: 15,
          lineHeight: 22,
          color: theme.colors.textSecondary,
        },
        heroMetaRow: {
          marginBottom: 14,
        },
        heroMetaLine: {
          fontSize: 13,
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
          marginBottom: 8,
          fontWeight: '700',
        },
        heroStatsRow: {
          flexDirection: isTablet ? 'row' : 'column',
          alignItems: isTablet ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        heroStatsText: {
          fontSize: 14,
          color: theme.colors.textPrimary,
          fontWeight: '700',
          marginBottom: isTablet ? 0 : 8,
        },
        heroHelperText: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginTop: 10,
        },
        heroActionsRow: {
          flexDirection: isTablet ? 'row' : 'column',
          marginTop: 18,
        },
        heroPrimaryButton: {
          flex: 1,
          marginRight: isTablet ? 10 : 0,
          marginBottom: isTablet ? 0 : 10,
        },
        heroSecondaryButton: {
          flex: isTablet ? 0.75 : 1,
        },
        sectionCard: {
          width: '100%',
          marginBottom: 14,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        sectionHeadingWrap: {
          flex: 1,
          paddingRight: 12,
        },
        sectionTitle: {
          fontSize: 22,
          lineHeight: 26,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          marginBottom: 4,
        },
        sectionSubtitle: {
          fontSize: 13,
          lineHeight: 19,
          color: theme.colors.textSecondary,
        },
        stackedSection: {
          marginBottom: 12,
        },
        progressionActions: {
          flexDirection: isTablet ? 'row' : 'column',
          marginTop: 4,
        },
        inlineActionButton: {
          marginRight: isTablet ? 10 : 0,
          marginBottom: isTablet ? 0 : 10,
          flex: isTablet ? 1 : 0,
        },
        bentoRow: {
          width: '100%',
          flexDirection: isTablet ? 'row' : 'column',
          justifyContent: 'space-between',
        },
        bentoPrimary: {
          width: isTablet ? '58%' : '100%',
        },
        bentoSecondary: {
          width: isTablet ? '39%' : '100%',
        },
        celebrationCard: {
          minHeight: 220,
          justifyContent: 'space-between',
        },
        celebrationIcon: {
          fontSize: 28,
          marginBottom: 12,
        },
        celebrationTitle: {
          fontSize: 22,
          lineHeight: 26,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          marginBottom: 8,
        },
        celebrationBody: {
          fontSize: 13,
          lineHeight: 20,
          color: theme.colors.textSecondary,
          marginBottom: 14,
        },
        emptyStateCard: {
          minHeight: 180,
          justifyContent: 'space-between',
        },
        emptyStateTitle: {
          fontSize: 22,
          lineHeight: 26,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          marginBottom: 8,
        },
        emptyStateBody: {
          fontSize: 14,
          lineHeight: 21,
          color: theme.colors.textSecondary,
        },
        metricsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        metricItem: {
          width: isTablet ? '31.8%' : '48.3%',
          marginBottom: 10,
        },
        metricValue: {
          fontSize: 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          marginBottom: 2,
        },
        metricLabel: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        badgeList: {
          width: '100%',
        },
        emptyBadgeText: {
          fontSize: 14,
          lineHeight: 21,
          color: theme.colors.textSecondary,
        },
      }),
    [isTablet, theme]
  );

  if (loading) {
    return (
      <VelvetScreen withAtmosphere atmosphere="browse" safeAreaEdges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <VelvetHeroCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </VelvetHeroCard>
        </View>
      </VelvetScreen>
    );
  }

  const heroTitleByState = {
    active_game: 'Continue your game',
    results_ready: 'Latest results are ready',
    ready_to_start: 'Start your next game',
    not_linked: 'Link your partner',
  };

  const heroCopyByState = {
    active_game: `Your session with ${partnerName} is ready where you left it.`,
    results_ready: `Your last session with ${partnerName} is finished and ready to open.`,
    ready_to_start: `${partnerName} is connected. Pick a category and begin.`,
    not_linked: 'Link your partner to unlock games, progress, and shared milestones.',
  };

  return (
    <VelvetBrowseLayout
      navigation={navigation}
      activeNavKey="dashboard"
      contentContainerStyle={styles.container}
      contentMaxWidth={isTablet ? 780 : 460}
    >
      <View style={styles.introSection}>
        <Text style={styles.eyebrow}>Relationship Home</Text>
        <Text style={styles.title}>
          Welcome, <Text style={styles.titleAccent}>{user?.name || 'there'}</Text>.
        </Text>
        <View style={styles.subtitleRow}>
          <View style={styles.subtitleDot} />
          <Text style={styles.subtitle}>
            {couple
              ? `Connected with ${partnerName}.`
              : 'Link your partner to unlock the rest of the app.'}
          </Text>
        </View>
      </View>

      <VelvetHeroCard style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroHeaderCopy}>
            <VelvetStatusPill
              label={
                heroState === 'active_game'
                  ? 'Active session'
                  : heroState === 'ready_to_start'
                    ? 'Ready to begin'
                    : heroState === 'results_ready'
                      ? 'Results ready'
                    : 'Link required'
              }
              tone={
                heroState === 'active_game'
                  ? 'accent'
                  : heroState === 'ready_to_start'
                    ? 'primary'
                    : heroState === 'results_ready'
                      ? 'success'
                    : 'warning'
              }
            />
            <Text style={styles.heroTitle}>{heroTitleByState[heroState]}</Text>
            <Text style={styles.heroBody}>{heroCopyByState[heroState]}</Text>
          </View>
        </View>

        {heroState === 'active_game' ? (
          <>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroMetaLine}>
                {activeGame.round || activeGame.status} • Question {activeGame.currentQuestionNumber || 1}/
                {activeGame.totalQuestions || 8}
              </Text>
              <View style={styles.heroStatsRow}>
                <Text style={styles.heroStatsText}>
                  {activeGame.status === 'ROUND2' ? 'Guessing in progress' : 'Your next question is waiting'}
                </Text>
                <VelvetStatusPill
                  label={activeGame.status === 'ROUND2' ? 'Round 2' : 'Your turn'}
                  tone={activeGame.status === 'ROUND2' ? 'success' : 'accent'}
                />
              </View>
              <VelvetProgressBar progress={activeProgress} />
              <Text style={styles.heroHelperText}>
                Results unlock after both of you finish.
              </Text>
            </View>

            <View style={styles.heroActionsRow}>
              <VelvetPrimaryButton
                label="Continue Game"
                onPress={handleContinueGame}
                style={styles.heroPrimaryButton}
                accessibilityLabel="Continue active game"
                accessibilityHint="Opens your current game session."
              />
              <VelvetSecondaryButton
                label="View History"
                onPress={() => navigation.navigate('GameHistory')}
                style={styles.heroSecondaryButton}
                accessibilityLabel="Open game history"
                accessibilityHint="Shows your previous games and filters."
              />
            </View>
          </>
        ) : null}

        {heroState === 'ready_to_start' ? (
          <View style={styles.heroActionsRow}>
            <VelvetPrimaryButton
              label="Start New Game"
              onPress={handleStartGame}
              style={styles.heroPrimaryButton}
              accessibilityLabel="Start new game"
              accessibilityHint="Opens category selection to invite your partner to a new game."
            />
            <VelvetSecondaryButton
              label="Custom Questions"
              onPress={() => navigation.navigate('CustomQuestions')}
              style={styles.heroSecondaryButton}
              accessibilityLabel="Open custom questions"
              accessibilityHint="Shows the custom questions you created for your couple deck."
            />
          </View>
        ) : null}

        {heroState === 'results_ready' ? (
          <>
            <View style={styles.heroActionsRow}>
              <VelvetPrimaryButton
                label="View Latest Results"
                onPress={() => navigation.navigate('Results', { sessionId: latestCompletedSession.sessionId })}
                style={styles.heroPrimaryButton}
                accessibilityLabel="View latest results"
                accessibilityHint="Opens the latest completed game results."
              />
              <VelvetSecondaryButton
                label="Start New Game"
                onPress={handleStartGame}
                style={styles.heroSecondaryButton}
                accessibilityLabel="Start new game"
                accessibilityHint="Begins a fresh session instead of reopening the latest result."
              />
            </View>

            <View style={styles.heroMetaRow}>
              <Text style={styles.heroMetaLine}>Latest completed session ready</Text>
              <View style={styles.heroStatsRow}>
                <Text style={styles.heroStatsText}>Your shared results are still waiting</Text>
                <VelvetStatusPill
                  label="View Results"
                  tone="success"
                />
              </View>
              <VelvetProgressBar progress={1} />
              <Text style={styles.heroHelperText}>
                Open the score and milestones before you start another round.
              </Text>
            </View>
          </>
        ) : null}

        {heroState === 'not_linked' ? (
          <View style={styles.heroActionsRow}>
            <VelvetPrimaryButton
              label="Link with Partner"
              onPress={() => navigation.navigate('PartnerLink')}
              style={styles.heroPrimaryButton}
              accessibilityLabel="Link with partner"
              accessibilityHint="Opens the partner linking screen."
            />
            <VelvetSecondaryButton
              label="See History"
              onPress={() => navigation.navigate('GameHistory')}
              style={styles.heroSecondaryButton}
              accessibilityLabel="Open game history"
              accessibilityHint="Shows your previous games and filters."
            />
          </View>
        ) : null}
      </VelvetHeroCard>

      <VelvetSectionCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingWrap}>
            <Text style={styles.sectionTitle}>Progression</Text>
            <Text style={styles.sectionSubtitle}>
              Shared and personal progress.
            </Text>
          </View>
          <VelvetStatusPill
            label={progression?.coupleProgression ? progression.coupleProgression.label : 'Getting started'}
            tone={progression?.coupleProgression ? 'primary' : 'neutral'}
          />
        </View>

        {progression?.coupleProgression || progression?.individualProgression ? (
          <>
            {progression?.coupleProgression ? (
              <View style={styles.stackedSection}>
                <ProgressionCard snapshot={progression.coupleProgression} />
              </View>
            ) : null}
            {progression?.individualProgression ? <ProgressionCard snapshot={progression.individualProgression} compact /> : null}

            {progression?.coupleProgression ? (
              <View style={styles.progressionActions}>
                <VelvetSecondaryButton
                  label={isSharing ? 'Preparing Share...' : 'Share Couple Progress'}
                  onPress={() => shareCard(buildProgressionShareCard(progression.coupleProgression))}
                  disabled={isSharing}
                  style={styles.inlineActionButton}
                  accessibilityLabel="Share couple progression"
                  accessibilityHint="Generates a branded image card for your couple progression."
                />
                <VelvetSecondaryButton
                  label="View Profile"
                  onPress={() => navigation.navigate('Profile')}
                  accessibilityLabel="Open profile"
                  accessibilityHint="Shows your profile and account details."
                />
              </View>
            ) : null}
          </>
        ) : (
          <VelvetStatCard style={styles.emptyStateCard}>
            <View>
              <Text style={styles.emptyStateTitle}>Your next level starts with one shared session.</Text>
              <Text style={styles.emptyStateBody}>
                Play a few games and your progress will show up here.
              </Text>
            </View>
            {couple ? (
              <VelvetPrimaryButton
                label="Start New Game"
                onPress={handleStartGame}
                accessibilityLabel="Start new game"
                accessibilityHint="Opens category selection to invite your partner to a new game."
              />
            ) : (
              <VelvetPrimaryButton
                label="Link with Partner"
                onPress={() => navigation.navigate('PartnerLink')}
                accessibilityLabel="Link with partner"
                accessibilityHint="Opens the partner linking screen."
              />
            )}
          </VelvetStatCard>
        )}
      </VelvetSectionCard>

      <View style={styles.bentoRow}>
        <View style={styles.bentoPrimary}>
          <MilestoneHighlights milestones={progression?.recentMilestones} title="Recent Celebrations" />
        </View>
        <View style={styles.bentoSecondary}>
          <VelvetSectionCard style={styles.celebrationCard}>
            <View>
              <Text style={styles.celebrationIcon}>{latestMilestone ? '✨' : '💞'}</Text>
              <Text style={styles.celebrationTitle}>
                {latestMilestone ? latestMilestone.title : 'Your next celebration is waiting'}
              </Text>
              <Text style={styles.celebrationBody}>
                {latestMilestone
                  ? latestMilestone.description
                  : 'Complete games together to unlock milestones.'}
              </Text>
            </View>
            {latestMilestone ? (
              <VelvetSecondaryButton
                label={isSharing ? 'Preparing Share...' : 'Share Latest Celebration'}
                onPress={() => shareCard(buildMilestoneShareCard(latestMilestone))}
                disabled={isSharing}
                accessibilityLabel="Share latest celebration"
                accessibilityHint="Generates a branded image card for the newest milestone or streak."
              />
            ) : (
              <VelvetSecondaryButton
                label={couple ? 'Start a Session' : 'Link First'}
                onPress={couple ? handleStartGame : () => navigation.navigate('PartnerLink')}
              />
            )}
          </VelvetSectionCard>
        </View>
      </View>

      <VelvetSectionCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingWrap}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <Text style={styles.sectionSubtitle}>
              A quick read on your sessions.
            </Text>
          </View>
        </View>
        <View style={styles.metricsGrid}>
          {metricCards.map((item) => (
            <VelvetStatCard
              key={item.label}
              style={styles.metricItem}
              accessible
              accessibilityLabel={`${item.label}: ${item.value}`}
            >
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </VelvetStatCard>
          ))}
        </View>
      </VelvetSectionCard>

      <VelvetSectionCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingWrap}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>
              Badges you unlock over time.
            </Text>
          </View>
          <VelvetStatusPill label={`${badges?.length || 0} unlocked`} tone={badges?.length ? 'success' : 'neutral'} />
        </View>

        {badges?.length ? (
          <View style={styles.badgeList}>
            {badges.map((badge) => (
              <BadgeChip key={badge.code} badge={badge} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyBadgeText}>
            No achievements yet. Keep playing to unlock them.
          </Text>
        )}
      </VelvetSectionCard>

      {shareHost}
    </VelvetBrowseLayout>
  );
};

export default DashboardScreen;
