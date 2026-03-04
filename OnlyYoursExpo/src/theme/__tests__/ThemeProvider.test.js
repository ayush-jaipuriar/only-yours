import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import * as ReactNative from 'react-native';
import { renderHook, act } from '@testing-library/react-hooks/native';
import { ThemeProvider, useTheme } from '../ThemeProvider';

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider', () => {
  let colorSchemeSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  });

  afterEach(() => {
    colorSchemeSpy.mockRestore();
  });

  const flushProviderEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('defaults to system mode and resolves to light', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flushProviderEffects();

    expect(result.current.themeMode).toBe('system');
    expect(result.current.resolvedMode).toBe('light');
    expect(result.current.isHydrated).toBe(true);
  });

  it('persists explicit theme mode updates', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flushProviderEffects();

    await act(async () => {
      await result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_preference_v1', 'dark');
  });

  it('hydrates stored preference from AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('dark');

    const { result } = renderHook(() => useTheme(), { wrapper });
    await flushProviderEffects();

    expect(result.current.themeMode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
  });
});
