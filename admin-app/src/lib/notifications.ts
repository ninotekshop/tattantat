import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

/** Expo Go (SDK 53+) không hỗ trợ thông báo đẩy: chỉ nạp expo-notifications trong bản build thật. */
export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Constants.executionEnvironment === 'storeClient') { cached = null; return cached; }
  try {
    const n = require('expo-notifications') as NotificationsModule;
    n.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });
    cached = n;
  } catch { cached = null; }
  return cached;
}
