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
import { VelvetAtmosphere, VelvetSurfaceCard } from './velvet';

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
        scrollContent: {
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 24,
          paddingHorizontal: 16,
        },
        formContainer: {
          maxWidth: MAX_FORM_WIDTH,
          borderRadius: theme.radius.xxl + 4,
        },
      }),
    [theme, width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <VelvetAtmosphere variant="auth" />
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
          <VelvetSurfaceCard
            variant="default"
            glow
            accessible={false}
            padding={width >= 900 ? 28 : 22}
            radius={theme.radius.xxl + 4}
            style={[styles.formContainer, { width: formWidth }]}
          >
            {children}
          </VelvetSurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthFormScreenLayout;
