import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import StatsScreen from '../../screens/StatsScreen';
import { ThemeProvider } from '../../theme';

jest.mock('../../screens/useDashboardGameFlow', () => jest.fn());
jest.mock('../../sharing', () => ({
  __esModule: true,
  buildAchievementsShareCard: jest.fn((payload) => payload),
  buildMilestoneShareCard: jest.fn((payload) => payload),
  useShareCardComposer: jest.fn(() => ({
    isSharing: false,
    shareCard: jest.fn(),
    shareHost: null,
  })),
}));

const useDashboardGameFlow = require('../../screens/useDashboardGameFlow');

describe('StatsScreen flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDashboardGameFlow.mockReturnValue({
      user: { id: 'user-1', name: 'Phase User' },
      progression: {
        individualProgression: {
          scope: 'USER',
          label: 'You',
          level: 2,
          xp: 180,
          xpIntoCurrentLevel: 60,
          xpNeededForNextLevel: 160,
          xpToNextLevel: 100,
          progressPercent: 38,
          currentStreakDays: 1,
          longestStreakDays: 2,
          achievementsUnlocked: 1,
        },
        coupleProgression: {
          scope: 'COUPLE',
          label: 'Soulmates',
          level: 5,
          xp: 520,
          xpIntoCurrentLevel: 120,
          xpNeededForNextLevel: 220,
          xpToNextLevel: 100,
          progressPercent: 55,
          currentStreakDays: 4,
          longestStreakDays: 7,
          achievementsUnlocked: 3,
        },
        recentMilestones: [
          {
            type: 'ACHIEVEMENT_UNLOCK',
            scope: 'COUPLE',
            ownerLabel: 'Together',
            title: 'First Spark',
            description: 'Complete your first game together.',
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
      stats: {
        gamesPlayed: 24,
        averageScore: 8,
        bestScore: 10,
        streakDays: 4,
        invitationAcceptanceRate: 92,
        avgInvitationResponseSeconds: 45,
      },
      loading: false,
    });
  });

  it('renders progression, celebrations, stats, and achievements in the stats tab', async () => {
    const navigation = { navigate: jest.fn() };
    const { getAllByText, getByText } = render(
      <ThemeProvider>
        <StatsScreen navigation={navigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Progression')).toBeTruthy();
      expect(getByText('Recent Celebrations')).toBeTruthy();
      expect(getByText('Game Stats')).toBeTruthy();
      expect(getByText('Achievements')).toBeTruthy();
    });

    expect(getByText('Share Latest Celebration')).toBeTruthy();
    expect(getByText('Share Achievement Snapshot')).toBeTruthy();
    expect(getByText('24')).toBeTruthy();
    expect(getAllByText('First Spark').length).toBeGreaterThan(0);
  });
});
