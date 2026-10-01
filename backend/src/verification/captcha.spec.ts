import { createHmac } from 'crypto';

process.env.CAPTCHA_SECRET = 'test-secret';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createCaptcha, verifyCaptcha } = require('./captcha') as typeof import('./captcha');

const solve = (token: string) => {
  const p = JSON.parse(Buffer.from(token, 'base64url').toString());
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // vét cạn là quá lớn (32^5); thay vào đó dựng token biết trước đáp án
  void chars; return p;
};

describe('captcha', () => {
  it('creates an svg image and rejects missing/forged answers', () => {
    const c = createCaptcha();
    expect(c.image.startsWith('data:image/svg+xml;base64,')).toBe(true);
    solve(c.token);
    expect(() => verifyCaptcha(undefined, undefined)).toThrow();
    expect(() => verifyCaptcha(c.token, 'ZZZZZ')).toThrow();
    expect(() => verifyCaptcha('not-a-token', 'ABCDE')).toThrow();
  });
  it('accepts a correct answer once, case-insensitively, and rejects replay/expired', () => {
    const mk = (answer: string, e: number, n: string) => Buffer.from(JSON.stringify({ e, n, s: createHmac('sha256', 'test-secret').update(`${answer}:${e}:${n}`).digest('hex') })).toString('base64url');
    const token = mk('K7M2P', Date.now() + 60_000, 'nonce1');
    expect(() => verifyCaptcha(token, ' k7m2p ')).not.toThrow();
    expect(() => verifyCaptcha(token, 'K7M2P')).toThrow();
    expect(() => verifyCaptcha(mk('K7M2P', Date.now() - 1, 'nonce2'), 'K7M2P')).toThrow();
  });
});
