import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, api, ApiError } from './api';
import type { Session } from './session';

// Các module gốc (Google, Apple) chỉ nạp khi dùng để màn đăng nhập vẫn mở được trong Expo Go.
// Trong Expo Go các tính năng này không chạy; dùng bản build (APK/IPA) để thử đầy đủ.
const inExpoGo = Constants.executionEnvironment === 'storeClient';
function native<T>(load: () => T, feature: string): T {
  if (inExpoGo) throw new ApiError(`${feature} chỉ hoạt động trong bản app đã build (không chạy trong Expo Go).`, 0);
  return load();
}
const loadGoogle = () => native(() => require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin'), 'Đăng nhập Google');
const loadApple = () => native(() => require('expo-apple-authentication') as typeof import('expo-apple-authentication'), 'Đăng nhập Apple');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '927392714442-7s4c7vca99p1rtr9jvd3ken6ctinut9v.apps.googleusercontent.com';
let configured = false;

/** Đăng nhập Google: lấy idToken (aud = Web Client ID) rồi đổi lấy phiên đăng nhập Tất Tần Tật. */
export async function googleLogin(): Promise<Session | null> {
  const { GoogleSignin, isSuccessResponse, statusCodes } = loadGoogle();
  if (!configured) { GoogleSignin.configure({ webClientId: WEB_CLIENT_ID }); configured = true; }
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    const idToken = res.data.idToken;
    if (!idToken) throw new ApiError('Không lấy được thông tin Google. Vui lòng thử lại.', 0);
    return await api<Session>('/auth/social', { method: 'POST', body: { provider: 'google', providerAccountId: res.data.user.id, idToken } });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return null;
    if (e instanceof ApiError) throw e;
    // Kèm mã lỗi để dễ tìm nguyên nhân (10 = DEVELOPER_ERROR: chưa khai báo SHA-1 của bản build với Google).
    throw new ApiError(`Đăng nhập Google chưa thành công${code ? ` (mã ${code})` : ''}. Vui lòng thử lại.`, 0);
  } finally { GoogleSignin.signOut().catch(() => undefined); }
}

export const appleAvailable = async () => { if (Platform.OS !== 'ios' || inExpoGo) return false; return loadApple().isAvailableAsync(); };

/** Đăng nhập Apple (bắt buộc trên iOS khi có đăng nhập Google). */
export async function appleLogin(): Promise<Session | null> {
  const AppleAuthentication = loadApple();
  try {
    const c = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
    if (!c.identityToken) throw new ApiError('Không lấy được thông tin Apple. Vui lòng thử lại.', 0);
    const name = [c.fullName?.familyName, c.fullName?.middleName, c.fullName?.givenName].filter(Boolean).join(' ') || undefined;
    return await api<Session>('/auth/social', { method: 'POST', body: { provider: 'apple', providerAccountId: c.user, idToken: c.identityToken, name } });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e instanceof ApiError ? e : new ApiError('Đăng nhập Apple chưa thành công. Vui lòng thử lại.', 0);
  }
}

/** Facebook / Zalo: mở trình duyệt đăng nhập qua máy chủ Tất Tần Tật, nhận mã một lần rồi đổi lấy phiên (không cần SDK gốc). */
export async function webLogin(provider: 'facebook' | 'zalo'): Promise<Session | null> {
  // Bản build dùng scheme riêng của app; Expo Go dùng exp://. Nếu không đọc được cấu hình thì rơi về scheme cố định.
  let returnUrl = 'tattantat://oauth';
  try { returnUrl = Linking.createURL('oauth'); } catch { /* giữ scheme mặc định */ }
  const res = await WebBrowser.openAuthSessionAsync(`${API_URL}/auth/oauth/${provider}/start?returnUrl=${encodeURIComponent(returnUrl)}`, returnUrl);
  if (res.type !== 'success') return null;
  const q = Linking.parse(res.url).queryParams ?? {};
  if (q.error) throw new ApiError(String(q.error), 0);
  if (!q.code) return null;
  return api<Session>('/auth/oauth/exchange', { method: 'POST', body: { code: String(q.code) } });
}

/** Gửi mã OTP qua Zalo (ZNS) do máy chủ thực hiện. */
export async function sendZaloOtp(phone: string): Promise<void> {
  const r = await api<{ channel?: string }>('/auth/phone/send-otp', { method: 'POST', body: { phone } });
  if (r?.channel === 'none') throw new ApiError('Chưa bật gửi mã OTP qua Zalo. Vui lòng đăng nhập bằng mật khẩu.', 0);
}

/** Xác nhận mã OTP rồi đổi lấy phiên Tất Tần Tật (tự tạo tài khoản nếu số chưa có). */
export const confirmZaloOtp = (phone: string, code: string) =>
  api<Session>('/auth/phone/verify-otp', { method: 'POST', body: { phone, otp: code.trim() } });
