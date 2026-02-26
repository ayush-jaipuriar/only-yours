import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import useGameHistoryFlow from './useGameHistoryFlow';

const SORT_OPTIONS = [
  { key: 'recent', label: 'Recent' },
  { key: 'oldest', label: 'Oldest' },
];

const WINNER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'self', label: 'I Won' },
  { key: 'partner', label: 'Partner Won' },
];

const RESULT_THEME = {
  WIN: { text: 'You won', color: '#1E7A4E', background: '#E3F7ED' },
  LOSS: { text: 'Partner won', color: '#A13333', background: '#FDECEC' },
  DRAW: { text: 'Draw', color: '#5B4CAF', background: '#EEE9FF' },
};

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
        const resultTheme = RESULT_THEME[item.result] || RESULT_THEME.DRAW;
        return (
          <View key={item.sessionId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{formatPlayedAt(item.completedAt)}</Text>
              <View style={[styles.resultBadge, { backgroundColor: resultTheme.background }]}>
                <Text style={[styles.resultText, { color: resultTheme.color }]}>{resultTheme.text}</Text>
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
            <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D225A',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1CCF1',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#6200ea',
    borderColor: '#6200ea',
  },
  pillText: {
    color: '#5B4CAF',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E0F7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    color: '#6B6296',
    fontSize: 13,
  },
  resultBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '700',
  },
  partnerText: {
    fontSize: 14,
    color: '#2D225A',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F5FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  scoreBlock: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    color: '#6B6296',
    fontSize: 12,
    marginBottom: 3,
  },
  scoreValue: {
    color: '#2D225A',
    fontSize: 20,
    fontWeight: '700',
  },
  vsText: {
    fontSize: 18,
    color: '#5B4CAF',
    fontWeight: '700',
  },
  loadMoreButton: {
    marginTop: 4,
    backgroundColor: '#6200ea',
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  endText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#7F78A8',
    fontSize: 13,
  },
});

export default GameHistoryScreen;
