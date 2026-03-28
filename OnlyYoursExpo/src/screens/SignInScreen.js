import React, { useContext, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';
import AuthFormScreenLayout from '../components/AuthFormScreenLayout';
import { VelvetPrimaryButton, VelvetTextField } from '../components/velvet';
import useTheme from '../theme/useTheme';
import createAuthFormStyles from '../theme/createAuthFormStyles';
import { accessibilityAlertProps } from '../accessibility';

const SignInScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const styles = useMemo(
    () => createAuthFormStyles(theme, { titleSize: 32, subtitleMarginBottom: 28 }),
    [theme]
  );

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await login(response.data);
    } catch (error) {
      const message = error?.response?.data?.message || 'Invalid credentials';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreenLayout>
      <Text style={styles.eyebrow}>Private Shared Space</Text>
      <Text style={styles.title}>Only Yours</Text>
      <Text style={styles.subtitle}>Return to your shared world and pick up where you left off.</Text>

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
          autoComplete="password"
          accessibilityLabel="Password"
          accessibilityHint="Enter your account password."
          textContentType="password"
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
        label="Sign In"
        onPress={handleSignIn}
        loading={isSubmitting}
        style={styles.primaryAction}
        accessibilityLabel={isSubmitting ? 'Signing in' : 'Sign in'}
        accessibilityHint="Signs in with your email and password."
      />

      <View style={styles.linkCluster}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          accessibilityHint="Opens the password reset request screen."
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Text style={styles.supportText}>
          New here?{' '}
          <Text
            style={styles.supportLinkInline}
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
            accessibilityHint="Opens the sign up screen."
          >
            Create your account
          </Text>
        </Text>
        <Text style={styles.subtleMeta}>
          Your connection, progress, and shared rituals stay private to your couple space.
        </Text>
      </View>
    </AuthFormScreenLayout>
  );
};

export default SignInScreen;
