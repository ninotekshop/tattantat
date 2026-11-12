import { categoriesMarkdown, contactMarkdown, homeMarkdown, landingMarkdown, productMarkdown } from '../../../lib/agent-content';
import { serverCtx } from '../../../lib/agent-server';
import { rateLimit } from '../../../lib/rate-limit';

// Bản Markdown của các trang chính. Không gọi trực tiếp: next.config.ts rewrite sang đây khi trình khách gửi "Accept: text/markdown".
export const dynamic = 'force-dynamic';

// no-store để CDN không lưu bản Markdown rồi trả nhầm cho trình duyệt; Vary vì nội dung phụ thuộc header Accept.
const HEADERS = { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept', 'Cache-Control': 'private, no-store' };

export async function GET(req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const limited = rateLimit(req, 'md', 30);
  if (limited) return limited;
  const path = ((await params).path ?? []).map(s => { try { return decodeURIComponent(s); } catch { return s; } });
  const ctx = serverCtx();
  let body: string | null = null;
  if (path.length === 0) body = await homeMarkdown(ctx);
  else if (path[0] === 'mua-ban') body = await landingMarkdown(ctx, path.slice(1));
  else if (path[0] === 'products' && path.length === 2) body = await productMarkdown(ctx, path[1]);
  else if (path[0] === 'categories' && path.length === 1) body = await categoriesMarkdown(ctx);
  else if (path[0] === 'contact' && path.length === 1) body = contactMarkdown(ctx.site);
  if (body === null) return new Response('# Không tìm thấy trang\n', { status: 404, headers: HEADERS });
  return new Response(body, { headers: { ...HEADERS, Link: `<${ctx.site}/${path.join('/')}>; rel="canonical"` } });
}
