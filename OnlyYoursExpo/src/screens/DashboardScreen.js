import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../state/AuthContext';
import api from '../services/api';

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
const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load couple status on screen focus.
   * Runs when user navigates back to dashboard.
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCoupleStatus);
    return unsubscribe;
  }, [navigation]);

  /**
   * Fetch couple link status from backend.
   */
  const loadCoupleStatus = async () => {
    try {
      const response = await api.get('/couple');
      setCouple(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        // Not linked yet - expected for new users
        setCouple(null);
      } else {
        console.error('Error loading couple status:', error);
        Alert.alert('Error', 'Failed to load couple status');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Start New Game" button press.
   * Validates couple link before navigating to category selection.
   */
  const handleStartGame = () => {
    if (!couple) {
      Alert.alert(
        'Link Required',
        'Please link with your partner first to play games.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Link Now', onPress: () => navigation.navigate('PartnerLink') }
        ]
      );
      return;
    }
    
    // Navigate to category selection
    navigation.navigate('CategorySelection');
  };

  /**
   * Get partner's name for display.
   * Handles case where current user could be user1 or user2.
   */
  const getPartnerName = () => {
    if (!couple || !user) return 'your partner';
    
    const isUser1 = couple.user1?.id === user.id;
    return isUser1 ? couple.user2?.name : couple.user1?.name;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name}!</Text>

      {couple ? (
        <>
          <Text style={styles.subtitle}>
            Connected with {getPartnerName()}
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartGame}>
            <Text style={styles.buttonText}>Start New Game</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Not linked with a partner yet</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('PartnerLink')}>
            <Text style={styles.buttonText}>Link with Partner</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.tertiaryButton}
        onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.linkText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
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
  tertiaryButton: {
    marginTop: 20,
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


