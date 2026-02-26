import { renderHook, act } from '@testing-library/react-hooks/native';
import api from '../../services/api';
import useGameHistoryFlow from '../../screens/useGameHistoryFlow';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createNavigationMock = () => ({
  addListener: jest.fn(() => jest.fn()),
});

describe('useGameHistoryFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads first history page with default filters', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        items: [{ sessionId: 'session-1', result: 'WIN' }],
        page: 0,
        hasNext: false,
      },
    });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useGameHistoryFlow(navigation));

    await act(async () => {
      await flushMicrotasks();
    });

    expect(api.get).toHaveBeenCalledWith(
      '/game/history',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 0,
          size: 8,
          sort: 'recent',
          winner: 'all',
        }),
      })
    );
    expect(result.current.historyItems).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('reloads history when winner filter changes', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          items: [{ sessionId: 'session-1', result: 'WIN' }],
          page: 0,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ sessionId: 'session-2', result: 'LOSS' }],
          page: 0,
          hasNext: false,
        },
      });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useGameHistoryFlow(navigation));

    await act(async () => {
      await flushMicrotasks();
    });

    act(() => {
      result.current.setWinnerFilter('self');
    });
    await act(async () => {
      await flushMicrotasks();
    });

    expect(api.get).toHaveBeenLastCalledWith(
      '/game/history',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 0,
          winner: 'self',
        }),
      })
    );
    expect(result.current.historyItems[0].sessionId).toBe('session-2');
  });

  it('appends next page when loadMore is called', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          items: [{ sessionId: 'session-1', result: 'WIN' }],
          page: 0,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ sessionId: 'session-2', result: 'DRAW' }],
          page: 1,
          hasNext: false,
        },
      });

    const navigation = createNavigationMock();
    const { result } = renderHook(() => useGameHistoryFlow(navigation));

    await act(async () => {
      await flushMicrotasks();
    });

    await act(async () => {
      await result.current.loadMore();
      await flushMicrotasks();
    });

    expect(result.current.historyItems).toHaveLength(2);
    expect(result.current.historyItems[1].sessionId).toBe('session-2');
    expect(result.current.hasNext).toBe(false);
  });
});
