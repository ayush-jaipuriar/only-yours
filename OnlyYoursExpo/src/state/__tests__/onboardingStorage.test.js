import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ONBOARDING_STATUS,
  getOnboardingState,
  markOnboardingCompleted,
  markOnboardingStarted,
  resetOnboardingState,
} from '../onboardingStorage';

describe('onboardingStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default not_started state when storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const state = await getOnboardingState();

    expect(state.status).toBe(ONBOARDING_STATUS.NOT_STARTED);
    expect(state.completedAt).toBeNull();
  });

  it('marks onboarding as in_progress', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const state = await markOnboardingStarted();

    expect(state.status).toBe(ONBOARDING_STATUS.IN_PROGRESS);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('marks onboarding as completed with timestamp', async () => {
    const state = await markOnboardingCompleted();

    expect(state.status).toBe(ONBOARDING_STATUS.COMPLETED);
    expect(typeof state.completedAt).toBe('number');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('resets onboarding back to not_started', async () => {
    const state = await resetOnboardingState();

    expect(state.status).toBe(ONBOARDING_STATUS.NOT_STARTED);
    expect(state.completedAt).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });
});
