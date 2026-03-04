import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import { ThemeProvider } from '../../theme';
import { AuthContext } from '../AuthContext';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const api = require('../../services/api').default;

describe('ProfileScreen flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/user/me') {
        return Promise.resolve({
          data: {
            id: 'user-1',
            name: 'Phase User',
            email: 'phase@test.com',
            username: 'phase_user',
            bio: 'Initial bio',
          },
        });
      }
      if (url === '/game/badges') {
        return Promise.resolve({ data: { badges: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    api.put.mockResolvedValue({
      data: {
        id: 'user-1',
        name: 'Phase User',
        email: 'phase@test.com',
        username: 'updated_user',
        bio: 'Updated bio',
      },
    });
  });

  it('edits and saves username + bio through backend profile endpoint', async () => {
    const navigation = { navigate: jest.fn() };
    const logout = jest.fn();

    const { getByText, getByDisplayValue } = render(
      <ThemeProvider>
        <AuthContext.Provider value={{ logout }}>
          <ProfileScreen navigation={navigation} />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('@phase_user')).toBeTruthy();
    });

    fireEvent.press(getByText('Edit Profile'));
    fireEvent.changeText(getByDisplayValue('phase_user'), 'updated_user');
    fireEvent.changeText(getByDisplayValue('Initial bio'), 'Updated bio');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/user/profile', {
        username: 'updated_user',
        bio: 'Updated bio',
      });
      expect(getByText('@updated_user')).toBeTruthy();
      expect(getByText('Updated bio')).toBeTruthy();
    });
  });
});
