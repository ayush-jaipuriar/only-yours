import React, { useContext, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import { VelvetPrimaryButton, VelvetSecondaryButton, VelvetTextField } from '../components/velvet';
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
      <Text style={styles.eyebrow}>Begin Your Ritual</Text>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Create a private space for the two of you to grow, play, and reconnect.</Text>

      <View style={styles.formStack}>
        <VelvetTextField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          autoComplete="username-new"
          accessibilityLabel="Username"
          accessibilityHint="Choose the username that will appear in your profile."
          returnKeyType="next"
        />
        <VelvetTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Email"
          accessibilityHint="Enter the email address for your account."
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <VelvetTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete="password-new"
          accessibilityLabel="Password"
          accessibilityHint="Create a password with at least 8 characters."
          textContentType="newPassword"
          returnKeyType="next"
        />
        <VelvetTextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
          autoComplete="password-new"
          accessibilityLabel="Confirm password"
          accessibilityHint="Re-enter your password to confirm it."
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

      <VelvetPrimaryButton
        label="Create Account"
        onPress={handleSignUp}
        loading={isSubmitting}
        style={styles.primaryAction}
        accessibilityLabel={isSubmitting ? 'Creating account' : 'Create account'}
        accessibilityHint="Creates your account and signs you in."
      />

      <Text style={styles.supportText}>Already have an account? Sign back in instead.</Text>
      <VelvetSecondaryButton
        label="Back to Sign In"
        onPress={() => navigation.navigate('SignIn')}
        style={styles.secondaryAction}
        accessibilityLabel="Back to sign in"
        accessibilityHint="Opens the sign in screen."
      />
      <Text style={styles.subtleMeta}>
        We only ask for what we need to create your private shared space.
      </Text>
    </AuthFormScreenLayout>
  );
};

export default SignUpScreen;
