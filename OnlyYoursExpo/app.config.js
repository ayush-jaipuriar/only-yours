const fs = require('node:fs');
const path = require('node:path');
const appJson = require('./app.json');

module.exports = function getExpoConfig() {
  const config = appJson.expo;
  const googleServicesPath = path.join(__dirname, 'google-services.json');

  const androidConfig = {
    ...config.android,
  };

  if (fs.existsSync(googleServicesPath)) {
    androidConfig.googleServicesFile = './google-services.json';
  }

  return {
    ...config,
    android: androidConfig,
  };
};
