import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import { VelvetPrimaryButton, VelvetSecondaryButton, VelvetTextField } from '../components/velvet';
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
      <Text style={styles.eyebrow}>Recover Access</Text>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email and we’ll help you get back into your private space.</Text>

      <View style={styles.formStack}>
        <VelvetTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Email"
          accessibilityHint="Enter your account email to request a password reset."
          textContentType="emailAddress"
          returnKeyType="done"
        />
      </View>

      {errorMessage ? (
        <View style={[styles.messageCard, styles.messageCardError]}>
          <Text style={[styles.messageText, styles.errorText]} {...accessibilityAlertProps}>
            {errorMessage}
          </Text>
        </View>
      ) : null}
      {successMessage ? (
        <View style={[styles.messageCard, styles.messageCardSuccess]}>
          <Text style={[styles.messageText, styles.successText]} {...accessibilityAlertProps}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      <VelvetPrimaryButton
        label="Send Reset Link"
        onPress={handleForgotPassword}
        loading={isSubmitting}
        style={styles.primaryAction}
        accessibilityLabel={isSubmitting ? 'Sending reset link' : 'Send reset link'}
        accessibilityHint="Requests a password reset email or code for this account."
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('ResetPassword')}
        accessibilityRole="button"
        accessibilityLabel="Reset password with token"
        accessibilityHint="Opens the screen for entering a reset token and new password."
      >
        <Text style={styles.linkText}>Already have a reset token? Reset Password</Text>
      </TouchableOpacity>

      <VelvetSecondaryButton
        label="Back to Sign In"
        onPress={() => navigation.navigate('SignIn')}
        style={styles.secondaryAction}
        accessibilityLabel="Back to sign in"
        accessibilityHint="Returns to the sign in screen."
      />
      <Text style={styles.subtleMeta}>
        We won’t reveal whether an account exists for the address you enter.
      </Text>
    </AuthFormScreenLayout>
  );
};

export default ForgotPasswordScreen;
