// Công cụ chỉ-đọc cho AI agent: dùng chung cho máy chủ MCP (/mcp) và WebMCP trên trình duyệt.
// Không import gì phụ thuộc Node/Next để chạy được ở cả hai nơi.
import { CATEGORY_ENGINE_TAXONOMY } from './marketplace';
import { SEO_AREAS, findLandingCategory, landingHref } from './seo-landing';

export type ToolCtx = { site: string; get: <T>(path: string) => Promise<T | null> };
export type ToolResult = { ok: boolean; data: unknown };
type Obj = Record<string, unknown>;

const NUMERIC_PRICE = /^\d+(\.0+)?$/;
const UUID = /^[0-9a-f-]{36}$/i;

export const money = (n: number) => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
export const numericPrice = (price: unknown): number | null => (typeof price === 'string' && NUMERIC_PRICE.test(price) ? Number(price) : null);
export function priceText(p: Obj): string {
  const n = numericPrice(p.price);
  if (p.priceMode === 'FREE' || n === 0) return 'Miễn phí';
  return n === null ? 'Liên hệ' : money(n);
}
const abs = (site: string, u: unknown) => (typeof u === 'string' && u ? (/^https?:\/\//i.test(u) ? u : site + (u.startsWith('/') ? '' : '/') + u) : null);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const int = (v: unknown, min: number, max: number, dflt?: number) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : dflt;
};

/** Chấp nhận slug danh mục cha/con (vd "may-anh", "do-cong-nghe") hoặc mã danh mục (vd "technology"). */
export function resolveCategorySlug(input: string): string | null {
  const hit = findLandingCategory(input);
  if (hit) return hit.slug;
  return CATEGORY_ENGINE_TAXONOMY.find(c => c.key === input)?.slug ?? null;
}

export const TOOLS = [
  {
    name: 'search_listings',
    title: 'Tìm tin đăng',
    description: 'Tìm tin mua bán trên Tất Tần Tật (chợ rao vặt tại Quy Nhơn và toàn quốc) theo từ khóa, danh mục, khu vực và khoảng giá (VND). Trả về tin mới nhất kèm giá, khu vực và liên kết.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', maxLength: 100, description: 'Từ khóa, ví dụ "Canon R50" hoặc "iPhone 15".' },
        category: { type: 'string', description: 'Slug danh mục lấy từ list_categories, ví dụ "may-anh", "xe-may", "do-cong-nghe".' },
        location: { type: 'string', maxLength: 60, description: 'Khu vực, ví dụ "Quy Nhơn", "Bình Định", "Gia Lai".' },
        min_price: { type: 'integer', minimum: 0, description: 'Giá thấp nhất (VND).' },
        max_price: { type: 'integer', minimum: 0, description: 'Giá cao nhất (VND).' },
        limit: { type: 'integer', minimum: 1, maximum: 24, default: 10, description: 'Số tin tối đa (1-24).' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_listing',
    title: 'Xem chi tiết tin đăng',
    description: 'Lấy chi tiết một tin đăng (tiêu đề, giá, mô tả, tình trạng, khu vực, ảnh, người bán) theo mã tin.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Mã tin (UUID), lấy từ search_listings.' } }, required: ['id'], additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'list_categories',
    title: 'Danh sách danh mục',
    description: 'Liệt kê các danh mục (và danh mục con) của Tất Tần Tật cùng liên kết trang danh mục theo khu vực.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
] as const;

export type ToolName = (typeof TOOLS)[number]['name'];

export async function runTool(name: string, args: unknown, ctx: ToolCtx): Promise<ToolResult> {
  const a: Obj = args && typeof args === 'object' && !Array.isArray(args) ? (args as Obj) : {};
  const { site } = ctx;

  if (name === 'search_listings') {
    const q = text(a.query, 100);
    const location = text(a.location, 60);
    const categoryInput = text(a.category, 80);
    const limit = int(a.limit, 1, 24, 10)!;
    const qs = new URLSearchParams({ sort: 'new', limit: String(limit) });
    if (q) qs.set('q', q);
    if (location) qs.set('location', location);
    if (categoryInput) {
      const slug = resolveCategorySlug(categoryInput);
      if (!slug) return { ok: false, data: { error: `Không có danh mục "${categoryInput}". Gọi list_categories để xem danh sách hợp lệ.` } };
      qs.set('categorySlug', slug);
    }
    const min = int(a.min_price, 0, 1e12);
    const max = int(a.max_price, 0, 1e12);
    if (min !== undefined) qs.set('minPrice', String(min));
    if (max !== undefined) qs.set('maxPrice', String(max));
    const res = await ctx.get<{ items?: Obj[]; total?: number }>(`/search/products?${qs}`);
    if (!res || !Array.isArray(res.items)) return { ok: false, data: { error: 'Không tải được dữ liệu từ Tất Tần Tật, hãy thử lại sau.' } };
    const items = res.items.map(p => ({
      id: p.id, title: p.title, price_vnd: numericPrice(p.price), price_text: priceText(p), currency: 'VND',
      location: p.location ?? null, posted_at: p.postedAt ?? null, url: `${site}/products/${String(p.id)}`, image_url: abs(site, p.imageUrl),
    }));
    return { ok: true, data: { total: res.total ?? items.length, count: items.length, items, search_page: q ? `${site}/?q=${encodeURIComponent(q)}` : `${site}/` } };
  }

  if (name === 'get_listing') {
    const id = text(a.id, 64);
    if (!UUID.test(id)) return { ok: false, data: { error: 'Mã tin không hợp lệ (cần UUID từ search_listings).' } };
    const p = await ctx.get<Obj>(`/products/${encodeURIComponent(id)}`);
    if (!p || typeof p !== 'object') return { ok: false, data: { error: 'Không tìm thấy tin đăng hoặc tin đã bị gỡ.' } };
    const images = Array.isArray(p.images) ? (p.images as unknown[]).map(x => abs(site, x)).filter(Boolean) : p.imageUrl ? [abs(site, p.imageUrl)] : [];
    return {
      ok: true,
      data: {
        id: p.id, title: p.title, price_vnd: numericPrice(p.price), price_text: priceText(p), currency: 'VND',
        description: text(p.description, 2000) || null, condition: p.condition ?? null, location: p.location ?? null,
        posted_at: p.postedAt ?? null, images, seller: { name: p.sellerName ?? null, verified: Boolean(p.sellerVerified) },
        url: `${site}/products/${String(p.id ?? id)}`,
      },
    };
  }

  if (name === 'list_categories') {
    return {
      ok: true,
      data: {
        areas: SEO_AREAS.map(x => ({ slug: x.slug, name: x.label })),
        categories: CATEGORY_ENGINE_TAXONOMY.map(c => ({
          slug: c.slug, name: c.label, url: site + landingHref(c.slug), url_quy_nhon: site + landingHref(c.slug, 'quy-nhon'),
          subcategories: c.subCategories.map(s => ({ slug: s.slug, name: s.name, url: site + landingHref(s.slug) })),
        })),
      },
    };
  }

  return { ok: false, data: { error: `Không có công cụ "${name}".` } };
}
