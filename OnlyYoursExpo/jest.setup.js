jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {
    register: jest.fn(),
    getModule: jest.fn(),
  };
}

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
