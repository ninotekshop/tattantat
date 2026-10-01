import { firebaseKeyCandidates } from './firebase-keys';
import { BadRequestException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/** +84901234567 → 0901234567 (giữ nguyên nếu không phải số Việt Nam). */
export function toLocalPhone(e164: string): string { return /^\+84\d{9}$/.test(e164) ? '0' + e164.slice(3) : e164; }
export function phoneVariants(local: string): string[] { return local.startsWith('0') ? [local, '+84' + local.slice(1), '84' + local.slice(1)] : [local]; }

export { firebaseKeyCandidates };

/** Xác thực ID token do Firebase Phone Auth cấp (người dùng đã nhập đúng mã SMS) và trả về số điện thoại đã xác minh. */
export async function verifyFirebasePhone(idToken: string): Promise<string> {
  // Web dùng project của khóa riêng (firebase-auth-service-account), app di động dùng project trong google-services.json
  // (khóa chung firebase-service-account). Thử lần lượt từng project có khóa.
  const keyPaths = [...new Set([process.env.FIREBASE_AUTH_SERVICE_ACCOUNT_PATH, ...firebaseKeyCandidates('firebase-auth-service-account.json'), process.env.FIREBASE_SERVICE_ACCOUNT_PATH, ...firebaseKeyCandidates('firebase-service-account.json')]
    .filter((p): p is string => !!p && existsSync(p)))];
  if (!keyPaths.length) throw new BadRequestException('Máy chủ chưa cấu hình Firebase. Vui lòng đăng nhập bằng cách khác.');
  const seenProjects = new Set<string>();
  for (const keyPath of keyPaths) {
    let key: { project_id?: string };
    try { key = JSON.parse(readFileSync(keyPath, 'utf8')); } catch { continue; }
    const project = key.project_id ?? keyPath;
    if (seenProjects.has(project)) continue;
    seenProjects.add(project);
    // App đặt tên riêng theo project để không đụng app mặc định dùng cho thông báo đẩy (FCM).
    const name = `phone-auth-${project}`;
    const app = getApps().find(a => a.name === name) ?? initializeApp({ credential: cert(key as Parameters<typeof cert>[0]) }, name);
    try {
      const t = await getAuth(app).verifyIdToken(idToken, true);
      if (t.firebase?.sign_in_provider !== 'phone' || !t.phone_number) break;
      return t.phone_number;
    } catch { /* thử project tiếp theo */ }
  }
  throw new BadRequestException('Xác thực số điện thoại không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
}
