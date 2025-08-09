import React, { useEffect } from 'react';
import { AuthProvider } from './src/state/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '216762620268-7cqrrmkujnqat14tsusuhokhjoqeqlme.apps.googleusercontent.com',
    });
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App; 