import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '../SignUpScreen';
import { AuthContext } from '../../state/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('SignUpScreen', () => {
  const renderScreen = () => {
    const login = jest.fn();
    const navigation = { navigate: jest.fn() };
    const result = render(
      <AuthContext.Provider value={{ login }}>
        <SignUpScreen navigation={navigation} />
      </AuthContext.Provider>,
    );
    return { ...result, login, navigation };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows mismatch error when passwords differ', async () => {
    const { getByPlaceholderText, getByText, getAllByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'alice');
    fireEvent.changeText(getByPlaceholderText('Email'), 'alice@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'different123');
    fireEvent.press(getAllByText('Create Account')[1]);

    await waitFor(() => {
      expect(getByText('Passwords do not match.')).toBeTruthy();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits registration and auto-logs in', async () => {
    const authPayload = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '1', username: 'alice', email: 'alice@example.com' },
    };
    api.post.mockResolvedValue({ data: authPayload });

    const { getByPlaceholderText, getAllByText, login } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'alice');
    fireEvent.changeText(getByPlaceholderText('Email'), 'Alice@Example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getAllByText('Create Account')[1]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(login).toHaveBeenCalledWith(authPayload);
    });
  });
});
