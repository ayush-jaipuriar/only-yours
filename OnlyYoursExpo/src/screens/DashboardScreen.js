import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import useDashboardGameFlow from './useDashboardGameFlow';
import BadgeChip from '../components/BadgeChip';
import MilestoneHighlights from '../components/MilestoneHighlights';
import ProgressionCard from '../components/ProgressionCard';
import {
  VelvetBrowseLayout,
  VelvetHeroCard,
  VelvetSectionCard,
  VelvetStatCard,
} from '../components/velvet';
import useTheme from '../theme/useTheme';
import {
  buildMilestoneShareCard,
  buildProgressionShareCard,
  useShareCardComposer,
} from '../sharing';

/**
 * DashboardScreen is the main landing page after login.
 * 
 * Features:
 * - Displays couple link status
 * - "Start New Game" button (if linked)
 * - "Link with Partner" button (if not linked)
 * - Navigation to Profile
 * 
 * Sprint 4 Update: Added "Start New Game" functionality
 */
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
    shouldShowContinueGame,
    handleStartGame,
    handleContinueGame,
    getPartnerName,
  } = useDashboardGameFlow(navigation);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scrollContent: {
          padding: 20,
          alignItems: 'center',
          paddingBottom: 30,
        },
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        },
        loadingText: {
          marginTop: 10,
          fontSize: 16,
          color: theme.colors.textSecondary,
        },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 10,
          color: theme.colors.textPrimary,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 18,
          marginBottom: 16,
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
        activeSessionCard: {
          width: '100%',
          maxWidth: isTablet ? 640 : 360,
          marginBottom: 10,
          alignItems: 'center',
        },
        activeSessionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 6,
        },
        activeSessionMeta: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: 14,
          textAlign: 'center',
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderRadius: 18,
          marginBottom: 18,
          minWidth: isTablet ? 320 : 250,
          alignItems: 'center',
          ...theme.shadows.button,
          shadowColor: theme.colors.glowPrimary,
        },
        secondaryButton: {
          backgroundColor: theme.colors.accent,
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderRadius: 18,
          marginBottom: 15,
          minWidth: isTablet ? 320 : 250,
          alignItems: 'center',
          ...theme.shadows.button,
          shadowColor: theme.colors.glowAccent,
        },
        sectionCard: {
          width: '100%',
          maxWidth: isTablet ? 740 : 420,
          marginBottom: 14,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 10,
        },
        metricsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        metricItem: {
          width: isTablet ? '31.8%' : '48%',
          paddingVertical: 10,
          paddingHorizontal: 8,
          marginBottom: 8,
        },
        metricValue: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.textPrimary,
        },
        metricLabel: {
          fontSize: 11,
          color: theme.colors.textSecondary,
          marginTop: 2,
        },
        badgeList: {
          width: '100%',
        },
        emptyBadgeText: {
          fontSize: 13,
          color: theme.colors.textSecondary,
        },
        emptyProgressionText: {
          fontSize: 13,
          color: theme.colors.textSecondary,
        },
        linksRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        },
        tertiaryButton: {
          marginTop: 6,
          marginHorizontal: 10,
        },
        shareInlineButton: {
          marginTop: 4,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          borderRadius: 999,
          alignSelf: 'flex-start',
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: theme.colors.surfaceMuted,
        },
        shareInlineText: {
          color: theme.colors.textPrimary,
          fontSize: 13,
          fontWeight: '700',
        },
        buttonText: {
          color: theme.colors.primaryContrast,
          fontSize: 18,
          fontWeight: '600',
        },
        linkText: {
          color: theme.colors.primary,
          fontSize: 16,
          textDecorationLine: 'underline',
        },
        innerContent: {
          alignItems: 'center',
        },
      }),
    [isTablet, theme]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const metricCards = [
    { label: 'Games Played', value: stats?.gamesPlayed ?? 0 },
    { label: 'Avg Score', value: stats?.averageScore ?? 0 },
    { label: 'Best Score', value: stats?.bestScore ?? 0 },
    { label: 'Streak Days', value: stats?.streakDays ?? 0 },
    { label: 'Acceptance', value: `${stats?.invitationAcceptanceRate ?? 0}%` },
    { label: 'Avg Accept Time', value: `${stats?.avgInvitationResponseSeconds ?? 0}s` },
  ];
  const latestMilestone = progression?.recentMilestones?.[0] || null;

  return (
    <VelvetBrowseLayout
      navigation={navigation}
      activeNavKey="dashboard"
      headerTitle="Only Yours"
      headerSubtitle={
        couple ? `Connected with ${getPartnerName()}` : 'Your private space for two'
      }
      scrollStyle={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentMaxWidth={isTablet ? 760 : 460}
    >
      <View style={styles.innerContent}>
        <Text style={styles.title}>Welcome, {user?.name}!</Text>

        {couple ? (
          <>
            <Text style={styles.subtitle}>Connected with {getPartnerName()}</Text>

            {shouldShowContinueGame ? (
              <VelvetHeroCard style={styles.activeSessionCard}>
                <Text style={styles.activeSessionTitle}>Continue your active game</Text>
                <Text style={styles.activeSessionMeta}>
                  {activeGame.round || activeGame.status} • Question {activeGame.currentQuestionNumber || 1}
                  /{activeGame.totalQuestions || 8}
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleContinueGame}
                  accessibilityRole="button"
                  accessibilityLabel="Continue active game"
                  accessibilityHint="Opens your current game session."
                >
                  <Text style={styles.buttonText}>Continue Game</Text>
                </TouchableOpacity>
              </VelvetHeroCard>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartGame}
                accessibilityRole="button"
                accessibilityLabel="Start new game"
                accessibilityHint="Opens category selection to invite your partner to a new game."
              >
                <Text style={styles.buttonText}>Start New Game</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Not linked with a partner yet</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('PartnerLink')}
              accessibilityRole="button"
              accessibilityLabel="Link with partner"
              accessibilityHint="Opens the partner linking screen."
            >
              <Text style={styles.buttonText}>Link with Partner</Text>
            </TouchableOpacity>
          </>
        )}

        <VelvetSectionCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Progression</Text>
          {progression?.coupleProgression || progression?.individualProgression ? (
            <>
              <ProgressionCard snapshot={progression?.coupleProgression} />
              <ProgressionCard snapshot={progression?.individualProgression} compact />
              {progression?.coupleProgression ? (
                <TouchableOpacity
                  style={styles.shareInlineButton}
                  onPress={() => shareCard(buildProgressionShareCard(progression.coupleProgression))}
                  disabled={isSharing}
                  accessibilityRole="button"
                  accessibilityLabel="Share couple progression"
                  accessibilityHint="Generates a branded image card for your couple progression."
                >
                  <Text style={styles.shareInlineText}>
                    {isSharing ? 'Preparing Share...' : 'Share Couple Progress'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyProgressionText}>Progression is loading or unavailable right now.</Text>
          )}
        </VelvetSectionCard>

        <MilestoneHighlights milestones={progression?.recentMilestones} />
        {latestMilestone ? (
          <TouchableOpacity
            style={styles.shareInlineButton}
            onPress={() => shareCard(buildMilestoneShareCard(latestMilestone))}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel="Share latest celebration"
            accessibilityHint="Generates a branded image card for the newest milestone or streak."
          >
            <Text style={styles.shareInlineText}>
              {isSharing ? 'Preparing Share...' : 'Share Latest Celebration'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <VelvetSectionCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
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
          <Text style={styles.sectionTitle}>Achievements</Text>
          {badges?.length ? (
            <View style={styles.badgeList}>
              {badges.map((badge) => (
                <BadgeChip key={badge.code} badge={badge} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBadgeText}>No achievements yet. Complete games to unlock milestones.</Text>
          )}
        </VelvetSectionCard>

        <View style={styles.linksRow}>
          {couple ? (
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={() => navigation.navigate('CustomQuestions')}
              accessibilityRole="button"
              accessibilityLabel="Open custom questions"
              accessibilityHint="Shows the custom questions you created for your couple deck."
            >
              <Text style={styles.linkText}>Custom Questions</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('GameHistory')}
            accessibilityRole="button"
            accessibilityLabel="Open game history"
            accessibilityHint="Shows your previous games and filters."
          >
            <Text style={styles.linkText}>Game History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            accessibilityHint="Shows your profile and account details."
          >
            <Text style={styles.linkText}>View Profile</Text>
          </TouchableOpacity>
        </View>
        {shareHost}
      </View>
    </VelvetBrowseLayout>
  );
};

export default DashboardScreen;
