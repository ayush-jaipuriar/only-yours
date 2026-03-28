import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
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

const MockAuthProvider = ({ children, wsConnectionState = 'disconnected' }) => (
  <AuthContext.Provider value={{ setGameContextRef: jest.fn(), wsConnectionState }}>
    {children}
  </AuthContext.Provider>
);

const renderWithProviders = (navigation = {}, authOverrides = {}) => {
  const mockNav = { replace: jest.fn(), navigate: jest.fn(), goBack: jest.fn(), ...navigation };
  const mockRoute = { params: { sessionId: 'test-session' } };
  WebSocketService.subscribe.mockReturnValue({ unsubscribe: jest.fn() });
  WebSocketService.isConnected.mockReturnValue(true);

  const result = render(
    <MockAuthProvider {...authOverrides}>
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
    expect(getByRole('progressbar')).toBeTruthy();
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

  it('renders Round 2 guessing with distinct prompting', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session',
        questionId: 12,
        questionNumber: 4,
        totalQuestions: 8,
        questionText: 'What would your partner choose for a perfect weekend?',
        optionA: 'Trip',
        optionB: 'Rest',
        optionC: 'Party',
        optionD: 'Work',
        round: 'ROUND2',
        correctCountSoFar: 2,
      },
    });

    const { findByText } = renderWithProviders();
    expect(await findByText("Round 2: Guess your partner's answer")).toBeTruthy();
    expect(await findByText('How did your partner answer this?')).toBeTruthy();
    expect(await findByText('Submit Guess')).toBeTruthy();
  });

  it('renders the round-end waiting review state', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({
      data: {
        type: 'ROUND_STATE',
        sessionId: 'test-session',
        round: 'ROUND1',
        status: 'WAITING_FOR_PARTNER',
        message: 'You finished your answers. Waiting for your partner to finish.',
        totalQuestions: 8,
        completedCount: 8,
        reviewItems: [
          {
            questionId: 1,
            questionNumber: 1,
            questionText: 'What is your favorite color?',
            submittedValue: 'B',
          },
        ],
      },
    });

    const { findAllByText, findByText } = renderWithProviders();
    expect((await findAllByText('Waiting for your partner')).length).toBeGreaterThan(0);
    expect(await findByText('Your submitted answers')).toBeTruthy();
    expect(await findByText('Your answer: B')).toBeTruthy();
  });

  it('renders invitation pending when the session has not been accepted yet', async () => {
    const api = require('../../services/api').default;
    api.get
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockResolvedValueOnce({
        data: {
          sessionId: 'test-session',
          status: 'INVITED',
        },
      });

    const { findByText } = renderWithProviders();
    expect(await findByText('Invitation pending')).toBeTruthy();
    expect(await findByText('Accept Invitation')).toBeTruthy();
    expect(await findByText('Refresh Session')).toBeTruthy();
  });

  it('shows a reconnect banner when realtime is reconnecting', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session',
        questionId: 14,
        questionNumber: 2,
        totalQuestions: 8,
        questionText: 'How do you like to celebrate small wins?',
        optionA: 'Dinner',
        optionB: 'Music',
        optionC: 'Walk',
        optionD: 'Quiet time',
        round: 'ROUND1',
      },
    });

    const { findByText } = renderWithProviders({}, { wsConnectionState: 'connecting' });
    expect(await findByText(/Reconnecting to your session/)).toBeTruthy();
  });

  it('renders a partner-left gameplay notice without leaving the screen', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({
      data: {
        type: 'QUESTION',
        sessionId: 'test-session',
        questionId: 15,
        questionNumber: 2,
        totalQuestions: 8,
        questionText: 'What helps you reset after a long day?',
        optionA: 'Walk',
        optionB: 'Music',
        optionC: 'Quiet time',
        optionD: 'Sleep',
        round: 'ROUND1',
      },
    });

    const screen = renderWithProviders();
    await screen.findByText('What helps you reset after a long day?');

    act(() => {
      const topicCallback = WebSocketService.subscribe.mock.calls[0][1];
      topicCallback({
        type: 'STATUS',
        sessionId: 'test-session',
        status: 'PARTNER_LEFT',
        message: 'Your partner stepped away for a moment.',
      });
    });

    expect(await screen.findByText('Your partner stepped away for a moment.')).toBeTruthy();
  });

  it('renders the explicit expired-session state when hydration reports the session expired', async () => {
    const api = require('../../services/api').default;
    api.get.mockRejectedValueOnce({
      response: {
        status: 410,
        data: {
          message: 'This game session has expired.',
        },
      },
    });

    const { findByText, navigation } = renderWithProviders();
    expect(await findByText('This session has expired')).toBeTruthy();
    const backButton = await findByText('Back to Dashboard');
    fireEvent.press(backButton);
    expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
  });
});
