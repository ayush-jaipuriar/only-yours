import React, { useContext, useRef, useEffect } from 'react';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../state/AuthContext';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GameHistoryScreen from '../screens/GameHistoryScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PartnerLinkScreen from '../screens/PartnerLinkScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import CustomQuestionsScreen from '../screens/CustomQuestionsScreen';
import CustomQuestionEditorScreen from '../screens/CustomQuestionEditorScreen';
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
  const { isLoggedIn, shouldShowOnboarding, setNavigationRef } = useContext(AuthContext);
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

  useEffect(() => {
    const navigation = navigationRef.current;
    const currentRoute = navigation?.getCurrentRoute?.();

    if (!navigation || !isLoggedIn || !shouldShowOnboarding) {
      return;
    }

    if (!currentRoute || currentRoute.name === 'Onboarding') {
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      })
    );
  }, [isLoggedIn, shouldShowOnboarding]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            {shouldShowOnboarding && (
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ title: 'Welcome', headerShown: false }}
              />
            )}
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="GameHistory"
              component={GameHistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PartnerLink" 
              component={PartnerLinkScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CategorySelection" 
              component={CategorySelectionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CustomQuestions"
              component={CustomQuestionsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CustomQuestionEditor"
              component={CustomQuestionEditorScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Game" 
              component={GameScreen}
              options={{
                headerShown: false,
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
