import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import ResultsScreen from '../ResultsScreen';
import { AuthContext } from '../../state/AuthContext';
import { GameProvider } from '../../state/GameContext';
import WebSocketService from '../../services/WebSocketService';
import api from '../../services/api';

jest.mock('../../services/WebSocketService');
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockScores = {
  player1Name: 'Alice',
  player1Score: 6,
  player2Name: 'Bob',
  player2Score: 5,
  totalQuestions: 8,
  message: 'Great connection! You really know each other.',
  coupleProgression: {
    scope: 'COUPLE',
    label: 'Alice + Bob',
    xp: 540,
    level: 4,
    xpIntoCurrentLevel: 60,
    xpNeededForNextLevel: 200,
    xpToNextLevel: 140,
    progressPercent: 30,
    currentStreakDays: 2,
    longestStreakDays: 4,
    achievementsUnlocked: 3,
  },
  recentMilestones: [
    {
      type: 'LEVEL_UP',
      scope: 'COUPLE',
      ownerLabel: 'Alice + Bob',
      title: 'Couple Level Up',
      description: 'Your couple reached level 4.',
    },
  ],
};

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ setGameContextRef: jest.fn() }}>
    {children}
  </AuthContext.Provider>
);

const renderResults = (routeParams = { scores: mockScores }, navigation = {}) => {
  const mockNav = { replace: jest.fn(), navigate: jest.fn(), ...navigation };
  const mockRoute = { params: routeParams };
  WebSocketService.subscribe.mockReturnValue({ unsubscribe: jest.fn() });

  const result = render(
    <MockAuthProvider>
      <GameProvider>
        <ResultsScreen route={mockRoute} navigation={mockNav} />
      </GameProvider>
    </MockAuthProvider>,
  );
  return { ...result, navigation: mockNav };
};

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: mockScores });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render both player names', () => {
    const { getByText } = renderResults();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('should render the result message', () => {
    const { getByText } = renderResults();
    expect(getByText('Great connection! You really know each other.')).toBeTruthy();
  });

  it('should render progression highlights when milestones are present', () => {
    const { getByText } = renderResults();
    expect(getByText('Unlocked This Game')).toBeTruthy();
    expect(getByText('Couple Level Up')).toBeTruthy();
  });

  it('should render Game Complete title', () => {
    const { getByText } = renderResults();
    expect(getByText('Game Complete!')).toBeTruthy();
  });

  it('should render combined score', () => {
    const { getByText } = renderResults();
    expect(getByText('Combined: 11/16')).toBeTruthy();
  });

  it('should render Play Again button', () => {
    const { getByText } = renderResults();
    expect(getByText('Play Again')).toBeTruthy();
  });

  it('should render Back to Dashboard button', () => {
    const { getByText } = renderResults();
    expect(getByText('Back to Dashboard')).toBeTruthy();
  });

  it('shares a branded result card', async () => {
    const { getByText } = renderResults();
    fireEvent.press(getByText('Share Result Card'));

    await waitFor(() => {
      expect(captureRef).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
      expect(releaseCapture).toHaveBeenCalledWith('file:///tmp/only-yours-share-card.png');
    });
  });

  it('should navigate to CategorySelection on Play Again', () => {
    const { getByText, navigation } = renderResults();
    fireEvent.press(getByText('Play Again'));
    expect(navigation.replace).toHaveBeenCalledWith('CategorySelection');
  });

  it('should navigate to Dashboard on Back to Dashboard', () => {
    const { getByText, navigation } = renderResults();
    fireEvent.press(getByText('Back to Dashboard'));
    expect(navigation.replace).toHaveBeenCalledWith('Dashboard');
  });

  it('shows a results-not-ready recovery state for 409 responses', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 409 } });

    const { findByText, navigation } = renderResults({ sessionId: 'session-123' });
    expect(await findByText("Results Aren't Ready Yet")).toBeTruthy();

    fireEvent.press(await findByText('Return to Game'));
    expect(navigation.replace).toHaveBeenCalledWith('Game', { sessionId: 'session-123' });
  });

  it('refreshes results from the not-ready state', async () => {
    api.get
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockResolvedValueOnce({ data: mockScores });

    const { findByText, getByText } = renderResults({ sessionId: 'session-123' });
    expect(await findByText("Results Aren't Ready Yet")).toBeTruthy();

    fireEvent.press(getByText('Refresh Results'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
      expect(getByText('Game Complete!')).toBeTruthy();
    });
  });
});
