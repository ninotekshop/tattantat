// Giới hạn tần suất theo IP (trong bộ nhớ) cho các route dành cho bot/agent, tránh crawler dồn dập làm quá tải máy chủ.
const hits = new Map<string, { n: number; reset: number }>();

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
}

/** Trả về Response 429 nếu IP vượt quá `limit` yêu cầu mỗi `windowMs`; ngược lại trả null. */
export function rateLimit(req: Request, key: string, limit = 30, windowMs = 60_000): Response | null {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const id = `${key}:${clientIp(req)}`;
  const cur = hits.get(id);
  if (!cur || cur.reset < now) { hits.set(id, { n: 1, reset: now + windowMs }); return null; }
  cur.n += 1;
  if (cur.n <= limit) return null;
  return new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': String(Math.ceil((cur.reset - now) / 1000)), 'Cache-Control': 'no-store' } });
}
