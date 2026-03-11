import React, { useContext, useMemo, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import useTheme from '../theme/useTheme';
import createAuthFormStyles from '../theme/createAuthFormStyles';
import { accessibilityAlertProps } from '../accessibility';

const SignUpScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const styles = useMemo(() => createAuthFormStyles(theme), [theme]);

  const validateForm = () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields.');
      return false;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await api.post('/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      await login(response.data);
    } catch (error) {
      const message = error?.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreenLayout>
      <Text style={styles.title} accessibilityRole="header">Create Account</Text>
      <Text style={styles.subtitle}>Join Only Yours</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel="Username"
        accessibilityHint="Choose the username that will appear in your profile."
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel="Email"
        accessibilityHint="Enter the email address for your account."
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel="Password"
        accessibilityHint="Create a password with at least 8 characters."
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel="Confirm password"
        accessibilityHint="Re-enter your password to confirm it."
      />

      {errorMessage ? <Text style={styles.errorText} {...accessibilityAlertProps}>{errorMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting ? 'Creating account' : 'Create account'}
        accessibilityHint="Creates your account and signs you in."
        accessibilityState={{ disabled: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.primaryContrast} />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        accessibilityHint="Opens the sign in screen."
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </AuthFormScreenLayout>
  );
};

export default SignUpScreen;
