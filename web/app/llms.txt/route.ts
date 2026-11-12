import { llmsTxt } from '../../lib/agent-content';
import { serverCtx } from '../../lib/agent-server';
import { rateLimit } from '../../lib/rate-limit';

// Tạo khi có yêu cầu (lúc build backend chưa chạy nên danh sách tin sẽ rỗng nếu tạo tĩnh).
export const dynamic = 'force-dynamic';

let cached: { at: number; body: string } | null = null;

export async function GET(req: Request) {
  const limited = rateLimit(req, 'llms', 30);
  if (limited) return limited;
  // Lưu bản dựng trong bộ nhớ 10 phút để bot không bắt máy chủ gọi API liên tục.
  if (!cached || Date.now() - cached.at > 600_000) cached = { at: Date.now(), body: await llmsTxt(serverCtx()) };
  return new Response(cached.body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
}
