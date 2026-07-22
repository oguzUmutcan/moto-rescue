const androidMapsApiKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY;

module.exports = ({ config: baseConfig }) => {
  const config = {
    ...baseConfig,
    android: {
      ...baseConfig.android,
    },
  };

  if (androidMapsApiKey) {
    config.android.config = {
      ...baseConfig.android?.config,
      googleMaps: {
        apiKey: androidMapsApiKey,
      },
    };
  }

  return config;
};
