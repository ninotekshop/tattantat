// Nội dung dành cho AI agent: robots.txt (Content-Signal), llms.txt và bản Markdown của các trang chính.
import { CATEGORY_ENGINE_TAXONOMY } from './marketplace';
import { SEO_AREAS, findLandingCategory, landingHref } from './seo-landing';
import { APP_LINKS, COMPANY, INFO_PAGES, SITE_DESCRIPTION, SITE_NAME, SITE_SLOGAN } from './site-info';
import { numericPrice, priceText, runTool, type ToolCtx } from './agent-tools';

type Obj = Record<string, unknown>;

export const DISALLOWED_PATHS = ['/adminttt', '/admin', '/account', '/orders', '/messages', '/notifications', '/vi-tien', '/goi-dich-vu', '/xac-minh', '/thanh-toan', '/api/', '/md/'];

/** Content-Signal: search=yes (cho tìm kiếm), ai-input=yes (agent được dùng nội dung để trả lời), ai-train=no (không dùng để huấn luyện mô hình). */
export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=no';

export function robotsTxt(site: string): string {
  return [
    'User-Agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map(p => `Disallow: ${p}`),
    `Content-Signal: ${CONTENT_SIGNAL}`,
    '',
    `Sitemap: ${site}/sitemap.xml`,
    '',
  ].join('\n');
}

const md = (s: unknown) => String(s ?? '').replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();

function listingLines(site: string, items: Obj[]): string[] {
  return items.map(p => `- [${md(p.title)}](${site}/products/${String(p.id)}) | ${priceText(p)} | ${md(p.location) || 'Chưa cập nhật'}`);
}

const agentSection = (site: string) => [
  `- [llms.txt](${site}/llms.txt): tóm tắt site cho AI`,
  `- [Sitemap](${site}/sitemap.xml): toàn bộ trang và tin đăng`,
  `- MCP server (Streamable HTTP, chỉ đọc, không cần đăng nhập): ${site}/mcp (công cụ: search_listings, get_listing, list_categories)`,
  `- [MCP Server Card](${site}/.well-known/mcp/server-card.json)`,
  `- Markdown: gửi header "Accept: text/markdown" khi tải trang chủ, trang danh mục /mua-ban/... và trang tin đăng /products/<id>`,
];

const categoryLines = (site: string) => CATEGORY_ENGINE_TAXONOMY.map(c => `- [${c.label}](${site}${landingHref(c.slug)}): ${c.subCategories.slice(0, 6).map(s => s.name).join(', ')}`);
const infoLines = (site: string) => INFO_PAGES.map(p => `- [${p.title}](${site}${p.path}): ${p.desc}`);

async function latest(ctx: ToolCtx, limit: number, extra = ''): Promise<{ items: Obj[]; total: number } | null> {
  const res = await ctx.get<{ items?: Obj[]; total?: number }>(`/search/products?sort=new&limit=${limit}${extra}`);
  return res && Array.isArray(res.items) ? { items: res.items, total: res.total ?? res.items.length } : null;
}

export async function llmsTxt(ctx: ToolCtx): Promise<string> {
  const { site } = ctx;
  const res = await latest(ctx, 20);
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `${SITE_NAME} (${site.replace(/^https?:\/\//, '')}) là sàn rao vặt, kết nối người mua và người bán trực tiếp, tập trung vào Quy Nhơn (Gia Lai) và toàn quốc. ${SITE_SLOGAN} Vận hành bởi ${COMPANY.legalName}, ${COMPANY.addressLine}. Email ${COMPANY.email}, hotline ${COMPANY.phoneDisplay}. Giá hiển thị bằng đồng Việt Nam (VND). Ứng dụng: [Google Play](${APP_LINKS.android}), [App Store](${APP_LINKS.ios}).`,
    '',
    '## Trang thông tin',
    '',
    ...infoLines(site),
    '',
    '## Danh mục',
    '',
    ...categoryLines(site),
    '',
    '## Tin đăng mới nhất',
    '',
    ...(res && res.items.length ? listingLines(site, res.items) : [`- [Xem tin mới](${site}/): danh sách tin đăng mới nhất`]),
    '',
    '## Dành cho AI agent',
    '',
    ...agentSection(site),
    '',
  ].join('\n');
}

