import { handleMcpRequest, MCP_CORS } from '../../lib/mcp-server';
import { serverCtx } from '../../lib/agent-server';

export const dynamic = 'force-dynamic';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...MCP_CORS };

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 64_000) return new Response(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }), { status: 413, headers: JSON_HEADERS });
  const { status, body } = await handleMcpRequest(raw, serverCtx());
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: body === null ? { 'Cache-Control': 'no-store', ...MCP_CORS } : JSON_HEADERS });
}

// Không hỗ trợ luồng SSE do máy chủ khởi tạo (được phép theo đặc tả Streamable HTTP).
export function GET() {
  return new Response('Method Not Allowed: dùng POST với JSON-RPC (MCP Streamable HTTP).', { status: 405, headers: { Allow: 'POST, OPTIONS', 'Content-Type': 'text/plain; charset=utf-8', ...MCP_CORS } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: MCP_CORS });
}
