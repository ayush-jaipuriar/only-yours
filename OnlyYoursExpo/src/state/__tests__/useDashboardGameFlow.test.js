import { renderHook, act } from '@testing-library/react-hooks/native';
import useDashboardGameFlow from '../../screens/useDashboardGameFlow';
import api from '../../services/api';
import { useAuth } from '../AuthContext';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createNavigationMock = () => ({
  navigate: jest.fn(),
  addListener: jest.fn((event, callback) => {
    if (event === 'focus') {
      callback();
    }
    return jest.fn();
  }),
});

describe('useDashboardGameFlow', () => {
  let alertApi;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 'user-1', name: 'User One' },
    });
    alertApi = { alert: jest.fn() };
  });

  it('exposes continue game state and route when active session exists', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/couple') {
        return Promise.resolve({
          data: {
            user1: { id: 'user-1', name: 'User One' },
            user2: { id: 'user-2', name: 'User Two' },
          },
        });
      }
      if (url === '/game/active') {
        return Promise.resolve({
          data: {
            sessionId: 'session-123',
            round: 'ROUND1',
            currentQuestionNumber: 2,
            totalQuestions: 8,
          },
        });
      }
      if (url === '/game/stats') {
        return Promise.resolve({
          data: {
            gamesPlayed: 12,
            averageScore: 5.4,
            bestScore: 8,
            streakDays: 3,
            invitationAcceptanceRate: 80,
            avgInvitationResponseSeconds: 60,
          },
        });
      }
      if (url === '/game/badges') {
        return Promise.resolve({
          data: {
            badges: [
              { code: 'FIRST_GAME', title: 'First Spark', description: 'Complete your first game' },
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useDashboardGameFlow(navigation, alertApi));

    await act(async () => {
      await flushMicrotasks();
    });

    expect(result.current.shouldShowContinueGame).toBe(true);
    expect(result.current.stats?.gamesPlayed).toBe(12);
    expect(result.current.badges?.length).toBe(1);
    act(() => {
      result.current.handleContinueGame();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Game', { sessionId: 'session-123' });
  });

  it('navigates to category selection when couple is linked and no active game', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/couple') {
        return Promise.resolve({
          data: {
            user1: { id: 'user-1', name: 'User One' },
            user2: { id: 'user-2', name: 'User Two' },
          },
        });
      }
      if (url === '/game/active') {
        return Promise.reject({ response: { status: 404 } });
      }
      if (url === '/game/stats') {
        return Promise.resolve({
          data: {
            gamesPlayed: 0,
            averageScore: 0,
            bestScore: 0,
            streakDays: 0,
            invitationAcceptanceRate: 0,
            avgInvitationResponseSeconds: 0,
          },
        });
      }
      if (url === '/game/badges') {
        return Promise.resolve({ data: { badges: [] } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useDashboardGameFlow(navigation, alertApi));

    await act(async () => {
      await flushMicrotasks();
    });

    expect(result.current.shouldShowContinueGame).toBe(false);
    act(() => {
      result.current.handleStartGame();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('CategorySelection');
  });

  it('shows active-session warning when start game is tapped during active session', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/couple') {
        return Promise.resolve({
          data: {
            user1: { id: 'user-1', name: 'User One' },
            user2: { id: 'user-2', name: 'User Two' },
          },
        });
      }
      if (url === '/game/active') {
        return Promise.resolve({
          data: {
            sessionId: 'session-123',
            round: 'ROUND1',
            currentQuestionNumber: 2,
            totalQuestions: 8,
          },
        });
      }
      if (url === '/game/stats') {
        return Promise.resolve({
          data: {
            gamesPlayed: 4,
            averageScore: 5.1,
            bestScore: 7,
            streakDays: 2,
            invitationAcceptanceRate: 75,
            avgInvitationResponseSeconds: 85,
          },
        });
      }
      if (url === '/game/badges') {
        return Promise.resolve({ data: { badges: [] } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useDashboardGameFlow(navigation, alertApi));

    await act(async () => {
      await flushMicrotasks();
    });

    act(() => {
      result.current.handleStartGame();
    });

    expect(alertApi.alert).toHaveBeenCalledWith(
      'Active Game In Progress',
      'You already have an active game session. Continue that game first.',
      expect.any(Array)
    );

    const buttonSet = alertApi.alert.mock.calls[0][2];
    const continueAction = buttonSet.find((button) => button.text === 'Continue Game');
    act(() => {
      continueAction.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Game', { sessionId: 'session-123' });
  });

  it('shows link-required flow when user is not linked', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/couple') {
        return Promise.reject({ response: { status: 404 } });
      }
      if (url === '/game/stats') {
        return Promise.resolve({
          data: {
            gamesPlayed: 0,
            averageScore: 0,
            bestScore: 0,
            streakDays: 0,
            invitationAcceptanceRate: 0,
            avgInvitationResponseSeconds: 0,
          },
        });
      }
      if (url === '/game/badges') {
        return Promise.resolve({ data: { badges: [] } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useDashboardGameFlow(navigation, alertApi));

    await act(async () => {
      await flushMicrotasks();
    });

    act(() => {
      result.current.handleStartGame();
    });

    expect(alertApi.alert).toHaveBeenCalledWith(
      'Link Required',
      'Please link with your partner first to play games.',
      expect.any(Array)
    );

    const buttonSet = alertApi.alert.mock.calls[0][2];
    const linkNowAction = buttonSet.find((button) => button.text === 'Link Now');
    act(() => {
      linkNowAction.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('PartnerLink');
  });

  it('keeps dashboard actions functional when stats and badges fail', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/couple') {
        return Promise.resolve({
          data: {
            user1: { id: 'user-1', name: 'User One' },
            user2: { id: 'user-2', name: 'User Two' },
          },
        });
      }
      if (url === '/game/active') {
        return Promise.reject({ response: { status: 404 } });
      }
      if (url === '/game/stats') {
        return Promise.reject(new Error('Stats endpoint unavailable'));
      }
      if (url === '/game/badges') {
        return Promise.reject(new Error('Badges endpoint unavailable'));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useDashboardGameFlow(navigation, alertApi));

    await act(async () => {
      await flushMicrotasks();
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.badges).toEqual([]);
    act(() => {
      result.current.handleStartGame();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('CategorySelection');
  });
});
