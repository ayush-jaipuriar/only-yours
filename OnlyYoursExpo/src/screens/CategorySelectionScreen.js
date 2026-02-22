import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import api from '../services/api';
import WebSocketService from '../services/WebSocketService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(false);

  /**
   * Load categories from backend on mount.
   */
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await api.get('/content/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoadError(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle category selection.
   * Shows confirmation for sensitive categories, then sends invitation.
   */
  const handleCategorySelect = (category) => {
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
      if (!WebSocketService.isConnected()) {
        Alert.alert(
          'Realtime Disconnected',
          'Cannot send invitation right now because realtime connection is not ready. Please wait a few seconds and try again.'
        );
        return;
      }

      // Send invitation via WebSocket
      const sent = WebSocketService.sendMessage('/app/game.invite', {
        categoryId: category.id.toString(),
      });
      if (!sent) {
        throw new Error('WebSocket not connected');
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Invitation sent. Waiting for your partner...', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('[CategorySelection] Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };

  /**
   * Render a single category card.
   */
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, item.sensitive && styles.sensitiveCard]}
      onPress={() => handleCategorySelect(item)}
      activeOpacity={0.7}>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDescription}>{item.description}</Text>
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

  if (categories.length === 0) {
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
      <Text style={styles.title}>What do you want to explore?</Text>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sensitiveCard: {
    borderWidth: 2,
    borderColor: '#ff6f00',
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sensitiveLabel: {
    marginTop: 10,
    fontSize: 12,
    color: '#ff6f00',
    fontWeight: '600',
  },
});

export default CategorySelectionScreen;


