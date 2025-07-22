import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Placeholder screens will be added here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 