import type { ExpoConfig } from 'expo/config';

/**
 * Cấu hình app Tất Tần Tật (Android + iOS dùng chung mã nguồn).
 * Biến môi trường khi build (khai báo trong Codemagic):
 *  - EXPO_PUBLIC_API_URL: địa chỉ API, mặc định https://tattantat.vn/api/v1
 *  - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: OAuth Client ID loại "Web" (để lấy idToken đăng nhập Google)
 *  - GOOGLE_IOS_URL_SCHEME: reversed iOS Client ID, ví dụ com.googleusercontent.apps.123-abc
 *  - APP_VERSION / BUILD_NUMBER: phiên bản hiển thị và số build
 *  - GOOGLE_SERVICES_PLIST: đường dẫn GoogleService-Info.plist (iOS), mặc định ./GoogleService-Info.plist khi build iOS
 */
const version = process.env.APP_VERSION ?? '1.0.0';
const buildNumber = Number(process.env.BUILD_NUMBER ?? 1);
const iosPlist = process.env.GOOGLE_SERVICES_PLIST ?? (process.env.EAS_BUILD_PLATFORM === 'ios' || process.env.BUILD_PLATFORM === 'ios' ? './GoogleService-Info.plist' : undefined);

const config: ExpoConfig = {
  name: 'Tất Tần Tật',
  slug: 'tattantat',
  scheme: 'tattantat',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#ffffff',
  ios: {
    bundleIdentifier: 'com.tattantat.app',
    buildNumber: String(buildNumber),
    supportsTablet: false,
    usesAppleSignIn: true,
    ...(iosPlist ? { googleServicesFile: iosPlist } : {}),
    associatedDomains: ['applinks:tattantat.vn'],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: 'Tất Tần Tật cần dùng camera để bạn chụp ảnh sản phẩm khi đăng tin.',
      NSPhotoLibraryUsageDescription: 'Tất Tần Tật cần truy cập thư viện ảnh để bạn chọn ảnh sản phẩm khi đăng tin.',
      NSLocationWhenInUseUsageDescription: 'Tất Tần Tật dùng vị trí để điền địa chỉ tin đăng và gợi ý tin gần bạn.',
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: 'com.tattantat.app',
    versionCode: buildNumber,
    googleServicesFile: './google-services.json',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#FFFFFF' },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'POST_NOTIFICATIONS'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: 'tattantat.vn', pathPrefix: '/products' }], category: ['BROWSABLE', 'DEFAULT'] }],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-local-authentication', { faceIDPermission: 'Tất Tần Tật dùng Face ID để mở khóa ứng dụng khi bạn bật tính năng này.' }],
    'expo-apple-authentication',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 240, resizeMode: 'contain', backgroundColor: '#FFFFFF' }],
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#00A65A' }],
    ['expo-image-picker', { photosPermission: 'Tất Tần Tật cần truy cập thư viện ảnh để bạn chọn ảnh sản phẩm khi đăng tin.', cameraPermission: 'Tất Tần Tật cần dùng camera để bạn chụp ảnh sản phẩm khi đăng tin.', microphonePermission: false }],
    ['expo-location', { locationWhenInUsePermission: 'Tất Tần Tật dùng vị trí để điền địa chỉ tin đăng và gợi ý tin gần bạn.' }],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/messaging',
    ['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder' }],
    ['expo-build-properties', { ios: { useFrameworks: 'static', deploymentTarget: '16.4' }, android: { minSdkVersion: 26 } }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://tattantat.vn/api/v1',
  },
};

export default config;
