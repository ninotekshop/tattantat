import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

/** Bật đăng nhập OTP qua Firebase khi có đủ cấu hình NEXT_PUBLIC_FIREBASE_*. */
export const firebasePhoneEnabled = !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const app = () => getApps()[0] ?? initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID });

/** 0901234567 → +84901234567 */
export const toE164 = (p: string) => { const d = p.replace(/[\s.\-()]/g, ''); return d.startsWith('+') ? d : d.startsWith('0') ? '+84' + d.slice(1) : d.startsWith('84') ? '+' + d : '+84' + d; };

let verifier: RecaptchaVerifier | null = null;
export async function sendFirebaseOtp(phone: string, container: string): Promise<ConfirmationResult> {
  const auth = getAuth(app()); auth.languageCode = 'vi';
  verifier?.clear(); verifier = new RecaptchaVerifier(auth, container, { size: 'invisible' });
  try { return await signInWithPhoneNumber(auth, toE164(phone), verifier); }
  catch (e) { verifier?.clear(); verifier = null; throw e; }
}
/** Đăng xuất phiên Firebase tạm sau khi đã lấy ID token (phiên đăng nhập chính do backend cấp). */
export async function signOutFirebase() { try { await getAuth(app()).signOut(); } catch { /* bỏ qua */ } }
export function firebaseErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('invalid-phone-number')) return 'Số điện thoại không hợp lệ.';
  if (code.includes('too-many-requests')) return 'Bạn thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.';
  if (code.includes('invalid-verification-code')) return 'Mã OTP không chính xác.';
  if (code.includes('code-expired')) return 'Mã OTP đã hết hạn. Hãy gửi lại mã.';
  if (code.includes('quota-exceeded')) return 'Hệ thống tạm hết lượt gửi SMS. Vui lòng thử lại sau.';
  return 'Chưa gửi/xác nhận được mã OTP. Vui lòng thử lại.';
}
