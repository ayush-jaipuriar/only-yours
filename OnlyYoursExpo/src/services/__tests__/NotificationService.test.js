jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  AndroidImportance: { HIGH: 5 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  osBuildId: 'device-build-id',
  modelId: 'model-id',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  easConfig: { projectId: 'test-project-id' },
}));

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  },
}));

describe('NotificationService deep-link mapping', () => {
  let NotificationService;

  beforeEach(() => {
    jest.resetModules();
    NotificationService = require('../NotificationService').default;
  });

  it('maps continue-game payload to Game route intent', () => {
    const intent = NotificationService.mapPushDataToIntent({
      type: 'CONTINUE_GAME',
      sessionId: 'session-123',
    });

    expect(intent).toEqual({
      targetRoute: 'Game',
      params: { sessionId: 'session-123' },
    });
  });

  it('maps results-ready payload to Results route intent', () => {
    const intent = NotificationService.mapPushDataToIntent({
      type: 'RESULTS_READY',
      sessionId: 'session-xyz',
    });

    expect(intent).toEqual({
      targetRoute: 'Results',
      params: { sessionId: 'session-xyz' },
    });
  });

  it('returns null when route needs sessionId but payload is missing it', () => {
    const intent = NotificationService.mapPushDataToIntent({
      type: 'CONTINUE_GAME',
    });

    expect(intent).toBeNull();
  });

  it('extracts nested notification response payload and maps to intent', () => {
    const responsePayload = {
      notification: {
        request: {
          content: {
            data: {
              type: 'PARTNER_COMPLETED_ANSWERING',
              sessionId: 'session-777',
            },
          },
        },
      },
    };

    const intent = NotificationService.mapNotificationResponseToIntent(responsePayload);

    expect(intent).toEqual({
      targetRoute: 'Game',
      params: { sessionId: 'session-777' },
    });
  });
});
