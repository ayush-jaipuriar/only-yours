import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits forgot-password and shows generic success message', async () => {
    api.post.mockResolvedValue({
      data: {
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
    });

    const navigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={navigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(
        getByText('If an account with that email exists, a password reset link has been sent.'),
      ).toBeTruthy();
    });
  });
});
