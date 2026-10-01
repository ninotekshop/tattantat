import { BadRequestException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/** +84901234567 → 0901234567 (giữ nguyên nếu không phải số Việt Nam). */
export function toLocalPhone(e164: string): string { return /^\+84\d{9}$/.test(e164) ? '0' + e164.slice(3) : e164; }
export function phoneVariants(local: string): string[] { return local.startsWith('0') ? [local, '+84' + local.slice(1), '84' + local.slice(1)] : [local]; }

/** Xác thực ID token do Firebase Phone Auth cấp (người dùng đã nhập đúng mã SMS) và trả về số điện thoại đã xác minh. */
export async function verifyFirebasePhone(idToken: string): Promise<string> {
  // Khóa riêng cho đăng nhập OTP (project của web app). Không có thì dùng khóa chung.
  const keyPath = [process.env.FIREBASE_AUTH_SERVICE_ACCOUNT_PATH, `${process.cwd()}/firebase-auth-service-account.json`, process.env.FIREBASE_SERVICE_ACCOUNT_PATH, `${process.cwd()}/firebase-service-account.json`].find(p => p && existsSync(p));
  if (!keyPath) throw new BadRequestException('Máy chủ chưa cấu hình Firebase. Vui lòng đăng nhập bằng cách khác.');
  // App đặt tên riêng để không đụng app mặc định dùng cho thông báo đẩy (FCM).
  const app = getApps().find(a => a.name === 'phone-auth') ?? initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) }, 'phone-auth');
  try {
    const t = await getAuth(app).verifyIdToken(idToken, true);
    if (t.firebase?.sign_in_provider !== 'phone' || !t.phone_number) throw new Error('not phone');
    return t.phone_number;
  } catch { throw new BadRequestException('Xác thực số điện thoại không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'); }
}
