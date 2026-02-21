import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../SignInScreen';
import { AuthContext } from '../../state/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('SignInScreen', () => {
  const renderScreen = (overrides = {}) => {
    const login = jest.fn();
    const navigation = { navigate: jest.fn(), ...overrides.navigation };

    const result = render(
      <AuthContext.Provider value={{ login }}>
        <SignInScreen navigation={navigation} />
      </AuthContext.Provider>,
    );

    return { ...result, login, navigation };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error when fields are empty', async () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Please enter both email and password.')).toBeTruthy();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits login and calls AuthContext login with response payload', async () => {
    const authPayload = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '1', username: 'alice', email: 'alice@example.com' },
    };
    api.post.mockResolvedValue({ data: authPayload });

    const { getByPlaceholderText, getByText, login } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'Alice@Example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(login).toHaveBeenCalledWith(authPayload);
    });
  });

  it('navigates to SignUp and ForgotPassword', async () => {
    const { getByText, navigation } = renderScreen();

    fireEvent.press(getByText("Don't have an account? Sign Up"));
    fireEvent.press(getByText('Forgot Password?'));

    expect(navigation.navigate).toHaveBeenCalledWith('SignUp');
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
