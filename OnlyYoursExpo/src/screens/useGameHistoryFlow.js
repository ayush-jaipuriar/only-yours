import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const PAGE_SIZE = 8;

const useGameHistoryFlow = (navigation) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [winnerFilter, setWinnerFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchHistoryPage = useCallback(
    async (targetPage, append = false) => {
      const response = await api.get('/game/history', {
        params: {
          page: targetPage,
          size: PAGE_SIZE,
          sort: sortOption,
          winner: winnerFilter,
        },
      });

      const payload = response.data || {};
      const items = payload.items || [];
      setHistoryItems((previousItems) => (append ? [...previousItems, ...items] : items));
      setPage(payload.page ?? targetPage);
      setHasNext(Boolean(payload.hasNext));
    },
    [sortOption, winnerFilter]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      await fetchHistoryPage(0, false);
    } catch (error) {
      console.error('Error loading game history:', error);
      setHistoryItems([]);
      setHasNext(false);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchHistoryPage]);

  useEffect(() => {
    loadInitial();
    const unsubscribe = navigation.addListener('focus', loadInitial);
    return unsubscribe;
  }, [navigation, loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      await fetchHistoryPage(page + 1, true);
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchHistoryPage, hasNext, loading, loadingMore, page]);

  return {
    historyItems,
    sortOption,
    setSortOption,
    winnerFilter,
    setWinnerFilter,
    loading,
    loadingMore,
    loadError,
    hasNext,
    loadMore,
    reload: loadInitial,
  };
};

export default useGameHistoryFlow;
