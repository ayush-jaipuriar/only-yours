import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import useDashboardGameFlow from './useDashboardGameFlow';
import BadgeChip from '../components/BadgeChip';

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
const DashboardScreen = ({ navigation: { navigate } }) => {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ea" />
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
              onPress={() => navigate('PartnerLink')}
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
          <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigate('GameHistory')}>
            <Text style={styles.linkText}>Game History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigate('Profile')}>
            <Text style={styles.linkText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
    textAlign: 'center',
  },
  activeSessionCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d6cff7',
    alignItems: 'center',
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D225A',
    marginBottom: 6,
  },
  activeSessionMeta: {
    fontSize: 14,
    color: '#5B4CAF',
    marginBottom: 14,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 18,
    minWidth: 250,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#03dac6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 250,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#03dac6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e6e3f8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D225A',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f7f5ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#362B6E',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B6296',
    marginTop: 2,
  },
  badgeList: {
    width: '100%',
  },
  emptyBadgeText: {
    fontSize: 13,
    color: '#6B6296',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tertiaryButton: {
    marginTop: 6,
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#6200ea',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default DashboardScreen;


