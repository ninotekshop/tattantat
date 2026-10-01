import { BadRequestException, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ModerationService } from '../admin/moderation.service';
import { FraudService } from '../fraud/fraud.service';
import { reviewListing } from '../ai/ai-review';

export type ModerationMode = 'AUTO' | 'MANUAL' | 'HYBRID';
export type ModerationSettings = {
  mode: ModerationMode;
  blockContactInfo: boolean;
  blockProhibited: boolean;
  prohibitedKeywords: string[];
  reviewKeywords: string[];
  newSellerReview: boolean;
  trustedMinApproved: number;
  trustedIfVerified: boolean;
  manualCategoryIds: string[];
  priceReviewThreshold: number | null;
  reviewEdits: boolean;
  aiReview: boolean;
  backlogReminder: boolean;
  backlogHours: number;
  backlogRepeatHours: number;
};
export const DEFAULT_SETTINGS: ModerationSettings = {
  mode: 'AUTO', blockContactInfo: true, blockProhibited: true, prohibitedKeywords: [], reviewKeywords: [],
  newSellerReview: true, trustedMinApproved: 3, trustedIfVerified: true, manualCategoryIds: [], priceReviewThreshold: null, reviewEdits: true, aiReview: true,
  backlogReminder: true, backlogHours: 4, backlogRepeatHours: 6,
};
export type Decision = { action: 'APPROVE' | 'PENDING_REVIEW' | 'REJECT' | 'NEEDS_CHANGES'; reasons: string[]; code?: string };
type Query = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }> };
const envelope = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });

const list = (value: unknown, max = 200): string[] => (Array.isArray(value) ? value : String(value ?? '').split('\n'))
  .map(item => String(item).trim().toLowerCase()).filter(item => item && item.length <= 80).filter((item, i, all) => all.indexOf(item) === i).slice(0, max);

