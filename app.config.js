// app.config.js
// Loads values from a local .env file (not committed) and exposes them to the
// JS runtime via Constants.expoConfig.extra. See .env.example for the
// variable names you need to fill in.
require('dotenv/config');

module.exports = {
  expo: {
    name: 'meta-post-app',
    slug: 'meta-post-app',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['android'],
    android: {
      package: 'com.example.metapostapp',
    },
    extra: {
      FB_PAGE_ID: process.env.FB_PAGE_ID,
      FB_PAGE_ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN,
      IG_BUSINESS_ACCOUNT_ID: process.env.IG_BUSINESS_ACCOUNT_ID,
      GRAPH_API_VERSION: process.env.GRAPH_API_VERSION || 'v19.0',
    },
  },
};
