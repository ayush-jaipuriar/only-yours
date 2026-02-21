jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

/**
 * Global Axios mock.
 *
 * Why this is needed:
 * api.js calls axios.create() at module initialization time (top-level, not inside a function).
 * When any test imports a file that transitively imports api.js (e.g. AuthContext → api),
 * axios.create() runs immediately. Without a mock, Jest doesn't know how to handle it.
 *
 * This mock:
 * - Provides axios.create() returning a mock instance
 * - Provides interceptors.request.use / interceptors.response.use (called in api.js setup)
 * - Provides get/post/put/delete methods (used in screens)
 *
 * Tests that need specific axios behavior (e.g. to test error handling) can override
 * individual methods using jest.spyOn or by calling mockResolvedValue/mockRejectedValue.
 */
const mockAxiosInstance = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
    ...mockAxiosInstance,
  },
}));

/**
 * AsyncStorage mock — prevents native module errors in tests.
 * AsyncStorage is used by api.js (in request interceptor) and AuthContext.
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
