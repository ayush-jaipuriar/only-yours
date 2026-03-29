import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { ThemeProvider } from '../../theme';

jest.mock('../useDashboardGameFlow', () => jest.fn());

jest.mock('../../sharing', () => ({
  __esModule: true,
  buildMilestoneShareCard: jest.fn((milestone) => milestone),
  buildProgressionShareCard: jest.fn((snapshot) => snapshot),
  useShareCardComposer: jest.fn(() => ({
    isSharing: false,
    shareCard: jest.fn(),
    shareHost: null,
  })),
}));

const useDashboardGameFlow = require('../useDashboardGameFlow');

const buildBaseFlow = (overrides = {}) => ({
  user: { id: 'user-1', name: 'Julian' },
  couple: {
    user1: { id: 'user-1', name: 'Julian' },
    user2: { id: 'user-2', name: 'Elena' },
  },
  activeGame: {
    sessionId: 'session-1',
    status: 'ROUND1',
    round: 'Round 1',
    currentQuestionNumber: 3,
    totalQuestions: 10,
  },
  stats: {
    gamesPlayed: 24,
    averageScore: 8,
    bestScore: 10,
    streakDays: 4,
    invitationAcceptanceRate: 92,
    avgInvitationResponseSeconds: 45,
  },
  progression: {
    coupleProgression: {
      scope: 'COUPLE',
      label: 'Deepening Phase',
      level: 4,
      xp: 420,
      xpIntoCurrentLevel: 120,
      xpNeededForNextLevel: 220,
      xpToNextLevel: 100,
      progressPercent: 55,
      currentStreakDays: 4,
      longestStreakDays: 7,
      achievementsUnlocked: 3,
    },
    individualProgression: {
      scope: 'USER',
      label: 'Soulmate in Training',
      level: 2,
      xp: 180,
      xpIntoCurrentLevel: 60,
      xpNeededForNextLevel: 160,
      xpToNextLevel: 100,
      progressPercent: 38,
      currentStreakDays: 2,
      longestStreakDays: 3,
      achievementsUnlocked: 1,
    },
    recentMilestones: [
      {
        type: 'ACHIEVEMENT_UNLOCK',
        scope: 'COUPLE',
        ownerLabel: 'Together',
        title: 'First Vulnerability Shared',
        description: 'You both completed a deeper round together.',
      },
    ],
  },
  badges: [
    {
      code: 'FIRST_GAME',
      title: 'First Spark',
      description: 'Complete your first game together.',
      scope: 'COUPLE',
    },
  ],
  loading: false,
  shouldShowContinueGame: true,
  handleStartGame: jest.fn(),
  handleContinueGame: jest.fn(),
  getPartnerName: jest.fn(() => 'Elena'),
  ...overrides,
});

const renderScreen = (flowOverrides = {}) => {
  const navigation = {
    navigate: jest.fn(),
  };

  useDashboardGameFlow.mockReturnValue(buildBaseFlow(flowOverrides));

  const utils = render(
    <ThemeProvider>
      <DashboardScreen navigation={navigation} />
    </ThemeProvider>
  );

  return { ...utils, navigation };
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the active game hero state and continues the session', async () => {
    const handleContinueGame = jest.fn();
    const { getByText, getByLabelText } = renderScreen({ handleContinueGame });

    await waitFor(() => {
      expect(getByText('Continue your journey tonight')).toBeTruthy();
      expect(getByText('Your next question is waiting')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Continue active game'));

    expect(handleContinueGame).toHaveBeenCalled();
  });

  it('renders the linked-without-active-game state and starts a new game', async () => {
    const handleStartGame = jest.fn();
    const { getAllByText, getByText, getByLabelText } = renderScreen({
      activeGame: null,
      shouldShowContinueGame: false,
      handleStartGame,
    });

    await waitFor(() => {
      expect(getByText('Start a new ritual together')).toBeTruthy();
      expect(getAllByText('Custom Questions').length).toBeGreaterThan(0);
    });

    fireEvent.press(getByLabelText('Start new game'));

    expect(handleStartGame).toHaveBeenCalled();
  });

  it('renders the latest-results recovery state when a completed session is available', async () => {
    const { getByText, getByLabelText, navigation } = renderScreen({
      activeGame: null,
      latestCompletedSession: { sessionId: 'session-results-123', createdAt: Date.now() },
      shouldShowContinueGame: false,
    });

    await waitFor(() => {
      expect(getByText('Revisit the last reveal together')).toBeTruthy();
      expect(getByText('Latest completed session ready')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('View latest results'));

    expect(navigation.navigate).toHaveBeenCalledWith('Results', { sessionId: 'session-results-123' });
  });

  it('renders the not-linked state and routes to partner linking', async () => {
    const { getByText, getByLabelText, queryByText, navigation } = renderScreen({
      couple: null,
      activeGame: null,
      shouldShowContinueGame: false,
      getPartnerName: jest.fn(() => 'your partner'),
    });

    await waitFor(() => {
      expect(getByText('Invite your partner into your private space')).toBeTruthy();
      expect(queryByText('Custom Questions')).toBeNull();
    });

    fireEvent.press(getByLabelText('Link with partner'));

    expect(navigation.navigate).toHaveBeenCalledWith('PartnerLink');
  });
});
