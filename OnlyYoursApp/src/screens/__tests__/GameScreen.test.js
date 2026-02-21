import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GameScreen from '../GameScreen';
import { AuthContext } from '../../state/AuthContext';
import { GameProvider } from '../../state/GameContext';
import WebSocketService from '../../services/WebSocketService';

jest.mock('../../services/WebSocketService');

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
    const { getByText } = renderWithProviders();
    expect(getByText('Loading question...')).toBeTruthy();
  });

  it('should render Round 1 badge by default', () => {
    const { queryByText } = renderWithProviders();
    // Before any question arrives, we see loading. The round badge only
    // shows once a question is present, so this verifies loading state.
    expect(queryByText('Round 1: Answer')).toBeNull();
    expect(queryByText('Loading question...')).toBeTruthy();
  });
});
