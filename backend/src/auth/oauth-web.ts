import * as crypto from 'crypto';
import { SocialIdentity, verifyFacebook } from './social-verify';

export type WebProvider = 'facebook' | 'zalo';
const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const FB_API = 'v19.0';

/** Chỉ cho quay về app qua scheme riêng của app (tattantat://) hoặc Expo (exp://) — không cho https để tránh chuyển hướng lung tung. */
export const safeReturnUrl = (u?: string) => (u && /^(tattantat|exp|exps):\/\//.test(u) ? u : 'tattantat://oauth');

export const signState = (secret: string, returnUrl: string) => {
  const body = `${crypto.randomBytes(12).toString('base64url')}.${Date.now() + 10 * 60_000}.${b64(returnUrl)}`;
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
};
export function readState(secret: string, state?: string): { nonce: string; returnUrl: string } | null {
  const p = String(state ?? '').split('.');
  if (p.length !== 4) return null;
  const body = p.slice(0, 3).join('.');
  const good = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (good.length !== p[3].length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(p[3]))) return null;
  if (Number(p[1]) < Date.now()) return null;
  return { nonce: p[0], returnUrl: safeReturnUrl(Buffer.from(p[2], 'base64url').toString('utf8')) };
}

// Zalo dùng PKCE: verifier suy ra từ nonce của state nên không cần lưu trạng thái ở server.
const zaloVerifier = (secret: string, nonce: string) => crypto.createHmac('sha256', secret).update('zalo-pkce:' + nonce).digest('base64url');

export const oauthConfig = (provider: WebProvider) => provider === 'facebook'
  ? { id: process.env.FACEBOOK_APP_ID || '2833629363678891', secret: process.env.FACEBOOK_APP_SECRET || '' }
  : { id: process.env.ZALO_APP_ID || '', secret: process.env.ZALO_APP_SECRET || '' };

export function authorizeUrl(provider: WebProvider, secret: string, redirectUri: string, state: string): string | null {
  const { id } = oauthConfig(provider);
  if (!id) return null;
  if (provider === 'facebook') {
    return `https://www.facebook.com/${FB_API}/dialog/oauth?${new URLSearchParams({ client_id: id, redirect_uri: redirectUri, state, response_type: 'code', scope: 'public_profile,email' })}`;
  }
  const nonce = state.split('.')[0];
  const challenge = crypto.createHash('sha256').update(zaloVerifier(secret, nonce)).digest('base64url');
  return `https://oauth.zaloapp.com/v4/permission?${new URLSearchParams({ app_id: id, redirect_uri: redirectUri, code_challenge: challenge, code_challenge_method: 'S256', state })}`;
}

/** Đổi mã (code) lấy danh tính đã xác thực từ Facebook/Zalo. */
export async function identityFromCode(provider: WebProvider, secret: string, redirectUri: string, code: string, nonce: string): Promise<SocialIdentity | null> {
  const { id, secret: appSecret } = oauthConfig(provider);
  if (!id || !appSecret) return null;
  if (provider === 'facebook') {
    const r = await fetch(`https://graph.facebook.com/${FB_API}/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: appSecret, redirect_uri: redirectUri, code })}`, { signal: AbortSignal.timeout(10_000) });
    const t = await r.json().catch(() => null) as { access_token?: string } | null;
    return t?.access_token ? verifyFacebook(t.access_token) : null;
  }
  const r = await fetch('https://oauth.zaloapp.com/v4/access_token', {
    method: 'POST', signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: appSecret },
    body: new URLSearchParams({ app_id: id, code, grant_type: 'authorization_code', code_verifier: zaloVerifier(secret, nonce) }),
  });
  const t = await r.json().catch(() => null) as { access_token?: string; error?: number | string; error_name?: string; error_reason?: string; message?: string } | null;
  if (!t?.access_token) {
    const why = [t?.error, t?.error_name, t?.error_reason ?? t?.message].filter(Boolean).join(' ') || `HTTP ${r.status}`;
    console.warn('[oauth zalo] đổi mã thất bại:', why);
    throw new Error(`Zalo từ chối đăng nhập (${why}). Kiểm tra App ID, Secret key và Callback URL.`);
  }
  const me = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', { headers: { access_token: t.access_token }, signal: AbortSignal.timeout(10_000) });
  const p = await me.json().catch(() => null) as { id?: string; name?: string; picture?: { data?: { url?: string } } } | null;
  if (!p?.id) {
    console.warn('[oauth zalo] lấy hồ sơ thất bại:', JSON.stringify(p));
    throw new Error('Zalo không trả về hồ sơ người dùng. Kiểm tra quyền truy cập thông tin tài khoản của ứng dụng Zalo.');
  }
  return { subject: String(p.id), email: null, name: p.name ?? null, avatarUrl: p.picture?.data?.url ?? null };
}
