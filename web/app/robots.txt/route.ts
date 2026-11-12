import { robotsTxt } from '../../lib/agent-content';
import { siteUrl } from '../../lib/seo-landing';

// Thay cho robots.ts: Next.js không hỗ trợ dòng Content-Signal nên robots.txt được tạo thủ công.
export const dynamic = 'force-static';

export function GET() {
  return new Response(robotsTxt(siteUrl()), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
