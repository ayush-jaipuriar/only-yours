import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { AuthContext } from '../AuthContext';

describe('OnboardingScreen flow', () => {
  it('marks onboarding started on mount and completes on final step', async () => {
    const startOnboarding = jest.fn(() => Promise.resolve());
    const completeOnboarding = jest.fn(() => Promise.resolve());
    const navigation = { replace: jest.fn() };

    const { getByText } = render(
      <AuthContext.Provider
        value={{
          startOnboarding,
          completeOnboarding,
        }}
      >
        <OnboardingScreen navigation={navigation} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(startOnboarding).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Get Started'));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledTimes(1);
      expect(navigation.replace).toHaveBeenCalledWith('Dashboard');
    });
  });
});
