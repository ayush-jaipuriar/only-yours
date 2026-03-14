import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import useTheme from '../theme/useTheme';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';

const FALLBACK_SUMMARY = {
  deckName: 'Custom Couple Questions',
  deckDescription: 'Create private questions that become playable as a shared couple deck.',
  authoredQuestionCount: 0,
  couplePlayableQuestionCount: 0,
  minimumQuestionsRequired: 8,
  questionsNeededToPlay: 8,
  playable: false,
  linked: true,
};

// eslint-disable-next-line react/prop-types
const CustomQuestionsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { triggerHaptic } = useHaptics();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState(FALLBACK_SUMMARY);
  const [deletingId, setDeletingId] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 18,
          paddingBottom: 28,
          alignSelf: 'center',
          width: '100%',
          maxWidth: isTablet ? 760 : 520,
        },
        heroCard: {
          backgroundColor: theme.colors.surfaceOverlay,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.colors.borderAccent,
          marginBottom: 14,
          ...theme.shadows.card,
          shadowColor: theme.colors.overlayScrim,
        },
        heroTitle: {
          fontSize: 22,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        heroText: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
        },
        statsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginTop: 14,
        },
        statCard: {
          width: isTablet ? '32%' : '48%',
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 8,
        },
        statValue: {
          color: theme.colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
        },
        statLabel: {
          color: theme.colors.textSecondary,
          fontSize: 12,
          marginTop: 4,
        },
        helperBanner: {
          marginTop: 12,
          backgroundColor: summary.playable ? theme.colors.badgeSurfaceMint : theme.colors.surfaceMuted,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: summary.playable ? theme.colors.accent : theme.colors.border,
        },
        helperText: {
          color: summary.playable ? theme.colors.accentContrast : theme.colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        },
        addButton: {
          marginTop: 16,
          backgroundColor: theme.colors.primary,
          borderRadius: 18,
          paddingVertical: 14,
          alignItems: 'center',
          ...theme.shadows.button,
          shadowColor: theme.colors.glowPrimary,
        },
        addButtonText: {
          color: theme.colors.primaryContrast,
          fontSize: 16,
          fontWeight: '700',
        },
        sectionTitle: {
          marginTop: 18,
          marginBottom: 10,
          color: theme.colors.textPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 12,
          ...theme.shadows.card,
          shadowColor: theme.colors.overlayScrim,
        },
        questionText: {
          color: theme.colors.textPrimary,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 10,
        },
        optionText: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          marginBottom: 4,
        },
        footerRow: {
          marginTop: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        },
        updatedText: {
          color: theme.colors.textTertiary,
          fontSize: 12,
          marginBottom: 6,
        },
        actionRow: {
          flexDirection: 'row',
        },
        ghostButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
          marginLeft: 8,
        },
        ghostButtonDanger: {
          borderColor: theme.colors.danger,
        },
        ghostButtonText: {
          color: theme.colors.textPrimary,
          fontSize: 13,
          fontWeight: '600',
        },
        ghostButtonDangerText: {
          color: theme.colors.danger,
        },
      }),
    [isTablet, summary.playable, theme]
  );

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [questionsResponse, summaryResponse] = await Promise.all([
        api.get('/custom-questions/mine'),
        api.get('/custom-questions/summary'),
      ]);
      setQuestions(questionsResponse.data || []);
      setSummary(summaryResponse.data || FALLBACK_SUMMARY);
    } catch (error) {
      console.error('Error loading custom questions:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen])
  );

  const handleDelete = useCallback((questionId) => {
    Alert.alert(
      'Delete Custom Question',
      'This removes the question from your authored list and future custom games. Existing completed games stay intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(questionId);
              await api.delete(`/custom-questions/${questionId}`);
              setQuestions(current => current.filter(item => item.id !== questionId));
              await loadScreen();
            } catch (error) {
              console.error('Error deleting custom question:', error);
              triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
              Alert.alert('Delete Failed', 'We could not delete that custom question right now.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, [loadScreen, triggerHaptic]);

  const formatUpdatedAt = (timestamp) => {
    if (!timestamp) {
      return 'Recently updated';
    }
    return `Updated ${new Date(timestamp).toLocaleDateString()}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your custom questions..." />;
  }

  if (loadError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn’t Load Custom Questions"
        message="We couldn’t fetch your authored questions or deck summary right now."
        actionLabel="Retry"
        onAction={loadScreen}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle} accessibilityRole="header">{summary.deckName}</Text>
        <Text style={styles.heroText}>{summary.deckDescription}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.authoredQuestionCount ?? 0}</Text>
            <Text style={styles.statLabel}>Questions You Wrote</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.couplePlayableQuestionCount ?? 0}</Text>
            <Text style={styles.statLabel}>Active Couple Deck Count</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.questionsNeededToPlay ?? 0}</Text>
            <Text style={styles.statLabel}>More Needed To Play</Text>
          </View>
        </View>

        <View style={styles.helperBanner}>
          <Text style={styles.helperText}>
            {summary.playable
              ? 'Your custom deck is ready. Start a new game and choose the custom couple deck.'
              : `Your couple needs ${summary.questionsNeededToPlay} more active custom questions before a custom game can start.`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CustomQuestionEditor')}
          accessibilityRole="button"
          accessibilityLabel="Add custom question"
          accessibilityHint="Opens the custom question editor."
        >
          <Text style={styles.addButtonText}>Add Custom Question</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">Your Authored Questions</Text>

      {!questions.length ? (
        <EmptyState
          icon="✍️"
          title="No Custom Questions Yet"
          message="Create your first private question. It will stay visible only to you outside the game, but it becomes part of the shared custom deck when played."
          actionLabel="Create First Question"
          onAction={() => navigation.navigate('CustomQuestionEditor')}
        />
      ) : (
        questions.map((question) => (
          <View
            key={question.id}
            style={styles.card}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Custom question. ${question.questionText}. ${formatUpdatedAt(question.updatedAt)}.`}
          >
            <Text style={styles.questionText}>{question.questionText}</Text>
            <Text style={styles.optionText}>A. {question.optionA}</Text>
            <Text style={styles.optionText}>B. {question.optionB}</Text>
            <Text style={styles.optionText}>C. {question.optionC}</Text>
            <Text style={styles.optionText}>D. {question.optionD}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.updatedText}>{formatUpdatedAt(question.updatedAt)}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.ghostButton}
                  onPress={() => navigation.navigate('CustomQuestionEditor', { question })}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit custom question ${question.questionText}`}
                >
                  <Text style={styles.ghostButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ghostButton, styles.ghostButtonDanger]}
                  onPress={() => handleDelete(question.id)}
                  disabled={deletingId === question.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete custom question ${question.questionText}`}
                  accessibilityState={{ disabled: deletingId === question.id }}
                >
                  <Text style={[styles.ghostButtonText, styles.ghostButtonDangerText]}>
                    {deletingId === question.id ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default CustomQuestionsScreen;
