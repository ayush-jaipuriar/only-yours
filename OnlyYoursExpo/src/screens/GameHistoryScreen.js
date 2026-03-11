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
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import useGameHistoryFlow from './useGameHistoryFlow';
import useTheme from '../theme/useTheme';

const SORT_OPTIONS = [
  { key: 'recent', label: 'Recent' },
  { key: 'oldest', label: 'Oldest' },
];

const WINNER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'self', label: 'I Won' },
  { key: 'partner', label: 'Partner Won' },
];

const renderEmptyHistoryState = (winnerFilter, setWinnerFilter, reload) => {
  const isFiltered = winnerFilter !== 'all';
  return (
    <EmptyState
      icon="🗂️"
      title={isFiltered ? 'No Games Match This Filter' : 'No Game History Yet'}
      message={
        isFiltered
          ? 'Try switching filter to see all previous sessions.'
          : 'Complete at least one game and your history will appear here.'
      }
      actionLabel={isFiltered ? 'Show All' : 'Refresh'}
      onAction={isFiltered ? () => setWinnerFilter('all') : reload}
    />
  );
};

// eslint-disable-next-line react/prop-types
const GameHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const {
    historyItems,
    sortOption,
    setSortOption,
    winnerFilter,
    setWinnerFilter,
    loading,
    loadingMore,
    loadError,
    hasNext,
    loadMore,
    reload,
  } = useGameHistoryFlow(navigation);

  const resultTheme = {
    WIN: { text: 'You won', color: theme.colors.success, background: theme.colors.badgeSurfaceMint },
    LOSS: { text: 'Partner won', color: theme.colors.danger, background: theme.colors.badgeSurfaceRose },
    DRAW: { text: 'Draw', color: theme.colors.textSecondary, background: theme.colors.badgeSurfaceLavender },
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 16,
          paddingBottom: 28,
          alignSelf: 'center',
          width: '100%',
          maxWidth: isTablet ? 760 : 460,
        },
        sectionTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        filterRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 14,
        },
        pill: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          marginRight: 8,
          marginBottom: 8,
        },
        pillActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        pillText: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        },
        pillTextActive: {
          color: theme.colors.primaryContrast,
        },
        card: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.overlayScrim,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        cardDate: {
          color: theme.colors.textSecondary,
          fontSize: 13,
        },
        resultBadge: {
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        resultText: {
          fontSize: 12,
          fontWeight: '700',
        },
        partnerText: {
          fontSize: 14,
          color: theme.colors.textPrimary,
          marginBottom: 10,
        },
        scoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        scoreBlock: {
          alignItems: 'center',
          minWidth: 80,
        },
        scoreLabel: {
          color: theme.colors.textSecondary,
          fontSize: 12,
          marginBottom: 3,
        },
        scoreValue: {
          color: theme.colors.textPrimary,
          fontSize: 20,
          fontWeight: '700',
        },
        vsText: {
          fontSize: 18,
          color: theme.colors.textSecondary,
          fontWeight: '700',
        },
        loadMoreButton: {
          marginTop: 4,
          backgroundColor: theme.colors.primary,
          borderRadius: 22,
          alignItems: 'center',
          paddingVertical: 12,
        },
        loadMoreText: {
          color: theme.colors.primaryContrast,
          fontSize: 14,
          fontWeight: '700',
        },
        endText: {
          marginTop: 8,
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: 13,
        },
      }),
    [isTablet, theme]
  );

  const formatPlayedAt = (timestamp) => {
    if (!timestamp) {
      return 'Unknown date';
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your game history..." />;
  }

  if (loadError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn’t Load History"
        message="We couldn’t fetch your recent games right now."
        actionLabel="Retry"
        onAction={reload}
      />
    );
  }

  if (!historyItems.length) {
    return renderEmptyHistoryState(winnerFilter, setWinnerFilter, reload);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Sort</Text>
      <View style={styles.filterRow}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.pill, sortOption === option.key && styles.pillActive]}
            onPress={() => setSortOption(option.key)}
          >
            <Text style={[styles.pillText, sortOption === option.key && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Winner Filter</Text>
      <View style={styles.filterRow}>
        {WINNER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.pill, winnerFilter === option.key && styles.pillActive]}
            onPress={() => setWinnerFilter(option.key)}
          >
            <Text style={[styles.pillText, winnerFilter === option.key && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {historyItems.map((item) => {
        const cardResultTheme = resultTheme[item.result] || resultTheme.DRAW;
        return (
          <View key={item.sessionId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{formatPlayedAt(item.completedAt)}</Text>
              <View style={[styles.resultBadge, { backgroundColor: cardResultTheme.background }]}>
                <Text style={[styles.resultText, { color: cardResultTheme.color }]}>
                  {cardResultTheme.text}
                </Text>
              </View>
            </View>
            <Text style={styles.partnerText}>Played with {item.partnerName}</Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>You</Text>
                <Text style={styles.scoreValue}>{item.myScore ?? 0}</Text>
              </View>
              <Text style={styles.vsText}>:</Text>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>Partner</Text>
                <Text style={styles.scoreValue}>{item.partnerScore ?? 0}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {hasNext ? (
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={loadingMore}>
          {loadingMore ? (
            <ActivityIndicator color={theme.colors.primaryContrast} />
          ) : (
            <Text style={styles.loadMoreText}>Load More</Text>
          )}
        </TouchableOpacity>
      ) : (
        <Text style={styles.endText}>You’re all caught up.</Text>
      )}
    </ScrollView>
  );
};

export default GameHistoryScreen;
