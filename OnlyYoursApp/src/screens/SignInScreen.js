import React, { useContext, useEffect } from 'react';
import { View, Button } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../state/AuthContext';

const SignInScreen = () => {
    const { login } = useContext(AuthContext);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '216762620268-icv2u3cadj3u6jhji9pnnsvcdp03m66f.apps.googleusercontent.com',
        });
    }, []);

    const signIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken } = await GoogleSignin.signIn();
            
            // Note: Replace with your actual backend URL
            const response = await axios.post('http://localhost:8080/api/auth/google/signin', { idToken });
            
            const { token } = response.data;
            await AsyncStorage.setItem('userToken', token);
            
            // The login function in AuthContext should be updated to handle user data
            login(); 
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Button title="Sign in with Google" onPress={signIn} />
        </View>
    );
};

export default SignInScreen; 