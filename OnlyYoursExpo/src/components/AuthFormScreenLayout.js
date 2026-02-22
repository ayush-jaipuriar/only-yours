import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_FORM_WIDTH = 560;

// eslint-disable-next-line react/prop-types
const AuthFormScreenLayout = ({ children }) => {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 900 ? 32 : 20;
  const formWidth = Math.min(width - horizontalPadding * 2, MAX_FORM_WIDTH);

  return (
    <SafeAreaView style={styles.safeArea}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F5FF',
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
  },
});

export default AuthFormScreenLayout;
