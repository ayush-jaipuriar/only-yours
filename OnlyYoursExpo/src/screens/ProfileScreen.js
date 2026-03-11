import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import BadgeChip from '../components/BadgeChip';
import useTheme from '../theme/useTheme';
import { accessibilityAlertProps } from '../accessibility';

/**
 * ProfileScreen — displays the current user's profile and logout option.
 *
 * Sprint 6: Replaced inline ActivityIndicator with reusable LoadingSpinner.
 * Added EmptyState for when the profile fails to load.
 */
// eslint-disable-next-line react/prop-types
const ProfileScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
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
        card: {
          width: '100%',
          maxWidth: 700,
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
        },
        avatarContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          ...theme.shadows.button,
          shadowColor: theme.colors.primary,
        },
        avatarInitial: {
          fontSize: 36,
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
          marginBottom: 20,
        },
        divider: {
          width: '100%',
          height: 1,
          backgroundColor: theme.colors.border,
          marginBottom: 20,
        },
        badgesSection: {
          width: '100%',
          marginBottom: 20,
        },
        badgesTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 10,
        },
        emptyBadgesText: {
          fontSize: 13,
          color: theme.colors.textSecondary,
        },
        profileFormSection: {
          width: '100%',
          marginBottom: 20,
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
          borderRadius: 10,
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
          marginBottom: 4,
        },
        actionsRow: {
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 6,
        },
        settingsButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
        },
        settingsText: {
          color: theme.colors.primary,
          fontSize: 15,
          fontWeight: '600',
        },
        editButton: {
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
        editText: {
          color: theme.colors.primaryContrast,
          fontSize: 15,
          fontWeight: '700',
        },
        saveButton: {
          borderWidth: 1,
          borderColor: theme.colors.success,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
          backgroundColor: theme.colors.success,
          opacity: isSavingProfile ? 0.65 : 1,
        },
        saveText: {
          color: theme.colors.textOnEmphasis,
          fontSize: 15,
          fontWeight: '700',
        },
        cancelButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 25,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginHorizontal: 6,
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceMuted,
        },
        cancelText: {
          color: theme.colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
        },
        logoutButton: {
          borderWidth: 1.5,
          borderColor: theme.colors.danger,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 25,
          marginHorizontal: 6,
          marginBottom: 10,
        },
        logoutText: {
          color: theme.colors.danger,
          fontSize: 16,
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
      const [profileResponse, badgeResponse] = await Promise.all([
        api.get('/user/me'),
        api.get('/game/badges').catch(() => ({ data: { badges: [] } })),
      ]);
      const nextProfile = profileResponse.data;
      setProfile(nextProfile);
      setProfileDraft({
        username: nextProfile.username || '',
        bio: nextProfile.bio || '',
      });
      setProfileFormError('');
      setBadges(badgeResponse?.data?.badges || []);
    } catch (e) {
      console.error('Error loading profile:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const validateProfileDraft = () => {
    const username = profileDraft.username.trim().toLowerCase();
    if (!username) {
      return 'Username is required.';
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return 'Username must be 3-20 chars and use only letters, numbers, or _.';
    }
    if (profileDraft.bio.trim().length > 280) {
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
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      setProfileFormError(serverMessage || 'Unable to save profile right now.');
    } finally {
      setIsSavingProfile(false);
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarContainer} accessible={false}>
          <Text style={styles.avatarInitial}>
            {(profile.username || profile.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name} accessibilityRole="header">{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.username}>@{profile.username || 'username'}</Text>
        {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

        <View style={styles.divider} />

        {isEditingProfile && (
          <View style={styles.profileFormSection}>
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
              accessibilityHint="Edit your public username."
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
              accessibilityHint="Add a short profile bio."
            />
            {profileFormError ? <Text style={styles.formError} {...accessibilityAlertProps}>{profileFormError}</Text> : null}
          </View>
        )}

        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>Your Badges</Text>
          {badges.length ? (
            badges.map((badge) => <BadgeChip key={badge.code} badge={badge} />)
          ) : (
            <Text style={styles.emptyBadgesText}>No badges yet. Keep playing to unlock milestones.</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          {isEditingProfile ? (
            <>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel={isSavingProfile ? 'Saving profile' : 'Save profile'}
                accessibilityState={{ disabled: isSavingProfile }}
              >
                <Text style={styles.saveText}>{isSavingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelProfileEdit}
                activeOpacity={0.8}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Cancel profile editing"
                accessibilityState={{ disabled: isSavingProfile }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditingProfile(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
