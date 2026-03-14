import * as ExpoHaptics from 'expo-haptics';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import { HapticsProvider } from '../../haptics';
import CustomQuestionEditorScreen from '../CustomQuestionEditorScreen';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const api = require('../../services/api').default;

describe('CustomQuestionEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ data: { id: 11 } });
    api.put.mockResolvedValue({ data: { id: 11 } });
  });

  const renderScreen = (route = {}, navigationOverrides = {}) => {
    const navigation = {
      goBack: jest.fn(),
      ...navigationOverrides,
    };

    const utils = render(
      <ThemeProvider>
        <HapticsProvider>
          <CustomQuestionEditorScreen route={route} navigation={navigation} />
        </HapticsProvider>
      </ThemeProvider>
    );

    return { ...utils, navigation };
  };

  it('creates a custom question', async () => {
    const { getByLabelText, getByText, navigation } = renderScreen();

    fireEvent.changeText(getByLabelText('Custom question text'), 'What makes you feel most understood?');
    fireEvent.changeText(getByLabelText('Option A'), 'Listening');
    fireEvent.changeText(getByLabelText('Option B'), 'Touch');
    fireEvent.changeText(getByLabelText('Option C'), 'Time');
    fireEvent.changeText(getByLabelText('Option D'), 'Humor');
    fireEvent.press(getByText('Create Question'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/custom-questions', {
        questionText: 'What makes you feel most understood?',
        optionA: 'Listening',
        optionB: 'Touch',
        optionC: 'Time',
        optionD: 'Humor',
      });
      expect(navigation.goBack).toHaveBeenCalled();
    });
    expect(ExpoHaptics.impactAsync).toHaveBeenCalled();
  });

  it('updates an existing custom question', async () => {
    const route = {
      params: {
        question: {
          id: 22,
          questionText: 'Old prompt',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
        },
      },
    };
    const { getByLabelText, getByText, navigation } = renderScreen(route);

    fireEvent.changeText(getByLabelText('Custom question text'), 'Updated prompt');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/custom-questions/22', {
        questionText: 'Updated prompt',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
      });
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });
});
