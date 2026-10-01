import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithPhoneNumber, signOut as fbSignOut } from '@react-native-firebase/auth';
import { api, ApiError } from './api';
import type { Session } from './session';

export type ConfirmationResult = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '927392714442-7s4c7vca99p1rtr9jvd3ken6ctinut9v.apps.googleusercontent.com';
let configured = false;

/** Đăng nhập Google: lấy idToken (aud = Web Client ID) rồi đổi lấy phiên đăng nhập Tất Tần Tật. */
export async function googleLogin(): Promise<Session | null> {
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

export const appleAvailable = () => Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync();

/** Đăng nhập Apple (bắt buộc trên iOS khi có đăng nhập Google). */
export async function appleLogin(): Promise<Session | null> {
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
  try { return await signInWithPhoneNumber(getAuth(), toE164(phone)); }
  catch (e) { throw new ApiError(otpError(e), 0); }
}

/** Xác nhận mã OTP rồi đổi ID token lấy phiên Tất Tần Tật. */
export async function confirmOtp(c: ConfirmationResult, code: string): Promise<Session> {
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
