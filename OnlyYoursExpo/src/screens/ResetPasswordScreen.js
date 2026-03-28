import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import { VelvetPrimaryButton, VelvetSecondaryButton, VelvetTextField } from '../components/velvet';
import useTheme from '../theme/useTheme';
import createAuthFormStyles from '../theme/createAuthFormStyles';
import { accessibilityAlertProps } from '../accessibility';

const ResetPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const styles = useMemo(
    () => createAuthFormStyles(theme, { subtitleSize: 15 }),
    [theme]
  );

  const validateForm = () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields.');
      return false;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setSuccessMessage(response?.data?.message || 'Password reset successful.');
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 800);
    } catch (error) {
      const message = error?.response?.data?.message || 'Invalid or expired reset token.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreenLayout>
      <Text style={styles.eyebrow}>Set a New Password</Text>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your reset token and choose a new password you’ll remember.</Text>

      <View style={styles.formStack}>
        <VelvetTextField
          label="Reset Token"
          value={token}
          onChangeText={setToken}
          placeholder="Reset Token"
          autoCapitalize="none"
          autoComplete="off"
          accessibilityLabel="Reset token"
          accessibilityHint="Enter the reset token you received."
          returnKeyType="next"
        />
        <VelvetTextField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          secureTextEntry
          autoComplete="password-new"
          accessibilityLabel="New password"
          accessibilityHint="Enter your new password."
          textContentType="newPassword"
          returnKeyType="next"
        />
        <VelvetTextField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm New Password"
          secureTextEntry
          autoComplete="password-new"
          accessibilityLabel="Confirm new password"
          accessibilityHint="Re-enter your new password to confirm it."
          textContentType="newPassword"
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
        label="Reset Password"
        onPress={handleResetPassword}
        loading={isSubmitting}
        style={styles.primaryAction}
        accessibilityLabel={isSubmitting ? 'Resetting password' : 'Reset password'}
        accessibilityHint="Submits your token and new password."
      />

      <VelvetSecondaryButton
        label="Back to Sign In"
        onPress={() => navigation.navigate('SignIn')}
        style={styles.secondaryAction}
        accessibilityLabel="Back to sign in"
        accessibilityHint="Returns to the sign in screen."
      />
      <Text style={styles.subtleMeta}>
        Use the token from your email, then choose a stronger password for future sign-ins.
      </Text>
    </AuthFormScreenLayout>
  );
};

export default ResetPasswordScreen;
