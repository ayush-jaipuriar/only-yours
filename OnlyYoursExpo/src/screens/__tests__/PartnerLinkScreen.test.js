import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HapticsProvider } from '../../haptics';
import { ThemeProvider } from '../../theme';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  setString: jest.fn(),
}));

const ReactNative = require('react-native');
const Clipboard = require('expo-clipboard');
ReactNative.Alert = {
  alert: jest.fn(),
};
ReactNative.Share = {
  share: jest.fn(),
};

const PartnerLinkScreen = require('../PartnerLinkScreen').default;
const api = require('../../services/api').default;

describe('PartnerLinkScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () => {
    const navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const utils = render(
      <ThemeProvider>
        <HapticsProvider>
          <PartnerLinkScreen navigation={navigation} />
        </HapticsProvider>
      </ThemeProvider>
    );

    return { ...utils, navigation };
  };

  it('generates and renders a partner code', async () => {
    api.post.mockResolvedValueOnce({ data: { code: 'XJ9R4L' } });
    const { getByText, getByLabelText } = renderScreen();

    fireEvent.press(getByLabelText('Generate partner code'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/couple/generate-code');
      expect(getByText('XJ9R4L')).toBeTruthy();
      expect(getByText('Share Code')).toBeTruthy();
    });
  });

  it('shows the connected success state after linking with a valid code', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'linked' } });
    const { getByLabelText, getByText } = renderScreen();

    fireEvent.changeText(getByLabelText('Partner code'), 'ABCD1234');
    fireEvent.press(getByLabelText('Connect with partner code'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/couple/link', { code: 'ABCD1234' });
      expect(getByText("You're connected.")).toBeTruthy();
      expect(getByText('Start First Game')).toBeTruthy();
    });
  });

  it('copies partner code to clipboard when Copy Code is pressed', async () => {
    api.post.mockResolvedValueOnce({ data: { code: 'XJ9R4L' } });
    const { getByLabelText, findByLabelText } = renderScreen();

    fireEvent.press(getByLabelText('Generate partner code'));

    const copyBtn = await findByLabelText('Copy partner code');
    fireEvent.press(copyBtn);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('XJ9R4L');
    });
  });
});
