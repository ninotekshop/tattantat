const { withAndroidManifest } = require('expo/config-plugins');

// Tránh xung đột manifest merger giữa expo-notifications và react-native-firebase_messaging
module.exports = function withFirebaseColorFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const app = manifest.application && manifest.application[0];
    if (!app) return cfg;
    const metas = app['meta-data'] || [];
    for (const m of metas) {
      const n = m.$['android:name'];
      if (
        n === 'com.google.firebase.messaging.default_notification_color' ||
        n === 'com.google.firebase.messaging.default_notification_icon'
      ) {
        m.$['tools:replace'] = 'android:resource';
      }
    }
    return cfg;
  });
};
