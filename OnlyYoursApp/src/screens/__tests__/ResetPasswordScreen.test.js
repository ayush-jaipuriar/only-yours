import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ResetPasswordScreen from '../ResetPasswordScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('submits token and new password, then navigates to sign-in', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password reset successful.' } });

    const navigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getAllByText } = render(
      <ResetPasswordScreen navigation={navigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Reset Token'), 'reset-token-123');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpassword123');
    fireEvent.changeText(getByPlaceholderText('Confirm New Password'), 'newpassword123');
    fireEvent.press(getAllByText('Reset Password')[1]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token-123',
        newPassword: 'newpassword123',
      });
      expect(getAllByText('Password reset successful.')[0]).toBeTruthy();
    });

    act(() => {
      jest.runAllTimers();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });
});
