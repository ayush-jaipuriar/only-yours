describe('config', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('should use default localhost URL when env var is not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const { API_BASE_URL, API_URL } = require('../config');

    expect(API_BASE_URL).toBe('http://localhost:8080');
    expect(API_URL).toBe('http://localhost:8080/api');
  });

  it('should use EXPO_PUBLIC_API_URL when set', () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_API_URL: 'https://api.onlyyours.com' };
    jest.resetModules();
    const { API_BASE_URL, API_URL } = require('../config');

    expect(API_BASE_URL).toBe('https://api.onlyyours.com');
    expect(API_URL).toBe('https://api.onlyyours.com/api');
  });

  it('should derive API_URL from API_BASE_URL with /api suffix', () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_API_URL: 'http://192.168.1.50:8080' };
    jest.resetModules();
    const { API_BASE_URL, API_URL } = require('../config');

    expect(API_URL).toBe(`${API_BASE_URL}/api`);
  });
});
