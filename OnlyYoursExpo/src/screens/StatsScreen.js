import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  VelvetBrowseLayout,
  VelvetSectionCard,
  VelvetSecondaryButton,
  VelvetStatCard,
} from '../components/velvet';
import useDashboardGameFlow from './useDashboardGameFlow';
import useTheme from '../theme/useTheme';
import {
  buildAchievementsShareCard,
  buildMilestoneShareCard,
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

const compactAchievementLabel = (count) => `${count || 0} unlocked`;

// eslint-disable-next-line react/prop-types
const StatsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isSharing, shareCard, shareHost } = useShareCardComposer();
  const { user, progression, badges, stats, loading } = useDashboardGameFlow(navigation);

  const latestMilestone = progression?.recentMilestones?.[0] || null;
  const metricCards = [
    { label: 'Games Played', value: stats?.gamesPlayed ?? 0 },
    { label: 'Average Score', value: stats?.averageScore ?? 0 },
    { label: 'Best Score', value: stats?.bestScore ?? 0 },
    { label: 'Streak Days', value: stats?.streakDays ?? 0 },
    { label: 'Acceptance', value: `${stats?.invitationAcceptanceRate ?? 0}%` },
    { label: 'Avg Accept Time', value: formatResponseTime(stats?.avgInvitationResponseSeconds ?? 0) },
  ];

  const progressionCards = [
    progression?.coupleProgression
      ? {
          key: 'couple',
          eyebrow: 'Together',
          title: progression.coupleProgression.label || 'Couple Progression',
          level: progression.coupleProgression.level ?? 0,
          xp: progression.coupleProgression.xp ?? 0,
          streak: progression.coupleProgression.currentStreakDays ?? 0,
          achievements: progression.coupleProgression.achievementsUnlocked ?? 0,
        }
      : null,
    progression?.individualProgression
      ? {
          key: 'individual',
          eyebrow: 'You',
          title: progression.individualProgression.label || 'Personal Progression',
          level: progression.individualProgression.level ?? 0,
          xp: progression.individualProgression.xp ?? 0,
          streak: progression.individualProgression.currentStreakDays ?? 0,
          achievements: progression.individualProgression.achievementsUnlocked ?? 0,
        }
      : null,
  ].filter(Boolean);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: isTablet ? 8 : 0,
          paddingBottom: 30,
        },
        stateContent: {
          width: '100%',
          minHeight: 360,
        },
        sectionCard: {
          width: '100%',
          marginBottom: 14,
        },
        sectionTitle: {
          fontSize: 22,
          lineHeight: 26,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          marginBottom: 6,
        },
        sectionSubtitle: {
          fontSize: 13,
          lineHeight: 19,
          color: theme.colors.textSecondary,
          marginBottom: 14,
        },
        progressionGrid: {
          flexDirection: isTablet ? 'row' : 'column',
          justifyContent: 'space-between',
        },
        progressionCard: {
          width: isTablet ? '48.5%' : '100%',
          marginBottom: 10,
          backgroundColor: theme.mode === 'dark' ? theme.colors.surfaceOverlay : theme.colors.surfaceMuted,
          borderColor: theme.colors.borderAccent,
        },
        progressionEyebrow: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: theme.colors.primary,
          marginBottom: 6,
        },
        progressionTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        progressionMeta: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: 4,
        },
        milestoneCard: {
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
        milestoneTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 4,
        },
        milestoneMeta: {
          fontSize: 11,
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          marginBottom: 4,
        },
        milestoneDescription: {
          fontSize: 13,
          lineHeight: 19,
          color: theme.colors.textSecondary,
        },
        inlineActionButton: {
          marginTop: 10,
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
        achievementCard: {
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
        achievementTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 2,
        },
        achievementDescription: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          lineHeight: 18,
        },
        achievementScope: {
          fontSize: 10,
          color: theme.colors.textTertiary,
          textTransform: 'uppercase',
          marginBottom: 4,
          fontWeight: '700',
        },
        emptyText: {
          fontSize: 13,
          lineHeight: 19,
          color: theme.colors.textSecondary,
        },
      }),
    [isTablet, theme]
  );

  if (loading) {
    return (
      <VelvetBrowseLayout
        navigation={navigation}
        activeNavKey="stats"
        contentContainerStyle={styles.container}
        contentMaxWidth={isTablet ? 780 : 460}
      >
        <View style={styles.stateContent}>
          <LoadingSpinner message="Loading stats..." />
        </View>
      </VelvetBrowseLayout>
    );
  }

  return (
    <VelvetBrowseLayout
      navigation={navigation}
      activeNavKey="stats"
      contentContainerStyle={styles.container}
      contentMaxWidth={isTablet ? 780 : 460}
    >
      <VelvetSectionCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <Text style={styles.sectionSubtitle}>Shared and personal progress in one place.</Text>

        {progressionCards.length ? (
          <View style={styles.progressionGrid}>
            {progressionCards.map((card) => (
              <VelvetStatCard key={card.key} style={styles.progressionCard}>
                <Text style={styles.progressionEyebrow}>{card.eyebrow}</Text>
                <Text style={styles.progressionTitle}>{card.title}</Text>
                <Text style={styles.progressionMeta}>Level {card.level}</Text>
                <Text style={styles.progressionMeta}>{card.xp} XP total</Text>
                <Text style={styles.progressionMeta}>Streak: {card.streak} days</Text>
                <Text style={styles.progressionMeta}>
                  {compactAchievementLabel(card.achievements)}
                </Text>
              </VelvetStatCard>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="✨"
            title="No progress yet"
            message="Play a few games and your progression will appear here."
          />
        )}
      </VelvetSectionCard>

      <VelvetSectionCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Celebrations</Text>
        <Text style={styles.sectionSubtitle}>Your latest milestones and shared wins.</Text>

        {progression?.recentMilestones?.length ? (
          <>
            {progression.recentMilestones.map((milestone, index) => (
              <VelvetStatCard key={`${milestone.type}-${milestone.title}-${index}`} style={styles.milestoneCard}>
                <Text style={styles.milestoneMeta}>
                  {(milestone.ownerLabel || milestone.scope || 'Milestone').toUpperCase()}
                </Text>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              </VelvetStatCard>
            ))}
            {latestMilestone ? (
              <VelvetSecondaryButton
                label={isSharing ? 'Preparing Share...' : 'Share Latest Celebration'}
                onPress={() => shareCard(buildMilestoneShareCard(latestMilestone))}
                disabled={isSharing}
                style={styles.inlineActionButton}
              />
            ) : null}
          </>
        ) : (
          <Text style={styles.emptyText}>No celebrations yet.</Text>
        )}
      </VelvetSectionCard>

      <VelvetSectionCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Game Stats</Text>
        <Text style={styles.sectionSubtitle}>A quick read on your session trends.</Text>

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
        <Text style={styles.sectionSubtitle}>Badges you unlock over time.</Text>

        {badges?.length ? (
          <>
            <VelvetSecondaryButton
              label={isSharing ? 'Preparing Share...' : 'Share Achievement Snapshot'}
              onPress={() =>
                shareCard(
                  buildAchievementsShareCard({
                    ownerLabel: user?.name || 'You',
                    achievements: badges,
                  })
                )
              }
              disabled={isSharing}
              style={styles.inlineActionButton}
            />
            {badges.map((badge) => (
              <VelvetStatCard key={badge.code} style={styles.achievementCard}>
                {badge.scope ? (
                  <Text style={styles.achievementScope}>
                    {badge.scope === 'COUPLE' ? 'Couple' : 'Personal'}
                  </Text>
                ) : null}
                <Text style={styles.achievementTitle}>{badge.title}</Text>
                <Text style={styles.achievementDescription}>{badge.description}</Text>
              </VelvetStatCard>
            ))}
          </>
        ) : (
          <Text style={styles.emptyText}>No achievements yet.</Text>
        )}
      </VelvetSectionCard>

      {shareHost}
    </VelvetBrowseLayout>
  );
};

export default StatsScreen;
