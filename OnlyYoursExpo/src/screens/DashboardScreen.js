import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import useDashboardGameFlow from './useDashboardGameFlow';
import BadgeChip from '../components/BadgeChip';
import useTheme from '../theme/useTheme';

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
  const {
    user,
    couple,
    activeGame,
    stats,
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
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
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
          borderRadius: 25,
          marginBottom: 18,
          minWidth: isTablet ? 320 : 250,
          alignItems: 'center',
          ...theme.shadows.button,
          shadowColor: theme.colors.primary,
        },
        secondaryButton: {
          backgroundColor: theme.colors.accent,
          paddingHorizontal: 40,
          paddingVertical: 15,
          borderRadius: 25,
          marginBottom: 15,
          minWidth: isTablet ? 320 : 250,
          alignItems: 'center',
          ...theme.shadows.button,
          shadowColor: theme.colors.accent,
        },
        sectionCard: {
          width: '100%',
          maxWidth: isTablet ? 740 : 420,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
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
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: 12,
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome, {user?.name}!</Text>

        {couple ? (
          <>
            <Text style={styles.subtitle}>Connected with {getPartnerName()}</Text>

            {shouldShowContinueGame ? (
              <View style={styles.activeSessionCard}>
                <Text style={styles.activeSessionTitle}>Continue your active game</Text>
                <Text style={styles.activeSessionMeta}>
                  {activeGame.round || activeGame.status} • Question {activeGame.currentQuestionNumber || 1}
                  /{activeGame.totalQuestions || 8}
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={handleContinueGame}>
                  <Text style={styles.buttonText}>Continue Game</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleStartGame}>
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
            >
              <Text style={styles.buttonText}>Link with Partner</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.metricsGrid}>
            {metricCards.map((item) => (
              <View key={item.label} style={styles.metricItem}>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {badges?.length ? (
            <View style={styles.badgeList}>
              {badges.map((badge) => (
                <BadgeChip key={badge.code} badge={badge} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBadgeText}>No badges yet. Complete games to unlock milestones.</Text>
          )}
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('GameHistory')}
          >
            <Text style={styles.linkText}>Game History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.linkText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;


