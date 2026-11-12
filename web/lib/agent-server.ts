import type { ToolCtx } from './agent-tools';
import { serverApiGet, siteUrl } from './seo-landing';

/** Ngữ cảnh gọi API phía máy chủ (llms.txt, Markdown, MCP). Dữ liệu cache ngắn để giảm tải. */
export const serverCtx = (): ToolCtx => ({ site: siteUrl(), get: <T>(path: string) => serverApiGet<T>(path, 120, 6000) });
