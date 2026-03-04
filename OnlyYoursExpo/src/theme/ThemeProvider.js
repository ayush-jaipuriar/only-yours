import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './tokens';

const THEME_STORAGE_KEY = 'theme_preference_v1';
const THEME_MODES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

const FALLBACK_CONTEXT = {
  theme: lightTheme,
  themeMode: THEME_MODES.SYSTEM,
  resolvedMode: THEME_MODES.LIGHT,
  setThemeMode: () => Promise.resolve(),
};

const ThemeContext = createContext(FALLBACK_CONTEXT);

const resolveThemeMode = (themeMode, systemColorScheme) => {
  if (themeMode === THEME_MODES.LIGHT) {
    return THEME_MODES.LIGHT;
  }
  if (themeMode === THEME_MODES.DARK) {
    return THEME_MODES.DARK;
  }
  return systemColorScheme === 'dark' ? THEME_MODES.DARK : THEME_MODES.LIGHT;
};

// eslint-disable-next-line react/prop-types
const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState(THEME_MODES.SYSTEM);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!isMounted || !storedMode) {
          return;
        }
        if (Object.values(THEME_MODES).includes(storedMode)) {
          setThemeModeState(storedMode);
        }
      } catch (error) {
        console.warn('[ThemeProvider] Failed to read stored theme preference');
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (nextThemeMode) => {
    if (!Object.values(THEME_MODES).includes(nextThemeMode)) {
      return;
    }
    setThemeModeState(nextThemeMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
    } catch (error) {
      console.warn('[ThemeProvider] Failed to persist theme preference');
    }
  }, []);

  const resolvedMode = resolveThemeMode(themeMode, systemColorScheme);
  const theme = resolvedMode === THEME_MODES.DARK ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      resolvedMode,
      setThemeMode,
      isHydrated,
      themeModes: THEME_MODES,
    }),
    [theme, themeMode, resolvedMode, setThemeMode, isHydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

const useTheme = () => useContext(ThemeContext) || FALLBACK_CONTEXT;

export {
  ThemeProvider,
  useTheme,
  THEME_MODES,
};
