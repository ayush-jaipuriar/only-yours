import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import { HapticsProvider } from '../../haptics';

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
    delete: jest.fn(),
  },
}));

const ReactNative = require('react-native');
ReactNative.Alert = {
  alert: jest.fn(),
};

const CustomQuestionsScreen = require('../CustomQuestionsScreen').default;
const api = require('../../services/api').default;
describe('CustomQuestionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/custom-questions/mine') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              questionText: 'What helps you feel grounded?',
              optionA: 'Music',
              optionB: 'Walks',
              optionC: 'Quiet',
              optionD: 'Talking',
              updatedAt: Date.now(),
            },
          ],
        });
      }

      if (url === '/custom-questions/summary') {
        return Promise.resolve({
          data: {
            deckName: 'Custom Couple Questions',
            deckDescription: 'Create private questions that become a shared deck.',
            authoredQuestionCount: 1,
            couplePlayableQuestionCount: 5,
            minimumQuestionsRequired: 8,
            questionsNeededToPlay: 3,
            playable: false,
          },
        });
      }

      return Promise.resolve({ data: {} });
    });
    api.delete.mockResolvedValue({ data: { message: 'Custom question deleted.' } });
  });

  const renderScreen = (navigationOverrides = {}) => {
    const navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      ...navigationOverrides,
    };

    const utils = render(
      <ThemeProvider>
        <HapticsProvider>
          <CustomQuestionsScreen navigation={navigation} />
        </HapticsProvider>
      </ThemeProvider>
    );

    return { ...utils, navigation };
  };

  it('loads authored questions and navigates to editor', async () => {
    const { getByText, navigation } = renderScreen();

    await waitFor(() => {
      expect(getByText('Custom Couple Questions')).toBeTruthy();
      expect(getByText('What helps you feel grounded?')).toBeTruthy();
    });

    fireEvent.press(getByText('Add Custom Question'));

    expect(navigation.navigate).toHaveBeenCalledWith('CustomQuestionEditor');
  });

  it('navigates to editor for an existing custom question', async () => {
    const { getByText, navigation } = renderScreen();

    await waitFor(() => {
      expect(getByText('Edit')).toBeTruthy();
    });

    fireEvent.press(getByText('Edit'));

    expect(navigation.navigate).toHaveBeenCalledWith('CustomQuestionEditor', {
      question: expect.objectContaining({
        id: 1,
        questionText: 'What helps you feel grounded?',
      }),
    });
  });
});
