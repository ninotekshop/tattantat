import { llmsTxt } from '../../lib/agent-content';
import { serverCtx } from '../../lib/agent-server';

// Tạo khi có yêu cầu (lúc build backend chưa chạy nên danh sách tin sẽ rỗng nếu tạo tĩnh).
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(await llmsTxt(serverCtx()), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
