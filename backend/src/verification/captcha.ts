import { BadRequestException } from '@nestjs/common';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

const SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || randomBytes(32).toString('hex');
const TTL_MS = 5 * 60_000;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm: I O 0 1
const used = new Map<string, number>();
const sign = (answer: string, exp: number, nonce: string) => createHmac('sha256', SECRET).update(`${answer}:${exp}:${nonce}`).digest('hex');

/** Tạo CAPTCHA không cần dịch vụ ngoài: ảnh SVG + mã ký số (không lưu DB). */
export function createCaptcha() {
  const answer = Array.from({ length: 5 }, () => CHARS[randomInt(CHARS.length)]).join('');
  const exp = Date.now() + TTL_MS; const nonce = randomBytes(8).toString('hex');
  const token = Buffer.from(JSON.stringify({ e: exp, n: nonce, s: sign(answer, exp, nonce) })).toString('base64url');
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const letters = answer.split('').map((c, i) => `<text x="${14 + i * 26}" y="${rnd(30, 38).toFixed(1)}" font-size="${rnd(26, 32).toFixed(0)}" font-weight="700" font-family="Verdana,Arial,sans-serif" fill="hsl(${randomInt(0, 360)},55%,32%)" transform="rotate(${rnd(-22, 22).toFixed(1)} ${14 + i * 26} 28)">${c}</text>`).join('');
  const lines = Array.from({ length: 6 }, () => `<path d="M${rnd(0, 20).toFixed(0)} ${rnd(5, 45).toFixed(0)} Q ${rnd(40, 90).toFixed(0)} ${rnd(0, 50).toFixed(0)} ${rnd(110, 150).toFixed(0)} ${rnd(5, 45).toFixed(0)}" stroke="hsl(${randomInt(0, 360)},40%,55%)" stroke-width="1.4" fill="none"/>`).join('');
  const dots = Array.from({ length: 28 }, () => `<circle cx="${rnd(0, 150).toFixed(0)}" cy="${rnd(0, 50).toFixed(0)}" r="${rnd(0.8, 1.8).toFixed(1)}" fill="hsl(${randomInt(0, 360)},40%,50%)"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><rect width="150" height="50" fill="#f3f7f5"/>${lines}${letters}${dots}</svg>`;
  return { token, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` };
}

/** Kiểm tra CAPTCHA; mỗi mã chỉ dùng được một lần. */
export function verifyCaptcha(token?: string, answer?: string) {
  const fail = () => { throw new BadRequestException('Mã captcha không đúng hoặc đã hết hạn. Vui lòng thử lại.'); };
  if (!token || !answer) return fail();
  let p: { e: number; n: string; s: string };
  try { p = JSON.parse(Buffer.from(String(token), 'base64url').toString('utf8')); } catch { return fail(); }
  const now = Date.now();
  for (const [k, t] of used) if (t < now) used.delete(k);
  if (!p || typeof p.e !== 'number' || typeof p.n !== 'string' || typeof p.s !== 'string' || p.e < now || used.has(p.n)) return fail();
  const expected = Buffer.from(sign(String(answer).trim().toUpperCase(), p.e, p.n)); const got = Buffer.from(p.s);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return fail();
  used.set(p.n, p.e);
}
