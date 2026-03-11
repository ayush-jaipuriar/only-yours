import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../theme/useTheme';

const MAX_FORM_WIDTH = 560;

// eslint-disable-next-line react/prop-types
const AuthFormScreenLayout = ({ children }) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const horizontalPadding = width >= 900 ? 32 : 20;
  const formWidth = Math.min(width - horizontalPadding * 2, MAX_FORM_WIDTH);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        keyboardRoot: {
          flex: 1,
        },
        atmosphere: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.colors.backgroundCanvas,
        },
        atmosphereGlowTop: {
          position: 'absolute',
          top: -120,
          left: -40,
          width: width > 700 ? 320 : 240,
          height: width > 700 ? 320 : 240,
          borderRadius: 999,
          backgroundColor: theme.colors.glowPrimary,
        },
        atmosphereGlowBottom: {
          position: 'absolute',
          right: -60,
          bottom: -120,
          width: width > 700 ? 300 : 220,
          height: width > 700 ? 300 : 220,
          borderRadius: 999,
          backgroundColor: theme.colors.glowAccent,
        },
        scrollContent: {
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 24,
          paddingHorizontal: 16,
        },
        formContainer: {
          maxWidth: MAX_FORM_WIDTH,
          borderRadius: 28,
          padding: width >= 900 ? 28 : 22,
          backgroundColor: theme.colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
          shadowColor: theme.colors.glowPrimary,
        },
      }),
    [theme, width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.atmosphere} pointerEvents="none">
        <View style={styles.atmosphereGlowTop} />
        <View style={styles.atmosphereGlowBottom} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={false}
        >
          <View style={[styles.formContainer, { width: formWidth }]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthFormScreenLayout;
