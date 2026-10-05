import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, api, ApiError } from './api';
import type { Session } from './session';

// Các module gốc (Google, Apple, Firebase) chỉ nạp khi dùng để màn đăng nhập vẫn mở được trong Expo Go.
// Trong Expo Go các tính năng này không chạy; dùng bản build (APK/IPA) để thử đầy đủ.
const inExpoGo = Constants.executionEnvironment === 'storeClient';
function native<T>(load: () => T, feature: string): T {
  if (inExpoGo) throw new ApiError(`${feature} chỉ hoạt động trong bản app đã build (không chạy trong Expo Go).`, 0);
  return load();
}
const loadGoogle = () => native(() => require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin'), 'Đăng nhập Google');
const loadApple = () => native(() => require('expo-apple-authentication') as typeof import('expo-apple-authentication'), 'Đăng nhập Apple');
const loadFbAuth = () => native(() => require('@react-native-firebase/auth') as typeof import('@react-native-firebase/auth'), 'Đăng nhập bằng mã OTP');

export type ConfirmationResult = Awaited<ReturnType<typeof import('@react-native-firebase/auth').signInWithPhoneNumber>>;

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
    throw e instanceof ApiError ? e : new ApiError('Đăng nhập Google chưa thành công. Vui lòng thử lại.', 0);
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

/** 0901234567 → +84901234567 */
export const toE164 = (p: string) => { const d = p.replace(/[\s.\-()]/g, ''); return d.startsWith('+') ? d : d.startsWith('0') ? '+84' + d.slice(1) : d.startsWith('84') ? '+' + d : '+84' + d; };

/** Gửi mã OTP qua SMS bằng Firebase Phone Auth. */
export async function sendOtp(phone: string): Promise<ConfirmationResult> {
  const { getAuth, signInWithPhoneNumber } = loadFbAuth();
  try { return await signInWithPhoneNumber(getAuth(), toE164(phone)); }
  catch (e) { throw new ApiError(otpError(e), 0); }
}

/** Xác nhận mã OTP rồi đổi ID token lấy phiên Tất Tần Tật. */
export async function confirmOtp(c: ConfirmationResult, code: string): Promise<Session> {
  const { getAuth, signOut: fbSignOut } = loadFbAuth();
  let idToken: string;
  try {
    const cred = await c.confirm(code.trim());
    if (!cred?.user) throw new Error('no user');
    idToken = await cred.user.getIdToken();
  } catch (e) { throw new ApiError(otpError(e), 0); }
  try { return await api<Session>('/auth/phone/firebase-login', { method: 'POST', body: { idToken } }); }
  finally { fbSignOut(getAuth()).catch(() => undefined); }
}

function otpError(e: unknown) {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('invalid-phone-number')) return 'Số điện thoại không hợp lệ.';
  if (code.includes('too-many-requests')) return 'Bạn thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.';
  if (code.includes('invalid-verification-code')) return 'Mã OTP không chính xác.';
  if (code.includes('session-expired') || code.includes('code-expired')) return 'Mã OTP đã hết hạn. Hãy gửi lại mã.';
  if (code.includes('quota-exceeded')) return 'Hệ thống tạm hết lượt gửi SMS. Vui lòng thử lại sau.';
  return 'Chưa gửi/xác nhận được mã OTP. Vui lòng thử lại.';
}

/** Facebook / Zalo: mở trình duyệt đăng nhập qua máy chủ Tất Tần Tật, nhận mã một lần rồi đổi lấy phiên (không cần SDK gốc). */
export async function webLogin(provider: 'facebook' | 'zalo'): Promise<Session | null> {
  const returnUrl = Linking.createURL('oauth');
  const res = await WebBrowser.openAuthSessionAsync(`${API_URL}/auth/oauth/${provider}/start?returnUrl=${encodeURIComponent(returnUrl)}`, returnUrl);
  if (res.type !== 'success') return null;
  const q = Linking.parse(res.url).queryParams ?? {};
  if (q.error) throw new ApiError(String(q.error), 0);
  if (!q.code) return null;
  return api<Session>('/auth/oauth/exchange', { method: 'POST', body: { code: String(q.code) } });
}
