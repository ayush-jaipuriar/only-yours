import React, { useMemo, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import useTheme from '../theme/useTheme';
import createAuthFormStyles from '../theme/createAuthFormStyles';
import { accessibilityAlertProps } from '../accessibility';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const styles = useMemo(
    () => createAuthFormStyles(theme, { subtitleSize: 15 }),
    [theme]
  );

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      const message =
        response?.data?.message ||
        'If an account with that email exists, a password reset link has been sent.';
      setSuccessMessage(message);
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to process request right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreenLayout>
      <Text style={styles.title} accessibilityRole="header">Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to request a reset code.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel="Email"
        accessibilityHint="Enter your account email to request a password reset."
      />

      {errorMessage ? <Text style={styles.errorText} {...accessibilityAlertProps}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText} {...accessibilityAlertProps}>{successMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleForgotPassword}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting ? 'Sending reset link' : 'Send reset link'}
        accessibilityHint="Requests a password reset email or code for this account."
        accessibilityState={{ disabled: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.primaryContrast} />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('ResetPassword')}
        accessibilityRole="button"
        accessibilityLabel="Reset password with token"
        accessibilityHint="Opens the screen for entering a reset token and new password."
      >
        <Text style={styles.linkText}>Already have a reset token? Reset Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        accessibilityHint="Returns to the sign in screen."
      >
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </AuthFormScreenLayout>
  );
};

export default ForgotPasswordScreen;
