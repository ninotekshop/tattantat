import { createPublicKey, verify as verifySig } from 'crypto';

/** Kết quả đã xác thực từ nhà cung cấp đăng nhập (chỉ tin dữ liệu này, không tin dữ liệu client tự gửi). */
export type SocialIdentity = { email: string | null; name: string | null; avatarUrl: string | null; subject: string };

const list = (v?: string) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

/** Google: kiểm tra idToken qua tokeninfo, đúng client ID của Tất Tần Tật và email đã xác minh. */
export async function verifyGoogle(idToken: string): Promise<SocialIdentity | null> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const p = await res.json() as { aud?: string; iss?: string; sub?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string; exp?: string };
  // Mặc định: Web Client ID của Tất Tần Tật (web và app di động đều xin idToken cho client này).
  const allowed = list(process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '927392714442-7s4c7vca99p1rtr9jvd3ken6ctinut9v.apps.googleusercontent.com');
  if (!allowed.includes(p.aud ?? '')) return null;
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss ?? '')) return null;
  if (!p.sub || Number(p.exp ?? 0) * 1000 < Date.now()) return null;
  const verified = p.email_verified === true || p.email_verified === 'true';
  return { subject: p.sub, email: verified && p.email ? p.email.toLowerCase() : null, name: p.name ?? null, avatarUrl: p.picture ?? null };
}

/** Facebook: lấy thông tin bằng access token; nếu có FACEBOOK_APP_ID + FACEBOOK_APP_SECRET thì kiểm tra token thuộc đúng app. */
export async function verifyFacebook(accessToken: string): Promise<SocialIdentity | null> {
  const appId = process.env.FACEBOOK_APP_ID, secret = process.env.FACEBOOK_APP_SECRET;
  if (appId && secret) {
    const dbg = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${appId}|${secret}`, { signal: AbortSignal.timeout(10_000) });
    const d = await dbg.json().catch(() => null) as { data?: { is_valid?: boolean; app_id?: string } } | null;
    if (!d?.data?.is_valid || d.data.app_id !== appId) return null;
  }
  const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const p = await res.json() as { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } };
  if (!p.id) return null;
  return { subject: p.id, email: p.email?.toLowerCase() ?? null, name: p.name ?? null, avatarUrl: p.picture?.data?.url ?? null };
}

let appleKeys: { at: number; keys: { kid: string; kty: string; n: string; e: string; alg: string }[] } | null = null;
/** Apple: kiểm tra chữ ký JWT bằng khóa công khai của Apple, đúng issuer/audience và còn hạn. */
export async function verifyApple(idToken: string): Promise<SocialIdentity | null> {
  const [h, p, s] = idToken.split('.');
  if (!h || !p || !s) return null;
  const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as { kid?: string; alg?: string };
  if (header.alg !== 'RS256') return null;
  if (!appleKeys || Date.now() - appleKeys.at > 6 * 3600_000) {
    const res = await fetch('https://appleid.apple.com/auth/keys', { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    appleKeys = { at: Date.now(), keys: ((await res.json()) as { keys: typeof appleKeys extends null ? never : any }).keys };
  }
  const jwk = appleKeys!.keys.find(k => k.kid === header.kid);
  if (!jwk) return null;
  const ok = verifySig('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk as any, format: 'jwk' }), Buffer.from(s, 'base64url'));
  if (!ok) return null;
  const c = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as { iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: string | boolean };
  const audiences = list(process.env.APPLE_CLIENT_IDS || process.env.APPLE_CLIENT_ID || 'com.tattantat.app');
  if (c.iss !== 'https://appleid.apple.com' || !audiences.includes(c.aud ?? '') || !c.sub || (c.exp ?? 0) * 1000 < Date.now()) return null;
  return { subject: c.sub, email: c.email?.toLowerCase() ?? null, name: null, avatarUrl: null };
}
