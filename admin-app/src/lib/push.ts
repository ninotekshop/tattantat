import { Platform } from 'react-native';
import { getNotifications } from './notifications';
import { api } from './api';
import { currentSession } from './session';

let unsubscribe: (() => void) | null = null;

/** Nạp Firebase Messaging khi có; nếu app chưa cấu hình Firebase thì bỏ qua, các màn hình vẫn dùng bình thường. */
function loadMessaging() {
  try { return require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging'); } catch { return null; }
}

/** Đăng ký nhận thông báo đẩy (yêu cầu xác minh, tin chờ duyệt…) và gửi token lên máy chủ. */
export async function registerPush() {
  try {
    if (!currentSession()) return;
    const Notifications = getNotifications();
    if (!Notifications) return; // Expo Go: không có thông báo đẩy
    const m = loadMessaging();
    if (!m) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Thông báo quản trị', importance: Notifications.AndroidImportance.HIGH, lightColor: '#00733E' });
      const p = await Notifications.requestPermissionsAsync();
      if (!p.granted) return;
    }
    const messaging = m.getMessaging();
    const status = await m.requestPermission(messaging);
    if (status !== m.AuthorizationStatus.AUTHORIZED && status !== m.AuthorizationStatus.PROVISIONAL) return;
    const send = (token: string) => api('/me/push-devices', { method: 'POST', auth: true, body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' } }).catch(() => undefined);
    await send(await m.getToken(messaging));
    unsubscribe?.();
    unsubscribe = m.onTokenRefresh(messaging, t => { void send(t); });
  } catch { /* thiết bị không hỗ trợ / bị từ chối */ }
}

export async function unregisterPush() {
  unsubscribe?.(); unsubscribe = null;
  try { if (!getNotifications()) return; const m = loadMessaging(); if (m) await m.deleteToken(m.getMessaging()); } catch { /* bỏ qua */ }
}
