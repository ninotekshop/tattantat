import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getMessaging, getToken, requestPermission, onTokenRefresh, deleteToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { api } from './api';
import { currentSession } from './session';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
});

let unsubscribe: (() => void) | null = null;

/** Đăng ký nhận thông báo đẩy qua Firebase Cloud Messaging (Android + iOS) và gửi token lên máy chủ. */
export async function registerPush() {
  try {
    if (!currentSession()) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Thông báo', importance: Notifications.AndroidImportance.HIGH, lightColor: '#00A65A' });
      const p = await Notifications.requestPermissionsAsync();
      if (!p.granted) return;
    }
    const messaging = getMessaging();
    const status = await requestPermission(messaging);
    if (status !== AuthorizationStatus.AUTHORIZED && status !== AuthorizationStatus.PROVISIONAL) return;
    const send = (token: string) => api('/me/push-devices', { method: 'POST', auth: true, body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' } }).catch(() => undefined);
    await send(await getToken(messaging));
    unsubscribe?.();
    unsubscribe = onTokenRefresh(messaging, t => { void send(t); });
  } catch { /* thiết bị không hỗ trợ / người dùng từ chối */ }
}

export async function unregisterPush() {
  unsubscribe?.(); unsubscribe = null;
  try { await deleteToken(getMessaging()); } catch { /* bỏ qua */ }
}
