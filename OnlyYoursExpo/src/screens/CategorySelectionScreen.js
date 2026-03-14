import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  ToastAndroid,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import WebSocketService from '../services/WebSocketService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';
import useTheme from '../theme/useTheme';
import { announceForAccessibility } from '../accessibility';

/**
 * CategorySelectionScreen displays available question categories.
 * 
 * Sprint 4 Update:
 * - Sends game invitation via WebSocket when category selected
 * - Shows confirmation dialog for sensitive categories
 * - Displays "Invitation sent..." alert
 * 
 * Flow:
 * 1. User selects category
 * 2. If sensitive: show confirmation dialog
 * 3. Send /app/game.invite WebSocket message
 * 4. Show "Waiting for partner..." alert
 */
const CategorySelectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { triggerHaptic } = useHaptics();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [customDeckSummary, setCustomDeckSummary] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isInviteInFlight, setIsInviteInFlight] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        title: {
          fontSize: 24,
          fontWeight: 'bold',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          color: theme.colors.textPrimary,
          textAlign: 'center',
        },
        listContent: {
          paddingHorizontal: 15,
          paddingBottom: 20,
          alignSelf: 'center',
          width: '100%',
          maxWidth: isTablet ? 760 : 520,
        },
        categoryCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 20,
          marginBottom: 15,
          ...theme.shadows.card,
          shadowColor: theme.colors.overlayScrim,
        },
        sensitiveCard: {
          borderWidth: 2,
          borderColor: theme.colors.warning,
        },
        categoryName: {
          fontSize: 20,
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        categoryDescription: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          lineHeight: 20,
        },
        sensitiveLabel: {
          marginTop: 10,
          fontSize: 12,
          color: theme.colors.warning,
          fontWeight: '600',
        },
        customDeckCard: {
          borderWidth: 2,
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.badgeSurfaceMint,
        },
        customDeckLabel: {
          marginTop: 10,
          fontSize: 12,
          color: theme.colors.accentContrast,
          fontWeight: '700',
        },
        disabledCard: {
          opacity: 0.6,
        },
      }),
    [isTablet, theme]
  );

  /**
   * Load categories from backend on mount.
   */
  useEffect(() => {
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsInviteInFlight(false);
    }, [])
  );

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [response, customSummaryResponse] = await Promise.all([
        api.get('/content/categories'),
        api.get('/custom-questions/summary').catch(() => ({ data: null })),
      ]);
      setCategories(response.data);
      setCustomDeckSummary(customSummaryResponse.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoadError(true);
      setCategories([]);
      setCustomDeckSummary(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle category selection.
   * Shows confirmation for sensitive categories, then sends invitation.
   */
  const handleCategorySelect = (category) => {
    if (category.isCustomDeck) {
      if (!customDeckSummary?.playable) {
        const questionsNeeded = customDeckSummary?.questionsNeededToPlay ?? 8;
        Alert.alert(
          'Custom Deck Not Ready Yet',
          `Your couple needs ${questionsNeeded} more custom question${questionsNeeded === 1 ? '' : 's'} before you can start a custom game.`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Manage Questions', onPress: () => navigation.navigate('CustomQuestions') },
          ]
        );
        return;
      }
      sendInvitation(category);
      return;
    }

    if (category.sensitive) {
      Alert.alert(
        'Sensitive Content',
        `${category.name} contains mature topics. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => sendInvitation(category) },
        ]
      );
    } else {
      sendInvitation(category);
    }
  };

  /**
   * Send game invitation via WebSocket.
   * Shows alert with option to cancel while waiting.
   */
  const sendInvitation = (category) => {
    console.log('[CategorySelection] Sending invitation for:', category.name);

    try {
      if (isInviteInFlight) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Invitation already pending. Please wait.', ToastAndroid.SHORT);
        } else {
          Alert.alert('Invitation Pending', 'Please wait for your partner to respond.');
        }
        announceForAccessibility('Invitation already pending. Please wait for your partner to respond.');
        triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
        return;
      }

      setIsInviteInFlight(true);

      if (!WebSocketService.isConnected()) {
        Alert.alert(
          'Realtime Disconnected',
          'Cannot send invitation right now because realtime connection is not ready. Please wait a few seconds and try again.'
        );
        announceForAccessibility('Realtime disconnected. Cannot send invitation right now.');
        triggerHaptic(HAPTIC_EVENTS.REALTIME_UNAVAILABLE);
        setIsInviteInFlight(false);
        return;
      }

      // Send invitation via WebSocket
      const payload = category.isCustomDeck
        ? { deckType: 'CUSTOM_COUPLE' }
        : { categoryId: category.id.toString() };
      const sent = WebSocketService.sendMessage('/app/game.invite', payload);
      if (!sent) {
        throw new Error('WebSocket not connected');
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Invitation sent. Waiting for your partner...', ToastAndroid.SHORT);
      }
      announceForAccessibility(`Invitation sent for ${category.name}. Waiting for your partner to respond.`);
      triggerHaptic(HAPTIC_EVENTS.INVITATION_SENT);
    } catch (error) {
      console.error('[CategorySelection] Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
      setIsInviteInFlight(false);
    }
  };

  /**
   * Render a single category card.
   */
  const customDeckCard = {
    id: 'custom-deck',
    name: customDeckSummary?.deckName || 'Custom Couple Questions',
    description: customDeckSummary
      ? customDeckSummary.playable
        ? `${customDeckSummary.deckDescription} Your deck is ready to play.`
        : `${customDeckSummary.deckDescription} Add ${customDeckSummary.questionsNeededToPlay} more question${customDeckSummary.questionsNeededToPlay === 1 ? '' : 's'} to unlock play.`
      : 'Create private questions that become part of a shared couple deck when played.',
    isCustomDeck: true,
    sensitive: false,
  };
  const displayItems = [customDeckCard, ...categories];

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        item.isCustomDeck && styles.customDeckCard,
        item.sensitive && styles.sensitiveCard,
        isInviteInFlight && styles.disabledCard,
      ]}
      onPress={() => handleCategorySelect(item)}
      disabled={isInviteInFlight}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}. ${item.description}${item.sensitive ? '. Mature content.' : ''}${item.isCustomDeck ? '. Custom couple deck.' : ''}`}
      accessibilityHint={item.isCustomDeck
        ? 'Double tap to start a custom-deck invitation if your deck is ready, or manage your custom questions if it is not.'
        : 'Double tap to send a game invitation with this category.'}
      accessibilityState={{ disabled: isInviteInFlight }}>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDescription}>{item.description}</Text>
      {item.isCustomDeck ? (
        <Text style={styles.customDeckLabel}>
          {customDeckSummary?.playable ? 'Custom Deck Ready' : 'Build Your Private Deck'}
        </Text>
      ) : null}
      {item.sensitive && (
        <Text style={styles.sensitiveLabel}>Mature Content</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (loadError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't Load Categories"
        message="Check your connection and try again."
        actionLabel="Retry"
        onAction={loadCategories}
      />
    );
  }

  if (displayItems.length === 0) {
    return (
      <EmptyState
        icon="📂"
        title="No Categories Yet"
        message="Question categories will appear here once they're available."
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">What do you want to explore?</Text>
      <FlatList
        data={displayItems}
        renderItem={renderCategory}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default CategorySelectionScreen;
