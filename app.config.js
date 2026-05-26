// app.config.js — extends app.json and injects environment variables into `extra`.
// Expo SDK 49+ automatically loads .env files, so process.env is populated here.

const baseConfig = require('./app.json');

module.exports = {
  ...baseConfig.expo,
  extra: {
    ...baseConfig.expo.extra,
    revenueCatApiKey: process.env.REVENUECAT_API_KEY,
  },
};
