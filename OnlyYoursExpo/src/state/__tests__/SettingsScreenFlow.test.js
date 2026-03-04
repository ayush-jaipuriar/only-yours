import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import SettingsScreen from '../../screens/SettingsScreen';
import { AuthContext } from '../AuthContext';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

const api = require('../../services/api').default;

describe('SettingsScreen flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.put.mockResolvedValue({
      data: {
        timezone: 'UTC',
        reminderTimeLocal: '21:00',
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
      },
    });
    api.post.mockResolvedValue({
      data: {
        requiresConfirmation: true,
        confirmationToken: 'UNLINK_CONFIRM',
      },
    });
    api.get.mockImplementation((url) => {
      if (url === '/user/preferences') {
        return Promise.resolve({
          data: {
            timezone: 'UTC',
            reminderTimeLocal: '21:00',
            quietHoursStart: '23:00',
            quietHoursEnd: '07:00',
          },
        });
      }
      if (url === '/couple/status') {
        return Promise.resolve({
          data: {
            status: 'LINKED',
            linked: true,
            canRecoverWithPreviousPartner: false,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('replays onboarding and redirects to onboarding screen', async () => {
    const replayOnboarding = jest.fn(() => Promise.resolve());
    const navigation = { replace: jest.fn() };

    const { getByText } = render(
      <ThemeProvider>
        <AuthContext.Provider value={{ replayOnboarding }}>
          <SettingsScreen navigation={navigation} />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    fireEvent.press(getByText('Replay Onboarding'));

    await waitFor(() => {
      expect(replayOnboarding).toHaveBeenCalledTimes(1);
      expect(navigation.replace).toHaveBeenCalledWith('Onboarding');
    });
  });

  it('prepares two-step unlink flow from linked status', async () => {
    const navigation = { replace: jest.fn() };

    const { getByText } = render(
      <ThemeProvider>
        <AuthContext.Provider value={{ replayOnboarding: jest.fn(() => Promise.resolve()) }}>
          <SettingsScreen navigation={navigation} />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Status: LINKED')).toBeTruthy();
    });

    fireEvent.press(getByText('Unlink Partner'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/couple/unlink', {});
      expect(getByText('Final Confirmation')).toBeTruthy();
      expect(getByText('Confirm Unlink')).toBeTruthy();
    });
  });

  it('saves notification preferences through backend contract', async () => {
    const navigation = { replace: jest.fn() };

    const { getByDisplayValue, getByText } = render(
      <ThemeProvider>
        <AuthContext.Provider value={{ replayOnboarding: jest.fn(() => Promise.resolve()) }}>
          <SettingsScreen navigation={navigation} />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByDisplayValue('UTC')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('21:00'), '20:45');
    fireEvent.press(getByText('Save Preferences'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/user/preferences', {
        timezone: 'UTC',
        reminderTimeLocal: '20:45',
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
      });
      expect(getByText('Notification preferences saved.')).toBeTruthy();
    });
  });
});
