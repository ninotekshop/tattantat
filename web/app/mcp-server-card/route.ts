import { MCP_CORS, serverCard } from '../../lib/mcp-server';
import { siteUrl } from '../../lib/seo-landing';

// Phục vụ tại /.well-known/mcp/server-card.json (xem rewrite trong next.config.ts).
export const dynamic = 'force-static';

export function GET() {
  return new Response(JSON.stringify(serverCard(siteUrl()), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...MCP_CORS },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: MCP_CORS });
}
