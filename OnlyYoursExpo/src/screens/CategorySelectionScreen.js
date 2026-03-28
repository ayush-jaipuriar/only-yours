import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  VelvetFocusedScreen,
  VelvetHeroCard,
  VelvetOptionCard,
  VelvetPrimaryButton,
  VelvetSectionCard,
  VelvetSecondaryButton,
  VelvetStatusPill,
} from '../components/velvet';
import { announceForAccessibility } from '../accessibility';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';
import api from '../services/api';
import WebSocketService from '../services/WebSocketService';
import useTheme from '../theme/useTheme';

const getCustomDeckDescription = (customDeckSummary) => {
  if (!customDeckSummary) {
    return 'Create private prompts that become a shared deck once your couple is ready to play them together.';
  }

  if (customDeckSummary.playable) {
    return `${customDeckSummary.deckDescription} Your private deck is ready to play tonight.`;
  }

  return `${customDeckSummary.deckDescription} Add ${customDeckSummary.questionsNeededToPlay} more question${customDeckSummary.questionsNeededToPlay === 1 ? '' : 's'} to unlock play.`;
};

// eslint-disable-next-line react/prop-types
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
        list: {
          flex: 1,
        },
        listContent: {
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 32,
          width: '100%',
          maxWidth: isTablet ? 820 : 560,
          alignSelf: 'center',
        },
        introSection: {
          width: '100%',
          marginBottom: 16,
        },
        eyebrow: {
          color: theme.colors.textTertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 38 : 32,
          lineHeight: isTablet ? 42 : 36,
          marginBottom: 10,
        },
        titleAccent: {
          color: theme.colors.primary,
        },
        body: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        },
        heroCard: {
          width: '100%',
          marginBottom: 16,
          overflow: 'hidden',
        },
        heroGlow: {
          position: 'absolute',
          top: -36,
          right: -18,
          width: isTablet ? 220 : 170,
          height: isTablet ? 220 : 170,
          borderRadius: 999,
          backgroundColor: theme.colors.glowPrimary,
          opacity: 0.45,
        },
        heroTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: isTablet ? 30 : 28,
          lineHeight: isTablet ? 34 : 32,
          marginTop: 12,
          marginBottom: 8,
        },
        heroBody: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        },
        heroButtonRow: {
          flexDirection: isTablet ? 'row' : 'column',
          marginTop: 18,
        },
        heroPrimary: {
          flex: 1,
          marginRight: isTablet ? 10 : 0,
          marginBottom: isTablet ? 0 : 10,
        },
        heroSecondary: {
          flex: isTablet ? 0.75 : 1,
        },
        sectionCard: {
          width: '100%',
          marginBottom: 14,
        },
        sectionTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 24,
          lineHeight: 28,
          marginBottom: 4,
        },
        sectionBody: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
          marginBottom: 12,
        },
        statusRow: {
          marginBottom: 4,
        },
        categoryCard: {
          marginBottom: 12,
        },
        categoryHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        },
        categoryHeaderCopy: {
          flex: 1,
          paddingRight: 12,
        },
        categoryName: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 24,
          lineHeight: 28,
          marginBottom: 4,
        },
        categoryDescription: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
        },
        categoryFooter: {
          flexDirection: isTablet ? 'row' : 'column',
          alignItems: isTablet ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          marginTop: 14,
        },
        categoryMeta: {
          color: theme.colors.textTertiary,
          fontSize: 12,
          letterSpacing: 0.7,
          textTransform: 'uppercase',
          fontWeight: '700',
          marginBottom: isTablet ? 0 : 8,
        },
        categoryAction: {
          color: theme.colors.primary,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
        helperCard: {
          width: '100%',
          marginTop: 2,
        },
        helperTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamilies.heading,
          fontSize: 22,
          lineHeight: 26,
          marginBottom: 8,
        },
        helperBody: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 14,
        },
      }),
    [isTablet, theme]
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

  useEffect(() => {
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsInviteInFlight(false);
    }, [])
  );

  const sendInvitation = (category) => {
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
      return;
    }

    sendInvitation(category);
  };

  const customDeckCard = {
    id: 'custom-deck',
    name: customDeckSummary?.deckName || 'Custom Couple Questions',
    description: getCustomDeckDescription(customDeckSummary),
    isCustomDeck: true,
    sensitive: false,
  };

  const displayItems = categories || [];

  const renderCategory = ({ item }) => (
    <VelvetOptionCard
      style={styles.categoryCard}
      onPress={() => handleCategorySelect(item)}
      disabled={isInviteInFlight}
      activeOpacity={0.82}
      selected={item.sensitive}
      tone={item.sensitive ? 'accent' : 'primary'}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}. ${item.description}${item.sensitive ? '. Mature content.' : ''}`}
      accessibilityHint="Double tap to send a game invitation with this category."
      accessibilityState={{ disabled: isInviteInFlight }}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderCopy}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
        </View>
        {item.sensitive ? <VelvetStatusPill label="Mature" tone="warning" /> : null}
      </View>
      <View style={styles.categoryFooter}>
        <Text style={styles.categoryMeta}>{item.id ? `Category ${item.id}` : 'Conversation Deck'}</Text>
        <Text style={styles.categoryAction}>{isInviteInFlight ? 'Invitation Pending' : 'Invite Partner'}</Text>
      </View>
    </VelvetOptionCard>
  );

  const listHeader = (
    <>
      <View style={styles.introSection}>
        <Text style={styles.eyebrow}>Next Session</Text>
        <Text style={styles.title}>
          Choose your <Text style={styles.titleAccent}>conversation</Text> journey.
        </Text>
        <Text style={styles.body}>
          Pick a deck that matches the energy of tonight&apos;s connection. Each category shapes a different rhythm of questions, guesses, and reveals.
        </Text>
      </View>

      <VelvetHeroCard style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <VelvetStatusPill
          label={customDeckSummary?.playable ? 'Custom deck ready' : 'Build your private deck'}
          tone={customDeckSummary?.playable ? 'success' : 'accent'}
        />
        <Text style={styles.heroTitle}>{customDeckCard.name}</Text>
        <Text style={styles.heroBody}>{customDeckCard.description}</Text>

        <View style={styles.heroButtonRow}>
          <VelvetPrimaryButton
            label={customDeckSummary?.playable ? 'Play Custom Deck' : 'Manage Questions'}
            onPress={
              customDeckSummary?.playable
                ? () => handleCategorySelect(customDeckCard)
                : () => navigation.navigate('CustomQuestions')
            }
            style={styles.heroPrimary}
            disabled={isInviteInFlight}
          />
          <VelvetSecondaryButton
            label={isInviteInFlight ? 'Invite Pending' : 'Browse Standard Decks'}
            onPress={() => null}
            style={styles.heroSecondary}
            disabled
          />
        </View>
      </VelvetHeroCard>

      <VelvetSectionCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Standard Categories</Text>
        <Text style={styles.sectionBody}>
          Choose a mood, send the invite, and wait for your partner to join. Sensitive categories will ask for confirmation before they are sent.
        </Text>
        <View style={styles.statusRow}>
          <VelvetStatusPill
            label={isInviteInFlight ? 'Invitation in flight' : 'Ready to invite'}
            tone={isInviteInFlight ? 'warning' : 'primary'}
          />
        </View>
      </VelvetSectionCard>
    </>
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

  if (!customDeckSummary && displayItems.length === 0) {
    return (
      <EmptyState
        icon="📂"
        title="No Categories Yet"
        message="Question categories will appear here once they're available."
      />
    );
  }

  return (
    <VelvetFocusedScreen
      navigation={navigation}
      title="Choose a Category"
      subtitle="Pick the mood for your next game"
      withAtmosphere
      atmosphere="focused"
    >
      <FlatList
        data={displayItems}
        style={styles.list}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListFooterComponent={(
          <VelvetSectionCard style={styles.helperCard}>
            <Text style={styles.helperTitle}>Need a more personal session?</Text>
            <Text style={styles.helperBody}>
              Custom questions are private prompts you author yourselves. They become part of your couple deck and create a more intimate, tailored game flow over time.
            </Text>
            <VelvetSecondaryButton
              label="Open Custom Questions"
              onPress={() => navigation.navigate('CustomQuestions')}
            />
          </VelvetSectionCard>
        )}
      />
    </VelvetFocusedScreen>
  );
};

export default CategorySelectionScreen;
