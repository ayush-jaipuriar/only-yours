import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../state/AuthContext';
import useTheme from '../theme/useTheme';
import api from '../services/api';

/* eslint-disable react/prop-types */

const THEME_OPTION_LABEL = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, setThemeMode, resolvedMode } = useTheme();
  const { replayOnboarding } = useAuth();
  const [isReplayingOnboarding, setIsReplayingOnboarding] = useState(false);
  const [preferencesDraft, setPreferencesDraft] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    reminderTimeLocal: '21:00',
    quietHoursStart: '23:00',
    quietHoursEnd: '07:00',
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  const [coupleStatus, setCoupleStatus] = useState(null);
  const [isLoadingCoupleStatus, setIsLoadingCoupleStatus] = useState(true);
  const [isPreparingUnlink, setIsPreparingUnlink] = useState(false);
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const [unlinkConfirmToken, setUnlinkConfirmToken] = useState('');
  const [unlinkReason, setUnlinkReason] = useState('');
  const [unlinkFlowOpen, setUnlinkFlowOpen] = useState(false);
  const [unlinkError, setUnlinkError] = useState('');
  const [isRecoveringCouple, setIsRecoveringCouple] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexGrow: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 20,
        },
        card: {
          width: '100%',
          maxWidth: 720,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: 16,
          marginBottom: 14,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 8,
        },
        sectionSubtitle: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
        },
        optionsRow: {
          marginTop: 12,
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        option: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.pill,
          paddingVertical: 8,
          paddingHorizontal: 14,
          marginRight: 8,
          marginBottom: 8,
        },
        optionActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        optionText: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
        optionTextActive: {
          color: theme.colors.primaryContrast,
        },
        hint: {
          marginTop: 8,
          color: theme.colors.textTertiary,
          fontSize: 13,
        },
        inputLabel: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          marginTop: 12,
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
        },
        saveButton: {
          marginTop: 14,
          borderRadius: 12,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          paddingVertical: 12,
          opacity: isSavingPreferences ? 0.7 : 1,
        },
        saveButtonText: {
          color: theme.colors.primaryContrast,
          fontWeight: '700',
          fontSize: 15,
        },
        infoText: {
          marginTop: 8,
          color: theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
        errorText: {
          marginTop: 8,
          color: theme.colors.danger,
          fontSize: 13,
        },
        successText: {
          marginTop: 8,
          color: theme.colors.success,
          fontSize: 13,
        },
        statusBadge: {
          marginTop: 12,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 6,
          paddingHorizontal: 12,
          alignSelf: 'flex-start',
        },
        statusBadgeText: {
          color: theme.colors.textPrimary,
          fontSize: 12,
          fontWeight: '700',
        },
        dangerButton: {
          marginTop: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.danger,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: isPreparingUnlink || isConfirmingUnlink ? 0.7 : 1,
        },
        dangerButtonText: {
          color: theme.colors.danger,
          fontSize: 15,
          fontWeight: '700',
        },
        recoverButton: {
          marginTop: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: isRecoveringCouple ? 0.7 : 1,
        },
        recoverButtonText: {
          color: theme.colors.primary,
          fontWeight: '700',
          fontSize: 15,
        },
        unlinkConfirmPanel: {
          marginTop: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
          padding: 12,
        },
        unlinkConfirmTitle: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '700',
          marginBottom: 6,
        },
        unlinkConfirmText: {
          color: theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
        unlinkActionRow: {
          marginTop: 10,
          flexDirection: 'row',
        },
        unlinkActionButton: {
          flex: 1,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: 'center',
        },
        unlinkCancelButton: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginRight: 6,
        },
        unlinkCancelText: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
        unlinkConfirmButton: {
          backgroundColor: theme.colors.danger,
          marginLeft: 6,
        },
        unlinkConfirmButtonText: {
          color: theme.colors.textOnEmphasis,
          fontSize: 14,
          fontWeight: '700',
        },
        replayButton: {
          marginTop: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: isReplayingOnboarding ? 0.65 : 1,
        },
        replayButtonText: {
          color: theme.colors.primary,
          fontSize: 15,
          fontWeight: '700',
        },
      }),
    [
      isConfirmingUnlink,
      isLoadingCoupleStatus,
      isPreparingUnlink,
      isRecoveringCouple,
      isReplayingOnboarding,
      isSavingPreferences,
      theme,
    ]
  );

  const themeModes = ['system', 'light', 'dark'];
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const [preferencesResponse, statusResponse] = await Promise.all([
          api.get('/user/preferences'),
          api.get('/couple/status'),
        ]);
        if (!isMounted) {
          return;
        }
        setPreferencesDraft({
          timezone: preferencesResponse?.data?.timezone || 'UTC',
          reminderTimeLocal: preferencesResponse?.data?.reminderTimeLocal || '21:00',
          quietHoursStart: preferencesResponse?.data?.quietHoursStart || '23:00',
          quietHoursEnd: preferencesResponse?.data?.quietHoursEnd || '07:00',
        });
        setCoupleStatus(statusResponse?.data || null);
      } catch (error) {
        if (isMounted) {
          setPreferencesError('Unable to load latest settings. You can still retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingCoupleStatus(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCooldownTime = (cooldownEndsAt) => {
    if (!cooldownEndsAt) {
      return 'Unavailable';
    }
    const target = new Date(cooldownEndsAt);
    if (Number.isNaN(target.getTime())) {
      return 'Unavailable';
    }
    return target.toLocaleString();
  };

  const validatePreferences = () => {
    if (!preferencesDraft.timezone.trim()) {
      return 'Timezone is required.';
    }
    if (!timeRegex.test(preferencesDraft.reminderTimeLocal.trim())) {
      return 'Reminder time must be HH:mm (24-hour).';
    }
    if (!timeRegex.test(preferencesDraft.quietHoursStart.trim())) {
      return 'Quiet-hours start must be HH:mm (24-hour).';
    }
    if (!timeRegex.test(preferencesDraft.quietHoursEnd.trim())) {
      return 'Quiet-hours end must be HH:mm (24-hour).';
    }
    return null;
  };

  const handleSavePreferences = async () => {
    const validationError = validatePreferences();
    if (validationError) {
      setPreferencesError(validationError);
      setPreferencesMessage('');
      return;
    }

    setIsSavingPreferences(true);
    setPreferencesError('');
    setPreferencesMessage('');
    try {
      const response = await api.put('/user/preferences', {
        timezone: preferencesDraft.timezone.trim(),
        reminderTimeLocal: preferencesDraft.reminderTimeLocal.trim(),
        quietHoursStart: preferencesDraft.quietHoursStart.trim(),
        quietHoursEnd: preferencesDraft.quietHoursEnd.trim(),
      });
      setPreferencesDraft(response.data);
      setPreferencesMessage('Notification preferences saved.');
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error;
      setPreferencesError(message || 'Unable to save preferences right now.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const beginUnlinkFlow = async () => {
    setUnlinkError('');
    setIsPreparingUnlink(true);
    try {
      const response = await api.post('/couple/unlink', {});
      setUnlinkConfirmToken(response?.data?.confirmationToken || 'UNLINK_CONFIRM');
      setUnlinkFlowOpen(true);
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error;
      setUnlinkError(message || 'Unable to prepare unlink flow.');
    } finally {
      setIsPreparingUnlink(false);
    }
  };

  const confirmUnlink = async () => {
    setUnlinkError('');
    setIsConfirmingUnlink(true);
    try {
      const response = await api.post('/couple/unlink', {
        confirmationToken: unlinkConfirmToken || 'UNLINK_CONFIRM',
        reason: unlinkReason.trim() || undefined,
      });
      setCoupleStatus(response.data);
      setUnlinkFlowOpen(false);
      setUnlinkReason('');
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error;
      setUnlinkError(message || 'Unable to unlink right now.');
    } finally {
      setIsConfirmingUnlink(false);
    }
  };

  const recoverCouple = async () => {
    setUnlinkError('');
    setIsRecoveringCouple(true);
    try {
      const response = await api.post('/couple/recover');
      setCoupleStatus(response.data);
      setUnlinkFlowOpen(false);
      setUnlinkReason('');
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error;
      setUnlinkError(message || 'Unable to recover this relationship right now.');
    } finally {
      setIsRecoveringCouple(false);
    }
  };

  const handleReplayOnboarding = async () => {
    try {
      setIsReplayingOnboarding(true);
      await replayOnboarding();
      navigation.replace('Onboarding');
    } finally {
      setIsReplayingOnboarding(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <Text style={styles.sectionSubtitle}>
          Choose how the app appearance behaves. Current resolved mode: {resolvedMode}.
        </Text>

        <View style={styles.optionsRow}>
          {themeModes.map((mode) => {
            const isActive = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => setThemeMode(mode)}
              >
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {THEME_OPTION_LABEL[mode]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          System follows your OS setting. Light and dark lock the app to that mode.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionSubtitle}>
          Configure your reminder window and quiet-hours boundaries.
        </Text>

        <Text style={styles.inputLabel}>Timezone (IANA)</Text>
        <TextInput
          value={preferencesDraft.timezone}
          onChangeText={(value) =>
            setPreferencesDraft((prev) => ({ ...prev, timezone: value }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="Asia/Kolkata"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <Text style={styles.inputLabel}>Reminder Time (HH:mm)</Text>
        <TextInput
          value={preferencesDraft.reminderTimeLocal}
          onChangeText={(value) =>
            setPreferencesDraft((prev) => ({ ...prev, reminderTimeLocal: value }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="21:00"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <Text style={styles.inputLabel}>Quiet-Hours Start (HH:mm)</Text>
        <TextInput
          value={preferencesDraft.quietHoursStart}
          onChangeText={(value) =>
            setPreferencesDraft((prev) => ({ ...prev, quietHoursStart: value }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="23:00"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <Text style={styles.inputLabel}>Quiet-Hours End (HH:mm)</Text>
        <TextInput
          value={preferencesDraft.quietHoursEnd}
          onChangeText={(value) =>
            setPreferencesDraft((prev) => ({ ...prev, quietHoursEnd: value }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="07:00"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePreferences}
          disabled={isSavingPreferences}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
          </Text>
        </TouchableOpacity>
        {preferencesError ? <Text style={styles.errorText}>{preferencesError}</Text> : null}
        {preferencesMessage ? <Text style={styles.successText}>{preferencesMessage}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Relationship Controls</Text>
        <Text style={styles.sectionSubtitle}>
          Manage unlink and cooldown recovery safely from one place.
        </Text>

        {isLoadingCoupleStatus ? (
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.infoText, { marginTop: 0, marginLeft: 8 }]}>
              Loading relationship status...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                Status: {coupleStatus?.status || 'UNKNOWN'}
              </Text>
            </View>

            {coupleStatus?.status === 'LINKED' ? (
              <>
                <Text style={styles.infoText}>
                  You are linked. Unlinking starts a 24-hour cooldown before unrestricted relinking.
                </Text>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={beginUnlinkFlow}
                  disabled={isPreparingUnlink || isConfirmingUnlink}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dangerButtonText}>
                    {isPreparingUnlink ? 'Preparing...' : 'Unlink Partner'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {coupleStatus?.status === 'COOLDOWN_ACTIVE' ? (
              <>
                <Text style={styles.infoText}>
                  Cooldown active until {formatCooldownTime(coupleStatus.cooldownEndsAt)}.
                </Text>
                <TouchableOpacity
                  style={styles.recoverButton}
                  onPress={recoverCouple}
                  disabled={isRecoveringCouple}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recoverButtonText}>
                    {isRecoveringCouple ? 'Recovering...' : 'Recover Previous Partner'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {coupleStatus?.status === 'READY_TO_LINK' ? (
              <Text style={styles.infoText}>
                No active relationship is linked right now.
              </Text>
            ) : null}
          </>
        )}

        {unlinkFlowOpen && (
          <View style={styles.unlinkConfirmPanel}>
            <Text style={styles.unlinkConfirmTitle}>Final Confirmation</Text>
            <Text style={styles.unlinkConfirmText}>
              This action unlinks your partner and starts a 24-hour cooldown.
            </Text>
            <TextInput
              value={unlinkReason}
              onChangeText={setUnlinkReason}
              style={[styles.input, { marginTop: 10, marginBottom: 0 }]}
              placeholder="Optional reason (visible in internal logs)"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <View style={styles.unlinkActionRow}>
              <TouchableOpacity
                style={[styles.unlinkActionButton, styles.unlinkCancelButton]}
                onPress={() => {
                  setUnlinkFlowOpen(false);
                  setUnlinkReason('');
                  setUnlinkError('');
                }}
                disabled={isConfirmingUnlink}
                activeOpacity={0.8}
              >
                <Text style={styles.unlinkCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unlinkActionButton, styles.unlinkConfirmButton]}
                onPress={confirmUnlink}
                disabled={isConfirmingUnlink}
                activeOpacity={0.8}
              >
                <Text style={styles.unlinkConfirmButtonText}>
                  {isConfirmingUnlink ? 'Unlinking...' : 'Confirm Unlink'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {unlinkError ? <Text style={styles.errorText}>{unlinkError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Onboarding</Text>
        <Text style={styles.sectionSubtitle}>
          Replay onboarding anytime to revisit key game flow concepts.
        </Text>
        <TouchableOpacity
          style={styles.replayButton}
          disabled={isReplayingOnboarding}
          onPress={handleReplayOnboarding}
        >
          <Text style={styles.replayButtonText}>
            {isReplayingOnboarding ? 'Preparing...' : 'Replay Onboarding'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;
