const appJson = require('../../app.json');
const packageJson = require('../../package.json');
const easJson = require('../../eas.json');

describe('App Release Configuration & Integrity', () => {
  it('has production android package matching com.onlyyours.app', () => {
    expect(appJson.expo.android.package).toBe('com.onlyyours.app');
  });

  it('has positive integer versionCode configured for Play Store releases', () => {
    expect(appJson.expo.android.versionCode).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(appJson.expo.android.versionCode)).toBe(true);
  });

  it('has valid app scheme and notification plugins', () => {
    expect(appJson.expo.scheme).toBe('onlyyours');
    const notificationPlugin = appJson.expo.plugins.find(
      (p) => (Array.isArray(p) ? p[0] : p) === 'expo-notifications'
    );
    expect(notificationPlugin).toBeTruthy();
  });

  it('defines local build and bundle scripts in package.json', () => {
    expect(packageJson.scripts['android:local-build']).toBe('bash ./scripts/local-android-build.sh');
    expect(packageJson.scripts['android:local-bundle']).toBe('bash ./scripts/local-android-bundle.sh');
  });

  it('defines production app-bundle profile in eas.json', () => {
    expect(easJson.build.production.android.buildType).toBe('app-bundle');
  });
});
