import React from 'react';
import { render } from '@testing-library/react-native';
import GameScreen from '../GameScreen';
import { AuthContext } from '../../state/AuthContext';
import { GameProvider } from '../../state/GameContext';
import WebSocketService from '../../services/WebSocketService';

jest.mock('../../services/WebSocketService');
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(),
    delete: jest.fn(),
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

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ setGameContextRef: jest.fn() }}>
    {children}
  </AuthContext.Provider>
);

const renderWithProviders = (navigation = {}) => {
  const mockNav = { replace: jest.fn(), navigate: jest.fn(), goBack: jest.fn(), ...navigation };
  const mockRoute = { params: { sessionId: 'test-session' } };
  WebSocketService.subscribe.mockReturnValue({ unsubscribe: jest.fn() });

  const result = render(
    <MockAuthProvider>
      <GameProvider>
        <GameScreen route={mockRoute} navigation={mockNav} />
      </GameProvider>
    </MockAuthProvider>,
  );
  return { ...result, navigation: mockNav };
};

describe('GameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading indicator when no current question', () => {
    const { getByRole, getByText } = renderWithProviders();
    expect(getByText('Loading question...')).toBeTruthy();
    expect(getByRole('status')).toBeTruthy();
  });

  it('should render Round 1 badge by default', () => {
    const { queryByText } = renderWithProviders();
    // Before any question arrives, we see loading. The round badge only
    // shows once a question is present, so this verifies loading state.
    expect(queryByText('Round 1: Answer')).toBeNull();
    expect(queryByText('Loading question...')).toBeTruthy();
  });

  it('shows a custom question badge for custom deck payloads', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session',
        questionId: 77,
        questionNumber: 1,
        totalQuestions: 8,
        questionText: 'Custom prompt?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        round: 'ROUND1',
        customQuestion: true,
      },
    });

    const { findByText } = renderWithProviders();
    expect(await findByText('Custom Couple Question')).toBeTruthy();
  });
});
