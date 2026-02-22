import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../state/AuthContext';

const SignInScreen = ({ navigation }) => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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
        <View style={styles.container}>
            <Text style={styles.title}>Only Yours</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
            />
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
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
        fontSize: 32,
        fontWeight: '700',
        color: '#2D225A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B5FA8',
        textAlign: 'center',
        marginBottom: 28,
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
});

export default SignInScreen; 