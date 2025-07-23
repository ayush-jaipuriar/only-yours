import React, { useEffect } from 'react';
import { AuthProvider } from './src/state/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'your_web_client_id.apps.googleusercontent.com',
    });
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App; 