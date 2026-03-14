import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHaptics from 'expo-haptics';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HapticsProvider } from '../../haptics';
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

jest.mock('../../services/NotificationService', () => ({
  __esModule: true,
  default: {
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastNotificationResponse: jest.fn(() => Promise.resolve(null)),
    mapNotificationResponseToIntent: jest.fn(() => null),
    registerForPushNotifications: jest.fn(() => Promise.resolve(null)),
    sendTokenToBackend: jest.fn(() => Promise.resolve()),
    unregisterToken: jest.fn(() => Promise.resolve()),
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

    const { getByLabelText, getByText } = render(
      <ThemeProvider>
        <HapticsProvider>
          <AuthContext.Provider value={{ replayOnboarding }}>
            <SettingsScreen navigation={navigation} />
          </AuthContext.Provider>
        </HapticsProvider>
      </ThemeProvider>
    );

    fireEvent.press(getByText('Replay Onboarding'));

    await waitFor(() => {
      expect(replayOnboarding).toHaveBeenCalledTimes(1);
      expect(navigation.replace).toHaveBeenCalledWith('Onboarding');
    });
    expect(getByLabelText('Replay onboarding')).toBeTruthy();
  });

  it('prepares two-step unlink flow from linked status', async () => {
    const navigation = { replace: jest.fn() };

    const { getByLabelText, getByText } = render(
      <ThemeProvider>
        <HapticsProvider>
          <AuthContext.Provider value={{ replayOnboarding: jest.fn(() => Promise.resolve()) }}>
            <SettingsScreen navigation={navigation} />
          </AuthContext.Provider>
        </HapticsProvider>
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
    expect(getByLabelText('Unlink partner')).toBeTruthy();
  });

  it('saves notification preferences through backend contract', async () => {
    const navigation = { replace: jest.fn() };

    const { getByLabelText, getByDisplayValue, getByText } = render(
      <ThemeProvider>
        <HapticsProvider>
          <AuthContext.Provider value={{ replayOnboarding: jest.fn(() => Promise.resolve()) }}>
            <SettingsScreen navigation={navigation} />
          </AuthContext.Provider>
        </HapticsProvider>
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
    expect(ExpoHaptics.impactAsync).toHaveBeenCalled();
    expect(getByLabelText('Timezone')).toBeTruthy();
    expect(getByLabelText('Save notification preferences')).toBeTruthy();
  });

  it('persists haptics preference locally from Settings', async () => {
    const navigation = { replace: jest.fn() };

    const { getByText, getByLabelText } = render(
      <ThemeProvider>
        <HapticsProvider>
          <AuthContext.Provider value={{ replayOnboarding: jest.fn(() => Promise.resolve()) }}>
            <SettingsScreen navigation={navigation} />
          </AuthContext.Provider>
        </HapticsProvider>
      </ThemeProvider>
    );

    fireEvent.press(getByText('Off'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('haptics_enabled_v1', 'false');
    });
    expect(getByLabelText('Haptics Off')).toBeTruthy();
  });
});
