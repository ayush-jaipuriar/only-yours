import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import { HapticsProvider } from '../../haptics';
import WebSocketService from '../../services/WebSocketService';

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback) => {
      React.useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

const ReactNative = require('react-native');
ReactNative.Alert = {
  alert: jest.fn(),
};

const CategorySelectionScreen = require('../CategorySelectionScreen').default;
const api = require('../../services/api').default;
describe('CategorySelectionScreen custom deck flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    WebSocketService.isConnected.mockReturnValue(true);
    WebSocketService.sendMessage.mockReturnValue(true);
  });

  const renderScreen = (summary, navigationOverrides = {}) => {
    api.get.mockImplementation((url) => {
      if (url === '/content/categories') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Warm Up', description: 'Standard deck', sensitive: false },
          ],
        });
      }
      if (url === '/custom-questions/summary') {
        return Promise.resolve({ data: summary });
      }
      return Promise.resolve({ data: {} });
    });

    const navigation = {
      navigate: jest.fn(),
      ...navigationOverrides,
    };

    const utils = render(
      <ThemeProvider>
        <HapticsProvider>
          <CategorySelectionScreen navigation={navigation} />
        </HapticsProvider>
      </ThemeProvider>
    );

    return { ...utils, navigation };
  };

  it('sends a custom deck invitation when the deck is playable', async () => {
    const { getByText, getByLabelText } = renderScreen({
      deckName: 'Custom Couple Questions',
      deckDescription: 'Play your private deck.',
      playable: true,
      questionsNeededToPlay: 0,
    });

    await waitFor(() => {
      expect(getByText('Custom Couple Questions')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Play Custom Deck'));

    expect(WebSocketService.sendMessage).toHaveBeenCalledWith('/app/game.invite', {
      deckType: 'CUSTOM_COUPLE',
    });
  });

  it('shows deck-building guidance when the custom deck is not ready', async () => {
    const { getByText } = renderScreen({
      deckName: 'Custom Couple Questions',
      deckDescription: 'Play your private deck.',
      playable: false,
      questionsNeededToPlay: 3,
    });

    await waitFor(() => {
      expect(getByText('Custom Couple Questions')).toBeTruthy();
    });

    expect(getByText(/Add 3 more questions to unlock play\./)).toBeTruthy();
    expect(getByText('Build your private deck')).toBeTruthy();
  });
});
