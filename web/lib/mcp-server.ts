// Máy chủ MCP (Streamable HTTP, không trạng thái, chỉ đọc) cho Tất Tần Tật + Server Card.
import { TOOLS, runTool, type ToolCtx } from './agent-tools';
import { COMPANY, SITE_DESCRIPTION } from './site-info';

export const MCP_SERVER_INFO = { name: 'tattantat-marketplace', title: 'Tất Tần Tật - Chợ mua bán gần bạn', version: '1.0.0' };
export const MCP_LATEST = '2025-06-18';
const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05'];
const INSTRUCTIONS = 'Máy chủ chỉ đọc cho tattantat.vn. Dùng list_categories để biết slug danh mục, search_listings để tìm tin (giá bằng VND), get_listing để xem chi tiết. Không thể đăng tin hay đặt hàng qua MCP; người dùng thực hiện trên web hoặc ứng dụng.';

export const MCP_CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, accept, mcp-protocol-version, mcp-session-id',
  'Access-Control-Max-Age': '86400',
};

type Id = string | number | null;
type Rpc = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown; result?: unknown; error?: unknown };
const rpcError = (id: Id, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });
const rpcOk = (id: Id, result: unknown) => ({ jsonrpc: '2.0', id, result });
const toolDescriptors = () => TOOLS.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations }));

async function handleOne(msg: unknown, ctx: ToolCtx): Promise<unknown | null> {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return rpcError(null, -32600, 'Invalid Request');
  const m = msg as Rpc;
  const hasId = typeof m.id === 'string' || typeof m.id === 'number';
  const id: Id = hasId ? (m.id as string | number) : null;
  if (typeof m.method !== 'string') return 'result' in m || 'error' in m ? null : rpcError(id, -32600, 'Invalid Request');
  if (m.jsonrpc !== '2.0') return rpcError(id, -32600, 'Invalid Request');
  if (!hasId) return null; // notification (vd notifications/initialized): không cần trả lời

  const params = (m.params && typeof m.params === 'object' ? m.params : {}) as Record<string, unknown>;
  switch (m.method) {
    case 'initialize': {
      const wanted = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      return rpcOk(id, {
        protocolVersion: SUPPORTED.includes(wanted) ? wanted : MCP_LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return rpcOk(id, {});
    case 'tools/list':
      return rpcOk(id, { tools: toolDescriptors() });
    case 'tools/call': {
      const name = params.name;
      if (typeof name !== 'string' || !TOOLS.some(t => t.name === name)) return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
      try {
        const r = await runTool(name, params.arguments, ctx);
        const structured = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? { structuredContent: r.data } : {};
        return rpcOk(id, { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }], ...structured, isError: !r.ok });
      } catch {
        return rpcOk(id, { content: [{ type: 'text', text: 'Lỗi khi chạy công cụ, hãy thử lại sau.' }], isError: true });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${m.method}`);
  }
}

export async function handleMcpRequest(raw: string, ctx: ToolCtx): Promise<{ status: number; body: unknown | null }> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { status: 400, body: rpcError(null, -32700, 'Parse error') }; }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0 || parsed.length > 20) return { status: 400, body: rpcError(null, -32600, 'Invalid Request') };
    const out = (await Promise.all(parsed.map(x => handleOne(x, ctx)))).filter(x => x !== null);
    return out.length ? { status: 200, body: out } : { status: 202, body: null };
  }
  const one = await handleOne(parsed, ctx);
  return one === null ? { status: 202, body: null } : { status: 200, body: one };
}

/** MCP Server Card (SEP-1649), phục vụ tại /.well-known/mcp/server-card.json. */
export function serverCard(site: string) {
  return {
    $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
    name: MCP_SERVER_INFO.name,
    title: MCP_SERVER_INFO.title,
    version: MCP_SERVER_INFO.version,
    description: `Tìm tin mua bán, xem chi tiết tin và danh mục trên Tất Tần Tật. ${SITE_DESCRIPTION}`,
    protocolVersion: MCP_LATEST,
    serverInfo: MCP_SERVER_INFO,
    endpoint: `${site}/mcp`,
    transport: { type: 'streamable-http', endpoint: '/mcp', url: `${site}/mcp` },
    capabilities: { tools: { listChanged: false } },
    authentication: { required: false },
    tools: toolDescriptors().map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
    provider: { name: COMPANY.legalName, url: `${site}/`, contact: COMPANY.email },
    documentationUrl: `${site}/llms.txt`,
    iconUrl: `${site}/assets/logo.png`,
  };
}
