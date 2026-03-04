import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = 'onboarding_state_v1';

const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const defaultOnboardingState = {
  status: ONBOARDING_STATUS.NOT_STARTED,
  updatedAt: null,
  completedAt: null,
};

const normalizeOnboardingState = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'object') {
    return defaultOnboardingState;
  }

  const status = Object.values(ONBOARDING_STATUS).includes(rawValue.status)
    ? rawValue.status
    : ONBOARDING_STATUS.NOT_STARTED;

  return {
    status,
    updatedAt: rawValue.updatedAt || null,
    completedAt: rawValue.completedAt || null,
  };
};

const persistOnboardingState = async (nextState) => {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState));
};

const getOnboardingState = async () => {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      return defaultOnboardingState;
    }
    return normalizeOnboardingState(JSON.parse(stored));
  } catch (error) {
    console.warn('[OnboardingStorage] Failed to read onboarding state');
    return defaultOnboardingState;
  }
};

const markOnboardingStarted = async () => {
  const currentState = await getOnboardingState();
  if (currentState.status === ONBOARDING_STATUS.COMPLETED) {
    return currentState;
  }

  const nextState = {
    ...currentState,
    status: ONBOARDING_STATUS.IN_PROGRESS,
    updatedAt: Date.now(),
  };
  await persistOnboardingState(nextState);
  return nextState;
};

const markOnboardingCompleted = async () => {
  const now = Date.now();
  const nextState = {
    status: ONBOARDING_STATUS.COMPLETED,
    updatedAt: now,
    completedAt: now,
  };
  await persistOnboardingState(nextState);
  return nextState;
};

const resetOnboardingState = async () => {
  const nextState = {
    status: ONBOARDING_STATUS.NOT_STARTED,
    updatedAt: Date.now(),
    completedAt: null,
  };
  await persistOnboardingState(nextState);
  return nextState;
};

export {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_STATUS,
  getOnboardingState,
  markOnboardingStarted,
  markOnboardingCompleted,
  resetOnboardingState,
};
