import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHaptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HAPTIC_EVENT_MAP, HAPTIC_STORAGE_KEY } from './constants';

const IMPACT_STYLE_MAP = {
  light: ExpoHaptics.ImpactFeedbackStyle.Light,
  medium: ExpoHaptics.ImpactFeedbackStyle.Medium,
  heavy: ExpoHaptics.ImpactFeedbackStyle.Heavy,
  soft: ExpoHaptics.ImpactFeedbackStyle.Soft ?? ExpoHaptics.ImpactFeedbackStyle.Light,
  rigid: ExpoHaptics.ImpactFeedbackStyle.Rigid ?? ExpoHaptics.ImpactFeedbackStyle.Medium,
};

const NOTIFICATION_TYPE_MAP = {
  success: ExpoHaptics.NotificationFeedbackType.Success,
  warning: ExpoHaptics.NotificationFeedbackType.Warning,
  error: ExpoHaptics.NotificationFeedbackType.Error,
};

const FALLBACK_CONTEXT = {
  isHapticsEnabled: true,
  isHydrated: false,
  setHapticsEnabled: () => Promise.resolve(),
  triggerHaptic: () => Promise.resolve(false),
};

const HapticsContext = createContext(FALLBACK_CONTEXT);

const playConfiguredHaptic = async (config) => {
  if (!config) {
    return false;
  }

  if (config.kind === 'selection') {
    await ExpoHaptics.selectionAsync();
    return true;
  }

  if (config.kind === 'impact') {
    const impactStyle = IMPACT_STYLE_MAP[config.style] || ExpoHaptics.ImpactFeedbackStyle.Light;
    await ExpoHaptics.impactAsync(impactStyle);
    return true;
  }

  if (config.kind === 'notification') {
    const notificationType =
      NOTIFICATION_TYPE_MAP[config.type] || ExpoHaptics.NotificationFeedbackType.Success;
    await ExpoHaptics.notificationAsync(notificationType);
    return true;
  }

  return false;
};

// eslint-disable-next-line react/prop-types
const HapticsProvider = ({ children }) => {
  const [isHapticsEnabled, setIsHapticsEnabledState] = useState(true);
  const isHydrated = true;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(HAPTIC_STORAGE_KEY);
        if (!isMounted || storedPreference == null) {
          return;
        }
        setIsHapticsEnabledState(storedPreference !== 'false');
      } catch (error) {
        console.warn('[HapticsProvider] Failed to read stored haptics preference');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setHapticsEnabled = useCallback(async (nextEnabled) => {
    const normalized = Boolean(nextEnabled);
    setIsHapticsEnabledState(normalized);
    try {
      await AsyncStorage.setItem(HAPTIC_STORAGE_KEY, String(normalized));
    } catch (error) {
      console.warn('[HapticsProvider] Failed to persist haptics preference');
    }
  }, []);

  const triggerHaptic = useCallback(
    async (eventName) => {
      if (!isHapticsEnabled) {
        return false;
      }

      const config = HAPTIC_EVENT_MAP[eventName];
      if (!config) {
        return false;
      }

      try {
        return await playConfiguredHaptic(config);
      } catch (error) {
        console.warn('[HapticsProvider] Haptic dispatch failed:', error?.message || error);
        return false;
      }
    },
    [isHapticsEnabled]
  );

  const value = useMemo(
    () => ({
      isHapticsEnabled,
      isHydrated,
      setHapticsEnabled,
      triggerHaptic,
    }),
    [isHapticsEnabled, isHydrated, setHapticsEnabled, triggerHaptic]
  );

  return <HapticsContext.Provider value={value}>{children}</HapticsContext.Provider>;
};

const useHaptics = () => useContext(HapticsContext) || FALLBACK_CONTEXT;

export {
  HapticsProvider,
  useHaptics,
};
