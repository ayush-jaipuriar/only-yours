import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../state/AuthContext';
import api from '../services/api';

const useDashboardGameFlow = (navigation, alertApi = Alert) => {
  const { user } = useAuth();
  const [couple, setCouple] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActiveGameSummary = async () => {
    try {
      const response = await api.get('/game/active');
      setActiveGame(response.data);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 410) {
        setActiveGame(null);
        return;
      }
      console.error('Error loading active game:', error);
      setActiveGame(null);
    }
  };

  const loadDashboardInsights = async () => {
    try {
      const statsResponse = await api.get('/game/stats');
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(null);
    }

    try {
      const badgesResponse = await api.get('/game/badges');
      setBadges(badgesResponse.data?.badges || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
    }
  };

  const loadCoupleStatus = async () => {
    try {
      const response = await api.get('/couple');
      setCouple(response.data);
      await Promise.all([loadActiveGameSummary(), loadDashboardInsights()]);
    } catch (error) {
      if (error.response?.status === 404) {
        setCouple(null);
        setActiveGame(null);
        await loadDashboardInsights();
      } else {
        console.error('Error loading couple status:', error);
        alertApi?.alert?.('Error', 'Failed to load couple status');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCoupleStatus);
    return unsubscribe;
  }, [navigation]);

  const handleContinueGame = () => {
    if (!activeGame?.sessionId) {
      return;
    }
    navigation.navigate('Game', { sessionId: activeGame.sessionId });
  };

  const handleStartGame = () => {
    if (activeGame?.sessionId) {
      alertApi?.alert?.(
        'Active Game In Progress',
        'You already have an active game session. Continue that game first.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Continue Game', onPress: () => navigation.navigate('Game', { sessionId: activeGame.sessionId }) },
        ]
      );
      return;
    }

    if (!couple) {
      alertApi?.alert?.(
        'Link Required',
        'Please link with your partner first to play games.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Link Now', onPress: () => navigation.navigate('PartnerLink') },
        ]
      );
      return;
    }

    navigation.navigate('CategorySelection');
  };

  const getPartnerName = () => {
    if (!couple || !user) {
      return 'your partner';
    }
    const isUser1 = couple.user1?.id === user.id;
    return isUser1 ? couple.user2?.name : couple.user1?.name;
  };

  return {
    user,
    couple,
    activeGame,
    stats,
    badges,
    loading,
    shouldShowContinueGame: Boolean(activeGame?.sessionId),
    handleStartGame,
    handleContinueGame,
    getPartnerName,
    loadCoupleStatus,
  };
};

export default useDashboardGameFlow;
