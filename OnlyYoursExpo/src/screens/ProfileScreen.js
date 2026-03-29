import React, { useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { VelvetBrowseLayout, VelvetSectionCard } from '../components/velvet';
import { HAPTIC_EVENTS, useHaptics } from '../haptics';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import useTheme from '../theme/useTheme';
import { accessibilityAlertProps } from '../accessibility';

/* eslint-disable react/prop-types */

const ProfileScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const { triggerHaptic } = useHaptics();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormError, setProfileFormError] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    username: '',
    bio: '',
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          padding: 24,
          backgroundColor: theme.colors.background,
          paddingBottom: 28,
          flexGrow: 1,
        },
        stateContent: {
          width: '100%',
          minHeight: 360,
        },
        card: {
          width: '100%',
          maxWidth: 620,
          marginBottom: 14,
        },
        identityCard: {
          alignItems: 'center',
        },
        avatarContainer: {
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          ...theme.shadows.button,
          shadowColor: theme.colors.primary,
        },
        avatarInitial: {
          fontSize: 38,
          fontWeight: '700',
          color: theme.colors.primaryContrast,
        },
        name: {
          fontSize: 24,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 6,
        },
        email: {
          fontSize: 15,
          color: theme.colors.textSecondary,
          marginBottom: 4,
        },
        username: {
          fontSize: 14,
          color: theme.colors.textTertiary,
          marginBottom: 10,
        },
        bioText: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        sectionSubtitle: {
          fontSize: 13,
          lineHeight: 19,
          color: theme.colors.textSecondary,
          marginBottom: 14,
        },
        inputLabel: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: 6,
          fontWeight: '600',
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceMuted,
          color: theme.colors.textPrimary,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          marginBottom: 10,
        },
        textArea: {
          minHeight: 88,
          textAlignVertical: 'top',
        },
        formError: {
          color: theme.colors.danger,
          fontSize: 12,
          marginTop: -2,
          marginBottom: 6,
        },
        actionsRow: {
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        },
        primaryButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
          backgroundColor: theme.colors.primary,
          opacity: isSavingProfile ? 0.65 : 1,
        },
        primaryButtonText: {
          color: theme.colors.primaryContrast,
          fontSize: 15,
          fontWeight: '700',
        },
        secondaryButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceMuted,
        },
        secondaryButtonText: {
          color: theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        destructiveButton: {
          borderWidth: 1.5,
          borderColor: theme.colors.danger,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
        },
        destructiveButtonText: {
          color: theme.colors.danger,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [isSavingProfile, theme]
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await api.get('/user/me');
      const nextProfile = response.data;
      setProfile(nextProfile);
      setProfileDraft({
        username: nextProfile.username || '',
        bio: nextProfile.bio || '',
      });
      setProfileFormError('');
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const validateProfileDraft = () => {
    const username = profileDraft.username.trim().toLowerCase();
    if (!username) {
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return 'Username is required.';
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return 'Username must be 3-20 chars and use only letters, numbers, or _.';
    }
    if (profileDraft.bio.trim().length > 280) {
      triggerHaptic(HAPTIC_EVENTS.INVALID_ACTION);
      return 'Bio must be at most 280 characters.';
    }
    return null;
  };

  const handleCancelProfileEdit = () => {
    setProfileDraft({
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
    setProfileFormError('');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    const validationError = validateProfileDraft();
    if (validationError) {
      setProfileFormError(validationError);
      return;
    }

    setIsSavingProfile(true);
    setProfileFormError('');
    try {
      const response = await api.put('/user/profile', {
        username: profileDraft.username.trim().toLowerCase(),
        bio: profileDraft.bio.trim(),
      });
      setProfile(response.data);
      setProfileDraft({
        username: response.data.username || '',
        bio: response.data.bio || '',
      });
      setIsEditingProfile(false);
      triggerHaptic(HAPTIC_EVENTS.PROFILE_SAVED);
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      setProfileFormError(serverMessage || 'Unable to save profile right now.');
      triggerHaptic(HAPTIC_EVENTS.ACTION_ERROR);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <VelvetBrowseLayout
        navigation={navigation}
        activeNavKey="profile"
        contentContainerStyle={styles.container}
        contentMaxWidth={680}
      >
        <View style={styles.stateContent}>
          <LoadingSpinner message="Loading profile..." />
        </View>
      </VelvetBrowseLayout>
    );
  }

  if (loadError || !profile) {
    return (
      <VelvetBrowseLayout
        navigation={navigation}
        activeNavKey="profile"
        contentContainerStyle={styles.container}
        contentMaxWidth={680}
      >
        <View style={styles.stateContent}>
          <EmptyState
            icon="⚠️"
            title="Couldn't Load Profile"
            message="Something went wrong. Please try again."
            actionLabel="Retry"
            onAction={fetchProfile}
          />
        </View>
      </VelvetBrowseLayout>
    );
  }

  return (
    <VelvetBrowseLayout
      navigation={navigation}
      activeNavKey="profile"
      contentContainerStyle={styles.container}
      contentMaxWidth={680}
    >
      <VelvetSectionCard style={[styles.card, styles.identityCard]}>
        <View style={styles.avatarContainer} accessible={false}>
          <Text style={styles.avatarInitial}>
            {(profile.username || profile.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.username}>@{profile.username || 'username'}</Text>
        {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
      </VelvetSectionCard>

      <VelvetSectionCard style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.sectionSubtitle}>
          Update your username and bio, then manage your account settings here.
        </Text>

        {isEditingProfile ? (
          <>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              value={profileDraft.username}
              onChangeText={(value) => setProfileDraft((prev) => ({ ...prev, username: value }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="username"
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel="Username"
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={profileDraft.bio}
              onChangeText={(value) => setProfileDraft((prev) => ({ ...prev, bio: value }))}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
              placeholder="Share a short bio..."
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel="Bio"
            />
            {profileFormError ? (
              <Text style={styles.formError} {...accessibilityAlertProps}>
                {profileFormError}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={styles.actionsRow}>
          {isEditingProfile ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel={isSavingProfile ? 'Saving profile' : 'Save profile'}
                accessibilityState={{ disabled: isSavingProfile }}
              >
                <Text style={styles.primaryButtonText}>{isSavingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCancelProfileEdit}
                activeOpacity={0.8}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Cancel profile editing"
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsEditingProfile(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.destructiveButton}
            onPress={logout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.destructiveButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </VelvetSectionCard>
    </VelvetBrowseLayout>
  );
};

export default ProfileScreen;
