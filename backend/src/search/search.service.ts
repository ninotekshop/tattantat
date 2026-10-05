import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { convertAddress } from '../geo/vn-merge';

export type AttrFilter = { min?: number; max?: number; eq?: string[] };
export type SearchParams = { q?: string; categoryId?: number; categorySlug?: string; attrs?: Record<string, AttrFilter>; minPrice?: number; maxPrice?: number; condition?: string; location?: string; verified?: boolean; sort?: string; page?: number; limit?: number; since?: string };
const CONDITIONS = ['NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'FOR_PARTS'];
const SORTS: Record<string, string> = { new: 'p.published_at DESC NULLS LAST, p.id', old: 'p.published_at ASC NULLS LAST, p.id', price_asc: 'p.price ASC, p.id', price_desc: 'p.price DESC, p.id' };

/** attrs = JSON {"bedrooms":{"min":2},"legal":{"eq":["Sổ đỏ / Sổ hồng"]}} — lọc theo thuộc tính riêng của từng chuyên mục. */
export function parseAttrs(raw: unknown): Record<string, AttrFilter> | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  let obj: unknown = raw;
  if (typeof raw === 'string') { try { obj = JSON.parse(raw); } catch { throw new BadRequestException('Bộ lọc thuộc tính không hợp lệ'); } }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new BadRequestException('Bộ lọc thuộc tính không hợp lệ');
  const out: Record<string, AttrFilter> = {}; const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length > 12) throw new BadRequestException('Quá nhiều bộ lọc thuộc tính');
  for (const [key, v] of entries) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key) || !v || typeof v !== 'object') throw new BadRequestException('Bộ lọc thuộc tính không hợp lệ');
    const f = v as { min?: unknown; max?: unknown; eq?: unknown }; const one: AttrFilter = {};
    for (const k of ['min', 'max'] as const) { if (f[k] !== undefined && f[k] !== '') { const n = Number(f[k]); if (!Number.isFinite(n) || Math.abs(n) > 1e13) throw new BadRequestException('Bộ lọc thuộc tính không hợp lệ'); one[k] = n; } }
    if (f.eq !== undefined) { const arr = (Array.isArray(f.eq) ? f.eq : [f.eq]).map(x => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 10); if (arr.length) one.eq = arr; }
    if (Object.keys(one).length) out[key] = one;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Chuẩn hóa tham số tìm kiếm từ query string / JSON đã lưu; ném lỗi nếu không hợp lệ. */
