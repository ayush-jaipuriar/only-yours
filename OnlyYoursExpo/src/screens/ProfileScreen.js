import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

/**
 * ProfileScreen — displays the current user's profile and logout option.
 *
 * Sprint 6: Replaced inline ActivityIndicator with reusable LoadingSpinner.
 * Added EmptyState for when the profile fails to load.
 */
const ProfileScreen = () => {
  const { logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get('/user/me');
      setProfile(res.data);
    } catch (e) {
      console.error('Error loading profile:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (loadError || !profile) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't Load Profile"
        message="Something went wrong. Please check your connection."
        actionLabel="Retry"
        onAction={fetchProfile}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarInitial}>
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>

      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  email: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 32,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#e53935',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  logoutText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
