import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../state/AuthContext';
import SignInScreen from '../screens/SignInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PartnerLinkScreen from '../screens/PartnerLinkScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="PartnerLink" component={PartnerLinkScreen} />
            <Stack.Screen name="CategorySelection" component={CategorySelectionScreen} />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 