import fs from 'fs';
import type { ExpoConfig } from 'expo/config';

/**
 * App quản trị Tất Tần Tật (Android + iOS).
 * Cần thêm ứng dụng Android "com.tattantat.admin" trong Firebase và tải google-services.json vào thư mục admin-app
 * (không có tệp này vẫn chạy được, chỉ không nhận được thông báo đẩy).
 */
const version = process.env.APP_VERSION ?? '1.0.0';
const buildNumber = Number(process.env.BUILD_NUMBER ?? 1);
const hasGoogleServices = fs.existsSync('./google-services.json');

const config: ExpoConfig = {
  name: 'TTT Quản trị',
  slug: 'tattantat-admin',
  scheme: 'tattantat-admin',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#ffffff',
  ios: { bundleIdentifier: 'com.tattantat.admin', buildNumber: String(buildNumber), supportsTablet: false, infoPlist: { ITSAppUsesNonExemptEncryption: false, UIBackgroundModes: ['remote-notification'] } },
  android: {
    package: 'com.tattantat.admin',
    versionCode: buildNumber,
    ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#FFFFFF' },
    permissions: ['POST_NOTIFICATIONS'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 200, resizeMode: 'contain', backgroundColor: '#FFFFFF' }],
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#00733E' }],
    ...(hasGoogleServices ? ['@react-native-firebase/app', '@react-native-firebase/messaging', './plugins/withFirebaseColorFix'] as const : []),
    ['expo-build-properties', { ios: { useFrameworks: 'static', deploymentTarget: '16.4' }, android: { minSdkVersion: 26 } }],
  ],
  experiments: { typedRoutes: true },
  extra: { apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://tattantat.vn/api/v1' },
};

export default config;