export async function homeMarkdown(ctx: ToolCtx): Promise<string> {
  const { site } = ctx;
  const res = await latest(ctx, 24);
  return [
    `# ${SITE_NAME} - Chợ mua bán đồ cũ và mới, đăng tin miễn phí gần bạn`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Trang chủ: ${site}/ | Liên hệ: ${COMPANY.email}, ${COMPANY.phoneDisplay}`,
    '',
    '## Danh mục',
    '',
    ...categoryLines(site),
    '',
    `## Tin đăng mới nhất${res ? ` (${res.items.length}/${res.total})` : ''}`,
    '',
    ...(res && res.items.length ? listingLines(site, res.items) : ['Chưa tải được danh sách tin.']),
    '',
    '## Thông tin',
    '',
    ...infoLines(site),
    '',
    '## Dành cho AI agent',
    '',
    ...agentSection(site),
    '',
  ].join('\n');
}

export async function categoriesMarkdown(ctx: ToolCtx): Promise<string> {
  const { site } = ctx;
  return [
    `# Danh mục sản phẩm - ${SITE_NAME}`,
    '',
    ...CATEGORY_ENGINE_TAXONOMY.flatMap(c => [`## [${c.label}](${site}${landingHref(c.slug)})`, '', ...c.subCategories.map(s => `- [${s.name}](${site}${landingHref(s.slug)})`), '']),
  ].join('\n');
}

/** /mua-ban/<danh-muc>[/<khu-vuc>]; trả null nếu đường dẫn không hợp lệ. */
export async function landingMarkdown(ctx: ToolCtx, slug: string[]): Promise<string | null> {
  const { site } = ctx;
  if (slug.length < 1 || slug.length > 2) return null;
  const target = findLandingCategory(slug[0]);
  if (!target) return null;
  const area = slug[1] ? SEO_AREAS.find(a => a.slug === slug[1]) : undefined;
  if (slug[1] && !area) return null;
  const qs = `&categorySlug=${encodeURIComponent(target.slug)}${area ? `&location=${encodeURIComponent(area.label)}` : ''}`;
  const res = await latest(ctx, 48, qs);
  const where = area ? ` tại ${area.label}` : '';
  return [
    `# Mua bán ${target.name}${where} - ${SITE_NAME}`,
    '',
    `> ${res?.total ?? 0} tin đăng ${target.name.toLowerCase()} cũ và mới${where}.`,
    '',
    `Trang HTML: ${site}${landingHref(target.slug, area?.slug)}`,
    '',
    '## Tin đăng',
    '',
    ...(res && res.items.length ? listingLines(site, res.items) : ['Chưa có tin trong mục này.']),
    '',
    '## Khu vực khác',
    '',
    ...(area ? [`- [Toàn quốc](${site}${landingHref(target.slug)})`] : []),
    ...SEO_AREAS.filter(a => a.slug !== area?.slug).map(a => `- [${target.name} tại ${a.label}](${site}${landingHref(target.slug, a.slug)})`),
    '',
  ].join('\n');
}

export async function productMarkdown(ctx: ToolCtx, id: string): Promise<string | null> {
  const r = await runTool('get_listing', { id }, ctx);
  if (!r.ok) return null;
  const p = r.data as Obj;
  const n = numericPrice(String(p.price_vnd ?? ''));
  return [
    `# ${md(p.title)}`,
    '',
    `- Giá: ${String(p.price_text)}${n !== null ? ` (${n} VND)` : ''}`,
    `- Khu vực: ${md(p.location) || 'Chưa cập nhật'}`,
    ...(p.condition ? [`- Tình trạng: ${md(p.condition)}`] : []),
    ...(p.posted_at ? [`- Ngày đăng: ${String(p.posted_at).slice(0, 10)}`] : []),
    `- Người bán: ${md((p.seller as Obj | undefined)?.name) || 'Ẩn danh'}${(p.seller as Obj | undefined)?.verified ? ' (đã xác thực)' : ''}`,
    `- Trang HTML: ${String(p.url)}`,
    '',
    '## Mô tả',
    '',
    String(p.description ?? 'Chưa có mô tả.'),
    '',
    ...(Array.isArray(p.images) && p.images.length ? ['## Ảnh', '', ...(p.images as string[]).map(u => `- ${u}`), ''] : []),
  ].join('\n');
}

export function contactMarkdown(site: string): string {
  return [
    `# Liên hệ ${SITE_NAME}`,
    '',
    `- Công ty: ${COMPANY.legalName}`,
    `- Email hỗ trợ: ${COMPANY.email}`,
    `- Hotline CSKH: ${COMPANY.phoneDisplay}`,
    `- Địa chỉ: ${COMPANY.addressLine}`,
    `- Trang HTML: ${site}/contact`,
    '',
  ].join('\n');
}
