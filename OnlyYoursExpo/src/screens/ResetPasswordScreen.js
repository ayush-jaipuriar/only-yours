import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

const ResetPasswordScreen = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your reset token and choose a new password.</Text>

      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Reset Token"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm New Password"
        secureTextEntry
        style={styles.input}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F6F5FF',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2D225A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B5FA8',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D3F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#6A4CFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  linkText: {
    textAlign: 'center',
    color: '#5B4CAF',
    marginBottom: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#C6354C',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#2E8B57',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;
