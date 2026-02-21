import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ResultsScreen from '../ResultsScreen';
import { AuthContext } from '../../state/AuthContext';
import { GameProvider } from '../../state/GameContext';
import WebSocketService from '../../services/WebSocketService';

jest.mock('../../services/WebSocketService');

const mockScores = {
  player1Name: 'Alice',
  player1Score: 6,
  player2Name: 'Bob',
  player2Score: 5,
  totalQuestions: 8,
  message: 'Great connection! You really know each other.',
};

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ setGameContextRef: jest.fn() }}>
    {children}
  </AuthContext.Provider>
);

const renderResults = (scores = mockScores, navigation = {}) => {
  const mockNav = { replace: jest.fn(), navigate: jest.fn(), ...navigation };
  const mockRoute = { params: { scores } };
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
});
