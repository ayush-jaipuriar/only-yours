import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to request a reset code.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor="#9C94C9"
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleForgotPassword}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
        <Text style={styles.linkText}>Already have a reset token? Reset Password</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </AuthFormScreenLayout>
  );
};

const styles = StyleSheet.create({
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
    color: '#2D225A',
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

export default ForgotPasswordScreen;
