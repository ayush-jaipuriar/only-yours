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
            <Text style={styles.title} accessibilityRole="header">Only Yours</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

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
                textContentType="emailAddress"
            />
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                placeholderTextColor={theme.colors.textTertiary}
                accessibilityLabel="Password"
                accessibilityHint="Enter your account password."
                textContentType="password"
            />

            {errorMessage ? <Text style={styles.errorText} {...accessibilityAlertProps}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={isSubmitting ? 'Signing in' : 'Sign in'}
                accessibilityHint="Signs in with your email and password."
                accessibilityState={{ disabled: isSubmitting }}
            >
                {isSubmitting ? (
                    <ActivityIndicator color={theme.colors.primaryContrast} />
                ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                accessibilityHint="Opens the password reset request screen."
            >
                <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                accessibilityRole="button"
                accessibilityLabel="Create a new account"
                accessibilityHint="Opens the sign up screen."
            >
                <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </AuthFormScreenLayout>
    );
};

export default SignInScreen;
