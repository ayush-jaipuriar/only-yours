import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHaptics from 'expo-haptics';
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { HapticsProvider, useHaptics } from '../HapticsProvider';
import { HAPTIC_EVENTS } from '../constants';

const wrapper = ({ children }) => <HapticsProvider>{children}</HapticsProvider>;

describe('HapticsProvider', () => {
  const flushProviderEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to enabled and hydrates local preference state', async () => {
    const { result } = renderHook(() => useHaptics(), { wrapper });
    await flushProviderEffects();

    expect(result.current.isHapticsEnabled).toBe(true);
    expect(result.current.isHydrated).toBe(true);
  });

  it('hydrates stored disabled preference from AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('false');

    const { result } = renderHook(() => useHaptics(), { wrapper });
    await flushProviderEffects();

    expect(result.current.isHapticsEnabled).toBe(false);
  });

  it('persists preference updates', async () => {
    const { result } = renderHook(() => useHaptics(), { wrapper });
    await flushProviderEffects();

    await act(async () => {
      await result.current.setHapticsEnabled(false);
    });

    expect(result.current.isHapticsEnabled).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('haptics_enabled_v1', 'false');
  });

  it('dispatches mapped haptic events when enabled', async () => {
    const { result } = renderHook(() => useHaptics(), { wrapper });
    await flushProviderEffects();

    await act(async () => {
      await result.current.triggerHaptic(HAPTIC_EVENTS.ANSWER_SUBMITTED);
      await result.current.triggerHaptic(HAPTIC_EVENTS.GAME_COMPLETED);
    });

    expect(ExpoHaptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('Success');
  });

  it('no-ops dispatch when disabled', async () => {
    const { result } = renderHook(() => useHaptics(), { wrapper });
    await flushProviderEffects();

    await act(async () => {
      await result.current.setHapticsEnabled(false);
    });

    await act(async () => {
      await result.current.triggerHaptic(HAPTIC_EVENTS.GAME_COMPLETED);
    });

    expect(ExpoHaptics.notificationAsync).not.toHaveBeenCalled();
  });
});
