import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type FieldDef = { key: string; label: string; type: string; config?: { unit?: string }; options?: { value: string; label: string }[] };
const AREA_KEYS = ['usable_area', 'land_area', 'area'];
const num = (v: unknown) => { const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };

/** Định dạng giá trị thuộc tính theo kiểu trường của biểu mẫu để hiển thị cho người mua. */
export function formatSpec(f: FieldDef, v: unknown): string | null {
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return null;
  if (f.type === 'boolean') return v === true || v === 'true' ? 'Có' : v === false || v === 'false' ? 'Không' : null;
  if (Array.isArray(v)) return v.map(x => f.options?.find(o => o.value === x)?.label ?? String(x)).join(', ');
  if (f.type === 'currency') { const n = num(v); return n === null ? null : `${n.toLocaleString('vi-VN')} đ`; }
  if (f.type === 'number') { const n = num(v); return n === null ? null : `${n.toLocaleString('vi-VN')}${f.config?.unit ? ' ' + f.config.unit : ''}`; }
  const label = f.options?.find(o => o.value === v)?.label ?? String(v);
  return label.slice(0, 200);
}

@Injectable()
export class SpecsService {
  constructor(private readonly db: DatabaseService) {}

  private async load(productId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new BadRequestException('Mã sản phẩm không hợp lệ');
    const r = (await this.db.query(`SELECT p.id, p.price::text AS price, p.category_id, p.address, p.listing_price_mode, l.published_snapshot,
        COALESCE((WITH RECURSIVE up AS (SELECT id, parent_id, slug FROM categories WHERE id=p.category_id UNION ALL SELECT c.id, c.parent_id, c.slug FROM categories c JOIN up ON c.id=up.parent_id) SELECT array_agg(slug) FROM up), ARRAY[]::text[]) AS slugs
      FROM products p LEFT JOIN listings l ON l.product_id=p.id WHERE p.id=$1 AND p.status='ACTIVE' AND p.deleted_at IS NULL`, [productId])).rows[0];
    if (!r) throw new NotFoundException('Không tìm thấy sản phẩm');
    return r;
  }

  /** Thông số thật của tin (theo biểu mẫu chuyên mục) + nhóm chuyên mục để hiển thị công cụ phù hợp. */
  async specs(productId: string) {
    const r = await this.load(productId);
    const data = r.published_snapshot?.data ?? {}; const fields: FieldDef[] = r.published_snapshot?.template?.fields ?? [];
    const values = (data.values ?? {}) as Record<string, unknown>;
    const rows = fields.filter(f => (f as { enabled?: boolean }).enabled !== false).map(f => ({ key: f.key, label: f.label, value: formatSpec(f, values[f.key]) })).filter(x => x.value);
    const vertical = r.slugs.includes('bat-dong-san') ? 'PROPERTY' : r.slugs.includes('xe-co') ? 'VEHICLE' : null;
    const area = AREA_KEYS.map(k => num(values[k])).find(v => v && v > 0) ?? null;
    const price = /^\d+(\.\d+)?$/.test(r.price) ? Number(r.price) : null;
    return { success: true, data: { productId, specs: rows, vertical, categorySlugs: r.slugs, priceMode: r.listing_price_mode ?? 'FIXED', price, area, dealType: (values.deal_type as string) ?? null, year: num(values.year), condition: data.condition ?? null }, message: null, errorCode: null };
  }

  /** So sánh giá với các tin tương tự đang bán (cùng chuyên mục & cùng cách tính giá; BĐS so theo giá/m²). */
  async market(productId: string) {
    const r = await this.load(productId);
    const values = (r.published_snapshot?.data?.values ?? {}) as Record<string, unknown>;
    const price = Number(r.price); if (!Number.isFinite(price) || price <= 0) return { success: true, data: { available: false, reason: 'Tin chưa có giá cụ thể để so sánh.' }, message: null, errorCode: null };
    const isProperty = r.slugs.includes('bat-dong-san');
    const area = isProperty ? AREA_KEYS.map(k => num(values[k])).find(v => v && v > 0) ?? null : null;
    const metric = area ? `p.price / NULLIF((SELECT COALESCE(NULLIF(l.published_snapshot->'data'->'values'->>'usable_area','')::numeric, NULLIF(l.published_snapshot->'data'->'values'->>'land_area','')::numeric, NULLIF(l.published_snapshot->'data'->'values'->>'area','')::numeric) FROM listings l WHERE l.product_id=p.id), 0)` : 'p.price';
    const mine = area ? price / area : price;
    const region = String(r.address ?? '').split(',').map((x: string) => x.trim()).filter(Boolean).at(-1) ?? '';
    const q = (byRegion: boolean) => this.db.query(`SELECT COUNT(*)::int AS n, AVG(m)::float AS avg, MIN(m)::float AS min, MAX(m)::float AS max, percentile_cont(0.5) WITHIN GROUP (ORDER BY m)::float AS median, (COUNT(*) FILTER (WHERE m < $3))::int AS cheaper
      FROM (SELECT ${metric} AS m FROM products p WHERE p.status='ACTIVE' AND p.deleted_at IS NULL AND p.id<>$1 AND p.category_id=$2 AND p.price > 0 AND p.listing_price_mode=$4 ${byRegion ? "AND p.address ILIKE '%' || $5 || '%'" : ''}) t WHERE m IS NOT NULL`, byRegion ? [productId, r.category_id, mine, r.listing_price_mode ?? 'FIXED', region] : [productId, r.category_id, mine, r.listing_price_mode ?? 'FIXED']);
    let scope = region ? 'khu vực' : 'toàn quốc'; let row = region ? (await q(true)).rows[0] : (await q(false)).rows[0];
    if (region && row.n < 3) { row = (await q(false)).rows[0]; scope = 'toàn quốc'; }
    if (row.n < 3) return { success: true, data: { available: false, reason: 'Chưa đủ tin tương tự để so sánh.' }, message: null, errorCode: null };
    const diffPct = row.median ? Math.round(((mine - row.median) / row.median) * 100) : null;
    return { success: true, data: { available: true, unit: area ? 'VND_PER_M2' : 'VND', scope, region: scope === 'khu vực' ? region : null, sampleSize: row.n, mine, median: row.median, avg: row.avg, min: row.min, max: row.max, cheaperThanPercent: Math.round((row.cheaper / row.n) * 100), diffPercentVsMedian: diffPct }, message: null, errorCode: null };
  }
}
