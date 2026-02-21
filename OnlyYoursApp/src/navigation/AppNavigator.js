import React, { useContext, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../state/AuthContext';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PartnerLinkScreen from '../screens/PartnerLinkScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import GameScreen from '../screens/GameScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator();

/**
 * AppNavigator manages navigation between screens.
 * 
 * Sprint 4 Update: 
 * - Added GameScreen with restricted navigation
 * - Wired navigation ref to AuthContext for invitation handling
 */
const AppNavigator = () => {
  const { isLoggedIn, setNavigationRef } = useContext(AuthContext);
  const navigationRef = useRef(null);

  /**
   * Register navigation ref with AuthContext when ready.
   * This allows AuthContext to navigate when invitation is accepted.
   */
  useEffect(() => {
    if (navigationRef.current && setNavigationRef) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Only Yours' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen 
              name="PartnerLink" 
              component={PartnerLinkScreen}
              options={{ title: 'Link with Partner' }}
            />
            <Stack.Screen 
              name="CategorySelection" 
              component={CategorySelectionScreen}
              options={{ title: 'Select Category' }}
            />
            <Stack.Screen 
              name="Game" 
              component={GameScreen}
              options={{
                title: 'Game',
                headerLeft: null,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{
                title: 'Results',
                headerLeft: null,
                gestureEnabled: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: 'Create Account' }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Forgot Password' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 