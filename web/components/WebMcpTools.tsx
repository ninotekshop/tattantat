'use client';

import { useEffect } from 'react';
import { TOOLS, runTool } from '../lib/agent-tools';

// WebMCP: đăng ký công cụ cho AI agent chạy trong trình duyệt (navigator.modelContext). Trình duyệt không hỗ trợ thì bỏ qua.
type ModelContext = {
  registerTool?: (tool: unknown) => unknown;
  unregisterTool?: (name: string) => void;
  provideContext?: (ctx: { tools: unknown[] }) => void;
};

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch('/api/v1' + path, { headers: { Accept: 'application/json' } });
    const j = (await res.json()) as { success?: boolean; data?: T };
    return j?.success ? (j.data as T) : null;
  } catch {
    return null;
  }
}

export function WebMcpTools() {
  useEffect(() => {
    const mc = (navigator as unknown as { modelContext?: ModelContext }).modelContext;
    if (!mc) return;
    const ctx = { site: window.location.origin, get };
    const tools: { name: string; description: string; inputSchema: unknown; annotations: unknown; execute: (args: unknown) => Promise<unknown> }[] = TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: t.annotations,
      async execute(args: unknown) {
        const r = await runTool(t.name, args, ctx);
        return { content: [{ type: 'text', text: JSON.stringify(r.data) }], isError: !r.ok };
      },
    }));
    tools.push({
      name: 'show_search_results',
      description: 'Mở trang kết quả tìm kiếm của Tất Tần Tật trên màn hình để người dùng xem trực tiếp.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 100, description: 'Từ khóa cần tìm.' } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: true },
      async execute(args: unknown) {
        const q = String((args as { query?: unknown } | null)?.query ?? '').trim().slice(0, 100);
        window.location.assign('/?q=' + encodeURIComponent(q));
        return { content: [{ type: 'text', text: q ? `Đã mở kết quả tìm kiếm cho "${q}".` : 'Đã mở trang chủ.' }] };
      },
    });
    const registered: string[] = [];
    try {
      if (typeof mc.registerTool === 'function') {
        for (const t of tools) {
          try { mc.registerTool(t); registered.push(t.name); } catch { /* tên đã đăng ký hoặc trình duyệt từ chối */ }
        }
      } else if (typeof mc.provideContext === 'function') {
        mc.provideContext({ tools });
      }
    } catch { /* bỏ qua */ }
    return () => {
      for (const n of registered) { try { mc.unregisterTool?.(n); } catch { /* bỏ qua */ } }
    };
  }, []);
  return null;
}