/** Chính sách kiểm duyệt do Admin cấu hình: tự động, thủ công hoặc tự động có điều kiện. */
@Injectable()
export class ModerationPolicyService implements OnModuleInit {
  private readonly log = new Logger('ModerationPolicy');
  private cache: { at: number; value: ModerationSettings } | null = null;
  constructor(private readonly db: DatabaseService, private readonly rules: ModerationService, @Optional() private readonly fraud?: FraudService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by UUID)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS moderation_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL, actor_id UUID, source TEXT NOT NULL, decision TEXT NOT NULL, mode TEXT, reasons JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS moderation_events_product_idx ON moderation_events(product_id, created_at DESC)`);
    } catch (error) { this.log.error('Không khởi tạo được bảng kiểm duyệt: ' + (error instanceof Error ? error.message : String(error))); }
  }

  // ---------- cấu hình ----------
  sanitize(input: Partial<ModerationSettings>, base: ModerationSettings = DEFAULT_SETTINGS): ModerationSettings {
    const threshold = input.priceReviewThreshold === null || input.priceReviewThreshold === undefined || (input.priceReviewThreshold as unknown) === '' ? null : Math.trunc(Number(input.priceReviewThreshold));
    if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0 || threshold > 1e13)) throw new BadRequestException('Ngưỡng giá không hợp lệ.');
    const min = Math.trunc(Number(input.trustedMinApproved ?? base.trustedMinApproved));
    if (!Number.isFinite(min) || min < 0 || min > 1000) throw new BadRequestException('Số tin để được tin tưởng từ 0 đến 1000.');
    const hours = Math.trunc(Number(input.backlogHours ?? base.backlogHours)); const repeat = Math.trunc(Number(input.backlogRepeatHours ?? base.backlogRepeatHours));
    if (!Number.isFinite(hours) || hours < 1 || hours > 168) throw new BadRequestException('Thời gian chờ để nhắc từ 1 đến 168 giờ.');
    if (!Number.isFinite(repeat) || repeat < 1 || repeat > 72) throw new BadRequestException('Khoảng cách giữa các lần nhắc từ 1 đến 72 giờ.');
    const mode = input.mode ?? base.mode;
    if (!['AUTO', 'MANUAL', 'HYBRID'].includes(mode)) throw new BadRequestException('Chế độ kiểm duyệt không hợp lệ.');
    const categories = (input.manualCategoryIds ?? base.manualCategoryIds).map(String);
    if (categories.some(id => !/^\d{1,15}$/.test(id)) || categories.length > 300) throw new BadRequestException('Danh sách danh mục không hợp lệ.');
    return {
      mode, blockContactInfo: input.blockContactInfo ?? base.blockContactInfo, blockProhibited: input.blockProhibited ?? base.blockProhibited,
      prohibitedKeywords: list(input.prohibitedKeywords ?? base.prohibitedKeywords), reviewKeywords: list(input.reviewKeywords ?? base.reviewKeywords),
      newSellerReview: input.newSellerReview ?? base.newSellerReview, trustedMinApproved: min, trustedIfVerified: input.trustedIfVerified ?? base.trustedIfVerified,
      manualCategoryIds: categories.filter((id, i, all) => all.indexOf(id) === i), priceReviewThreshold: threshold, reviewEdits: input.reviewEdits ?? base.reviewEdits, aiReview: input.aiReview ?? base.aiReview,
      backlogReminder: input.backlogReminder ?? base.backlogReminder, backlogHours: hours, backlogRepeatHours: repeat,
    };
  }
  async settings(fresh = false): Promise<ModerationSettings> {
    if (!fresh && this.cache && Date.now() - this.cache.at < 15000) return this.cache.value;
    let value = DEFAULT_SETTINGS;
    try {
      const row = (await this.db.query(`SELECT value FROM app_settings WHERE key='moderation'`)).rows[0];
      if (row?.value) value = this.sanitize(row.value);
    } catch { /* dùng mặc định nếu bảng chưa sẵn sàng */ }
    this.cache = { at: Date.now(), value };
    return value;
  }
  async saveSettings(actorId: string, input: Partial<ModerationSettings>) {
    const value = this.sanitize(input, await this.settings(true));
    await this.db.query(`INSERT INTO app_settings(key,value,updated_by) VALUES('moderation',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by`, [JSON.stringify(value), actorId]);
    this.cache = { at: Date.now(), value };
    return envelope(value, 'Đã lưu cài đặt kiểm duyệt. Áp dụng ngay cho tin đăng mới.');
  }

  // ---------- quyết định ----------
  async decide(input: { sellerId: string; categoryId?: string | null; title: string; description?: string | null; price?: number | string | null; isEdit?: boolean }, executor?: Query): Promise<Decision> {
    const s = await this.settings();
    const db: Query = executor ?? this.db;
    const text = `${input.title ?? ''} ${input.description ?? ''}`;
    const base = this.rules.evaluate(input.title ?? '', input.description ?? '', input.price ?? undefined);
    const norm = this.rules.normalizeText(text);
    if (base.action === 'REJECT' && s.blockProhibited) return { action: 'REJECT', code: 'PROHIBITED_CONTENT', reasons: base.reasons.map(r => r.message) };
    const custom = s.prohibitedKeywords.find(word => norm.includes(word));
    if (custom && s.blockProhibited) return { action: 'REJECT', code: 'PROHIBITED_CONTENT', reasons: [`Nội dung tin đăng chứa từ khóa bị cấm: "${custom}"`] };
    if (base.action === 'NEEDS_CHANGES' && s.blockContactInfo) return { action: 'NEEDS_CHANGES', code: 'CONTACT_INFO_DETECTED', reasons: base.reasons.map(r => r.message) };

    const reasons: string[] = [];
    if (base.action === 'NEEDS_CHANGES') reasons.push('Nội dung có thông tin liên hệ ngoài nền tảng');
    if (base.action === 'REJECT') reasons.push('Nội dung có từ khóa nhạy cảm');
    if (s.mode === 'MANUAL') reasons.push('Chế độ duyệt thủ công: mọi tin đăng đều cần duyệt');
    if (s.mode === 'HYBRID') {
      const hit = s.reviewKeywords.find(word => norm.includes(word));
      if (hit) reasons.push(`Chứa từ khóa cần kiểm tra: "${hit}"`);
      const price = Number(input.price ?? 0);
      if (s.priceReviewThreshold !== null && Number.isFinite(price) && price >= s.priceReviewThreshold && price > 0) reasons.push(`Giá từ ${s.priceReviewThreshold.toLocaleString('vi-VN')} đ trở lên`);
      if (input.categoryId && s.manualCategoryIds.length) {
        const chain = (await db.query(`WITH RECURSIVE up AS (SELECT id, parent_id, 0 AS d FROM categories WHERE id=$1 UNION ALL SELECT c.id, c.parent_id, u.d+1 FROM categories c JOIN up u ON c.id=u.parent_id WHERE u.d<10) SELECT id::text FROM up`, [input.categoryId])).rows.map(r => r.id as string);
        if (chain.some(id => s.manualCategoryIds.includes(id))) reasons.push('Danh mục này luôn cần duyệt thủ công');
      }
      if (s.newSellerReview) {
        const seller = (await db.query(`SELECT COALESCE(u.is_verified,false) AS verified, (SELECT count(*)::int FROM products p WHERE p.seller_id=u.id AND p.status IN ('ACTIVE','SOLD','RESERVED') AND p.deleted_at IS NULL) AS approved FROM users u WHERE u.id=$1`, [input.sellerId])).rows[0];
        const trusted = !!seller && ((s.trustedIfVerified && seller.verified) || seller.approved >= s.trustedMinApproved);
        if (!trusted) reasons.push('Người bán mới chưa đủ số tin được duyệt');
      }
    }
    if (input.isEdit && !s.reviewEdits) return { action: 'APPROVE', reasons: [] };
    if (this.fraud && !input.isEdit) {
      await this.fraud.assertCanPost(executor ?? this.db, input.sellerId);
      reasons.push(...await this.fraud.duplicateReasons(executor ?? this.db, input.sellerId, input.title));
    }
    if (s.aiReview && !reasons.length) {
      const ai = await reviewListing({ title: input.title, description: input.description, price: input.price });
      if (ai?.verdict === 'REVIEW') reasons.push(...ai.reasons.map(r => `AI nghi ngờ: ${r}`));
    }
    return reasons.length ? { action: 'PENDING_REVIEW', reasons } : { action: 'APPROVE', reasons: [] };
  }

  async logEvent(productId: string, source: 'AUTO' | 'ADMIN', decision: string, reasons: string[], actorId?: string | null, executor?: Query) {
    try {
      const mode = (await this.settings()).mode;
      await (executor ?? this.db).query('INSERT INTO moderation_events(product_id,actor_id,source,decision,mode,reasons) VALUES($1,$2,$3,$4,$5,$6::jsonb)', [productId, actorId ?? null, source, decision, mode, JSON.stringify(reasons)]);
    } catch { /* nhật ký là phụ */ }
  }

  // ---------- hàng chờ duyệt ----------
  async queue() {
    const items = (await this.db.query(`SELECT p.id, p.title, p.price::text AS price, p.description, p.created_at AS "createdAt", p.updated_at AS "updatedAt",
        COALESCE(cat.name,'Khác') AS "categoryName", COALESCE(u.full_name,'Người dùng') AS "sellerName", u.email AS "sellerEmail", COALESCE(u.is_verified,false) AS "sellerVerified",
        (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS "imageUrl",
        (SELECT e.reasons FROM moderation_events e WHERE e.product_id=p.id AND e.decision='PENDING_REVIEW' ORDER BY e.created_at DESC LIMIT 1) AS reasons
      FROM products p LEFT JOIN categories cat ON cat.id::text=p.category_id::text LEFT JOIN users u ON u.id=p.seller_id
      WHERE p.status='PENDING_REVIEW' AND p.deleted_at IS NULL ORDER BY p.updated_at ASC LIMIT 200`)).rows;
    const stats = (await this.db.query(`SELECT
        (SELECT count(*) FROM products WHERE status='PENDING_REVIEW' AND deleted_at IS NULL)::int AS pending,
        (SELECT count(*) FROM moderation_events WHERE source='ADMIN' AND decision='APPROVED' AND created_at>=date_trunc('day',now()))::int AS "approvedToday",
        (SELECT count(*) FROM moderation_events WHERE source='ADMIN' AND decision='REJECTED' AND created_at>=date_trunc('day',now()))::int AS "rejectedToday",
        (SELECT count(*) FROM moderation_events WHERE source='AUTO' AND decision='APPROVED' AND created_at>=date_trunc('day',now()))::int AS "autoToday",
        (SELECT min(updated_at) FROM products WHERE status='PENDING_REVIEW' AND deleted_at IS NULL) AS "oldest"`)).rows[0];
    return envelope({ items, stats });
  }
  /** Số tin chờ duyệt và số tin đã chờ quá `hours` giờ. */
  async backlog(hours: number) {
    const row = (await this.db.query(`SELECT count(*)::int AS pending, count(*) FILTER (WHERE updated_at < now() - ($1::text||' hours')::interval)::int AS overdue, min(updated_at) AS oldest FROM products WHERE status='PENDING_REVIEW' AND deleted_at IS NULL`, [String(hours)])).rows[0];
    return { pending: row.pending as number, overdue: row.overdue as number, oldest: row.oldest as string | null };
  }
  async history() {
    return envelope((await this.db.query(`SELECT e.id, e.product_id AS "productId", p.title, e.source, e.decision, e.mode, e.reasons, e.created_at AS "createdAt", COALESCE(a.full_name,'') AS "actorName"
      FROM moderation_events e LEFT JOIN products p ON p.id=e.product_id LEFT JOIN users a ON a.id=e.actor_id ORDER BY e.created_at DESC LIMIT 60`)).rows);
  }
}
