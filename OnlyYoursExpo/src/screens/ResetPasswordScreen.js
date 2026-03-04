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
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your reset token and choose a new password.</Text>

      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Reset Token"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm New Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.primaryContrast} />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </AuthFormScreenLayout>
  );
};

export default ResetPasswordScreen;