export function sanitizeParams(raw: Record<string, unknown>): SearchParams {
  const num = (v: unknown, name: string, min = 0, max = 1e13) => { if (v === undefined || v === null || v === '') return undefined; const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) throw new BadRequestException(`${name} không hợp lệ`); return n; };
  const str = (v: unknown, max: number) => { const s = typeof v === 'string' ? v.trim().slice(0, max) : ''; return s || undefined; };
  const condition = str(raw.condition, 20);
  if (condition && !CONDITIONS.includes(condition)) throw new BadRequestException('Tình trạng không hợp lệ');
  const categorySlug = str(raw.categorySlug, 60);
  if (categorySlug && !/^[a-z0-9-]+$/.test(categorySlug)) throw new BadRequestException('Danh mục không hợp lệ');
  const p: SearchParams = { categorySlug, attrs: parseAttrs(raw.attrs), q: str(raw.q, 100), categoryId: num(raw.categoryId, 'Danh mục', 1, 1e9), minPrice: num(raw.minPrice, 'Giá tối thiểu'), maxPrice: num(raw.maxPrice, 'Giá tối đa'), condition, location: str(raw.location, 80), verified: raw.verified === true || raw.verified === 'true' || raw.verified === '1', sort: str(raw.sort, 12) };
  if (p.categoryId !== undefined && !Number.isInteger(p.categoryId)) throw new BadRequestException('Danh mục không hợp lệ');
  if (p.minPrice !== undefined && p.maxPrice !== undefined && p.minPrice > p.maxPrice) throw new BadRequestException('Khoảng giá không hợp lệ');
  if (p.location && /toàn quốc/i.test(p.location)) p.location = undefined;
  return p;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly log = new Logger('Search');
  private unaccent = false;
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS search_keyword_stats (keyword TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0, last_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS search_keyword_stats_last_idx ON search_keyword_stats(last_at DESC)`);
    } catch (e) { this.log.warn('Không tạo được bảng thống kê từ khóa: ' + (e instanceof Error ? e.message : String(e))); }
    try { await this.db.query('CREATE EXTENSION IF NOT EXISTS unaccent'); await this.db.query(`SELECT unaccent('ă')`); this.unaccent = true; }
    catch (e) { this.log.warn('Không bật được unaccent — tìm kiếm sẽ phân biệt dấu: ' + (e instanceof Error ? e.message : String(e))); }
  }

  private norm(expr: string) { return this.unaccent ? `unaccent(lower(${expr}))` : `lower(${expr})`; }

  buildWhere(p: SearchParams, viewerId?: string | null) {
    const values: unknown[] = []; const where = [`p.status='ACTIVE'`, 'p.deleted_at IS NULL'];
    const add = (v: unknown) => { values.push(v); return `$${values.length}`; };
    // Khớp theo TỪ (không khớp lẫn trong giữa từ): "may" không dính "nhanh", "cu" không dính "cung cấp".
    // Token ngắn (≤3 ký tự) phải khớp nguyên từ; token dài khớp phần đầu của từ.
    for (const token of (p.q ?? '').toLowerCase().split(/\s+/).map(t => t.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean).slice(0, 8)) {
      const t = add(token);
      const end = token.length <= 3 ? "|| '\\M'" : '';
      const re = `('\\m' || ${this.norm(t)} ${end})`;
      where.push(`(${this.norm('p.title')} ~ ${re} OR ${this.norm(`COALESCE(p.description,'')`)} ~ ${re})`);
    }
    if (p.categoryId) where.push(`p.category_id IN (WITH RECURSIVE tree AS (SELECT id FROM categories WHERE id=${add(p.categoryId)}::bigint UNION SELECT c.id FROM categories c JOIN tree t ON c.parent_id=t.id) SELECT id FROM tree)`);
    if (p.categorySlug) where.push(`p.category_id IN (WITH RECURSIVE tree AS (SELECT id FROM categories WHERE slug=${add(p.categorySlug)} UNION SELECT c.id FROM categories c JOIN tree t ON c.parent_id=t.id) SELECT id FROM tree)`);
    if (p.attrs) {
      const conds: string[] = [];
      for (const [key, f] of Object.entries(p.attrs)) {
        const k = add(key); const val = `(l.published_snapshot->'data'->'values'->>${k})`; const num = `(CASE WHEN ${val} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN ${val}::numeric END)`;
        if (f.min !== undefined) conds.push(`${num} >= ${add(f.min)}`);
        if (f.max !== undefined) conds.push(`${num} <= ${add(f.max)}`);
        if (f.eq) conds.push(`${val} = ANY(${add(f.eq)}::text[])`);
      }
      if (conds.length) where.push(`EXISTS (SELECT 1 FROM listings l WHERE l.product_id=p.id AND ${conds.join(' AND ')})`);
    }
    if (p.minPrice !== undefined) where.push(`p.price >= ${add(p.minPrice)}`);
    if (p.maxPrice !== undefined) where.push(`p.price <= ${add(p.maxPrice)}`);
    if (p.condition) where.push(`p.condition::text = ${add(p.condition)}`);
    if (p.location) where.push(`${this.norm(`COALESCE(p.address,'')`)} LIKE ${this.norm(add(`%${p.location.toLowerCase().replace(/[\\%_]/g, m => '\\' + m)}%`))}`);
    if (p.verified) where.push(`EXISTS (SELECT 1 FROM users u2 WHERE u2.id=p.seller_id AND COALESCE(u2.is_verified,false))`);
    if (p.since) where.push(`p.published_at > ${add(p.since)}::timestamptz`);
    if (viewerId) { const v = add(viewerId); where.push(`NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=${v}::uuid AND b.blocked_id=p.seller_id) OR (b.blocker_id=p.seller_id AND b.blocked_id=${v}::uuid))`); }
    return { sql: where.join(' AND '), values };
  }

  async search(raw: Record<string, unknown>, viewerId?: string | null) {
    const p = sanitizeParams(raw);
    const limit = Math.min(48, Math.max(1, Math.floor(Number(raw.limit) || 24)));
    const page = Math.min(500, Math.max(1, Math.floor(Number(raw.page) || 1)));
    const { sql, values } = this.buildWhere(p, viewerId);
    const order = SORTS[p.sort ?? 'new'] ?? SORTS.new;
    const [rows, total] = await Promise.all([
      this.db.query(`SELECT p.id, p.title, p.price::text, p.address, p.created_at, p.status::text, p.seller_id, p.listing_price_mode, u.full_name AS seller_name, COALESCE(u.is_verified,false) AS seller_verified,
        (SELECT l.published_snapshot->'data'->'values' FROM listings l WHERE l.product_id=p.id LIMIT 1) AS attrs,
        (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS image_url,
        EXISTS(SELECT 1 FROM listings lv WHERE lv.product_id=p.id AND CASE WHEN jsonb_typeof(lv.published_snapshot->'data'->'videos')='array' THEN jsonb_array_length(lv.published_snapshot->'data'->'videos')>0 ELSE false END) AS has_video
        FROM products p JOIN users u ON u.id=p.seller_id WHERE ${sql} ORDER BY ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`, values),
      this.db.query(`SELECT COUNT(*)::int AS n FROM products p WHERE ${sql}`, values),
    ]);
    const items = rows.rows.map((row: any) => ({ id: row.id, title: row.title, price: row.price, priceMode: row.listing_price_mode ?? 'FIXED', location: (row.address ? (convertAddress(row.address) ?? row.address) : null) ?? 'Chưa cập nhật', postedAt: row.created_at, sellerId: row.seller_id, sellerName: row.seller_name, sellerVerified: row.seller_verified, attrs: row.attrs ?? {}, imageUrl: row.image_url ?? '', hasVideo: !!row.has_video, images: row.image_url ? [row.image_url] : [], status: row.status }));
    void this.recordKeyword(p.q, page, total.rows[0].n as number);
    return { success: true, data: { items, total: total.rows[0].n as number, page, limit }, message: null, errorCode: null };
  }

  /** Ghi nhận từ khóa người dùng thực sự tìm (chỉ trang đầu, có kết quả) để làm "Từ khóa HOT". */
  private async recordKeyword(q: string | undefined, page: number, total: number) {
    const key = (q ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (page !== 1 || total < 1 || key.length < 2 || key.length > 40 || /[<>@]|\d{8,}/.test(key)) return;
    try {
      await this.db.query(`INSERT INTO search_keyword_stats(keyword,hits,last_at) VALUES($1,1,now()) ON CONFLICT(keyword) DO UPDATE SET hits=search_keyword_stats.hits+1, last_at=now()`, [key]);
    } catch { /* thống kê là phụ, không ảnh hưởng tìm kiếm */ }
  }

  /** Từ khóa được tìm nhiều nhất 30 ngày gần đây; thiếu thì bổ sung bằng từ khóa mặc định. */
  async hotKeywords(limit = 6) {
    const fallback = ['iPhone 15', 'Honda Vision', 'Chung cư Quy Nhơn', 'Tủ lạnh Inverter', 'Máy ảnh Canon', 'Laptop cũ'];
    let rows: Array<{ keyword: string }> = [];
    try {
      rows = (await this.db.query(`SELECT keyword FROM search_keyword_stats WHERE last_at > now() - interval '30 days' AND hits >= 2 ORDER BY hits DESC, last_at DESC LIMIT $1`, [limit])).rows as Array<{ keyword: string }>;
    } catch { /* dùng mặc định */ }
    const out = rows.map(r => r.keyword);
    for (const k of fallback) { if (out.length >= limit) break; if (!out.some(o => o.toLowerCase() === k.toLowerCase())) out.push(k); }
    return { success: true, data: out.slice(0, limit), message: null, errorCode: null };
  }

  /** Số tin mới khớp bộ lọc kể từ mốc `since` (dùng cho thông báo tìm kiếm đã lưu). */
  async countSince(p: SearchParams, since: string): Promise<{ n: number; sample: string | null }> {
    const { sql, values } = this.buildWhere({ ...p, since });
    const r = await this.db.query(`SELECT COUNT(*)::int AS n, (array_agg(p.title ORDER BY p.published_at DESC))[1] AS sample FROM products p WHERE ${sql}`, values);
    return { n: r.rows[0].n, sample: r.rows[0].sample };
  }

  /** Danh sách tin đang hiển thị cho sitemap.xml (tối đa 5.000 tin mới nhất). */
  async sitemap() {
    const r = await this.db.query(`SELECT id::text, COALESCE(updated_at, published_at, created_at) AS updated FROM products WHERE status='ACTIVE' AND deleted_at IS NULL ORDER BY published_at DESC NULLS LAST LIMIT 5000`);
    return { success: true, data: r.rows, message: null, errorCode: null };
  }
}
