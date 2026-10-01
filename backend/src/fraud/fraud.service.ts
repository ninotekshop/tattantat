import { BadRequestException, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type FraudSettings = {
  chatWarnings: boolean;            // gắn cảnh báo lên tin nhắn có dấu hiệu lừa đảo
  newAccountDays: number;           // tài khoản trẻ hơn số ngày này (và chưa xác minh) bị coi là "mới"
  newAccountBlockContactInChat: boolean; // chặn tài khoản mới gửi SĐT / link / mời liên hệ ngoài sàn trong chat
  newAccountDailyListings: number;  // số tin tối đa mỗi 24 giờ của tài khoản mới (0 = không giới hạn)
  duplicateCheck: boolean;          // phát hiện tin trùng tiêu đề, đưa vào hàng chờ duyệt
};
export const FRAUD_DEFAULTS: FraudSettings = { chatWarnings: true, newAccountDays: 7, newAccountBlockContactInChat: true, newAccountDailyListings: 5, duplicateCheck: true };
type Query = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }> };

export const FLAG_TEXT: Record<string, string> = {
  ADVANCE_PAYMENT: 'yêu cầu chuyển khoản/đặt cọc trước', OFF_PLATFORM: 'mời liên hệ ngoài Tất Tần Tật', PHONE: 'có số điện thoại', LINK: 'có đường link', BANK_ACCOUNT: 'có số tài khoản ngân hàng', OTP_REQUEST: 'hỏi mã OTP / thông tin cá nhân',
};
const rules: { flag: string; test: RegExp }[] = [
  { flag: 'ADVANCE_PAYMENT', test: /(chuyển khoản|chuyen khoan|ck|đặt cọc|dat coc|cọc|coc|ứng trước|ung truoc|thanh toán trước|thanh toan truoc)[^.\n]{0,20}(trước|truoc)|(cọc|coc) (trước|truoc|giữ (hàng|máy|xe))|ship cod.{0,20}(cọc|coc)/i },
  { flag: 'OFF_PLATFORM', test: /\b(zalo|telegram|whatsapp|viber|messenger|fb\.com|facebook\.com|kết bạn|ket ban|nhắn riêng|nhan rieng|inbox riêng|liên hệ ngoài|lien he ngoai)\b/i },
  { flag: 'LINK', test: /(https?:\/\/[^\s]+|\bwww\.[^\s]+|\b[a-z0-9-]+\.(?:com|vn|net|xyz|top|info|cc|me|ly|click)\b\/?[^\s]*)/i },
  { flag: 'BANK_ACCOUNT', test: /(stk|số tài khoản|so tai khoan|số tk|so tk|tài khoản ngân hàng|tai khoan ngan hang)[^0-9]{0,15}\d{6,}|\b\d{9,16}\b[^\n]{0,60}(vietcombank|vcb|techcombank|tcb|mbbank|mb bank|bidv|agribank|vietinbank|acb|vpbank|tpbank|sacombank|momo|vib|shb|ocb|hdbank|msb)|(vietcombank|vcb|techcombank|tcb|mbbank|mb bank|bidv|agribank|vietinbank|acb|vpbank|tpbank|sacombank|momo|vib|shb|ocb|hdbank|msb)\b[^\n]{0,40}\b\d{9,16}\b/i },
  { flag: 'OTP_REQUEST', test: /(mã otp|ma otp|mã xác (nhận|thực)|ma xac (nhan|thuc)|mã code|cccd|căn cước|can cuoc|mật khẩu|mat khau|password)/i },
];
const PHONE = /(?<![\d])(?:(?:\+84|84|0)[\s.\-]?(?:3|5|7|8|9)(?:[\s.\-]?\d){8})(?![\d])/;

/** Chống lừa đảo: cảnh báo chat, giới hạn tài khoản mới, phát hiện tin trùng, chấm điểm rủi ro. */
@Injectable()
export class FraudService implements OnModuleInit {
  private readonly log = new Logger('Fraud');
  private cache?: { at: number; value: FraudSettings };
  private flagsReady = false;
  constructor(@Optional() private readonly db?: DatabaseService) {}

  async onModuleInit() {
    if (!this.db) return;
    try { await this.db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS safety_flags TEXT[]`); this.flagsReady = true; }
    catch (e) { this.log.error('Không thêm được cột cảnh báo chat: ' + (e instanceof Error ? e.message : String(e))); }
  }

  // ---------- cấu hình ----------
  async settings(fresh = false): Promise<FraudSettings> {
    if (!this.db) return FRAUD_DEFAULTS;
    if (!fresh && this.cache && Date.now() - this.cache.at < 30_000) return this.cache.value;
    let stored: Partial<FraudSettings> = {};
    try { stored = (await this.db.query(`SELECT value FROM app_settings WHERE key='fraud'`)).rows[0]?.value ?? {}; } catch { /* dùng mặc định */ }
    const value = this.sanitize({ ...FRAUD_DEFAULTS, ...stored });
    this.cache = { at: Date.now(), value };
    return value;
  }
  sanitize(input: Partial<FraudSettings>): FraudSettings {
    const int = (v: unknown, min: number, max: number, name: string) => { const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new BadRequestException(`${name} phải là số nguyên từ ${min} đến ${max}.`); return n; };
    return {
      chatWarnings: input.chatWarnings !== false, duplicateCheck: input.duplicateCheck !== false, newAccountBlockContactInChat: input.newAccountBlockContactInChat !== false,
      newAccountDays: int(input.newAccountDays ?? FRAUD_DEFAULTS.newAccountDays, 0, 90, 'Số ngày tài khoản mới'),
      newAccountDailyListings: int(input.newAccountDailyListings ?? FRAUD_DEFAULTS.newAccountDailyListings, 0, 100, 'Giới hạn tin mỗi ngày'),
    };
  }
  async saveSettings(adminId: string, input: Partial<FraudSettings>) {
    const value = this.sanitize({ ...(await this.settings(true)), ...input });
    await this.db!.query(`INSERT INTO app_settings(key,value,updated_by) VALUES('fraud',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by`, [JSON.stringify(value), adminId]);
    this.cache = { at: Date.now(), value };
    return value;
  }

  // ---------- chat ----------
  scanChat(text: string): string[] {
    const out = new Set<string>();
    for (const r of rules) if (r.test.test(text)) out.add(r.flag);
    if (PHONE.test(text.replace(/(\d)[\s.\-](?=\d)/g, '$1'))) out.add('PHONE');
    return [...out];
  }
  /** Danh sách cờ sẽ lưu cùng tin nhắn (rỗng nếu tính năng tắt hoặc cột chưa sẵn sàng). */
  async flagsFor(text: string): Promise<string[]> {
    if (!this.flagsReady || !(await this.settings()).chatWarnings) return [];
    return this.scanChat(text);
  }
  async isNewAccount(db: Query, userId: string): Promise<boolean> {
    const s = await this.settings();
    if (s.newAccountDays <= 0) return false;
    const u = (await db.query(`SELECT COALESCE(is_verified,false) AS verified, created_at FROM users WHERE id=$1`, [userId])).rows[0];
    return !!u && !u.verified && Date.now() - new Date(u.created_at).getTime() < s.newAccountDays * 86_400_000;
  }
  async assertChatAllowed(db: Query, userId: string, flags: string[]) {
    const s = await this.settings();
    if (!s.newAccountBlockContactInChat || !flags.some(f => ['PHONE', 'LINK', 'OFF_PLATFORM'].includes(f))) return;
    if (await this.isNewAccount(db, userId)) throw new BadRequestException('Tài khoản mới chưa được gửi số điện thoại, đường link hoặc lời mời liên hệ ngoài sàn. Hãy trao đổi ngay trong Tất Tần Tật, hoặc xác minh tài khoản để bỏ giới hạn này.');
  }

  // ---------- tin đăng ----------
  async assertCanPost(db: Query, sellerId: string) {
    const s = await this.settings();
    if (s.newAccountDailyListings <= 0 || !(await this.isNewAccount(db, sellerId))) return;
    const n = (await db.query(`SELECT COUNT(*)::int AS n FROM products WHERE seller_id=$1 AND created_at > now() - interval '24 hours'`, [sellerId])).rows[0]?.n ?? 0;
    if (n >= s.newAccountDailyListings) throw new BadRequestException(`Tài khoản mới chỉ được đăng tối đa ${s.newAccountDailyListings} tin mỗi 24 giờ. Hãy thử lại sau hoặc xác minh tài khoản để tăng hạn mức.`);
  }
  /** Lý do cần duyệt thủ công nếu tin trùng tiêu đề với tin khác (của người bán khác hoặc của chính mình trong 30 ngày). */
  async duplicateReasons(db: Query, sellerId: string, title: string): Promise<string[]> {
    if (!(await this.settings()).duplicateCheck) return [];
    const norm = String(title ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (norm.length < 8) return [];
    const rows = (await db.query(`SELECT (seller_id=$2) AS mine FROM products WHERE deleted_at IS NULL AND status IN ('ACTIVE','PENDING_REVIEW') AND lower(regexp_replace(trim(title),'\\s+',' ','g'))=$1 AND created_at > now() - interval '90 days' LIMIT 20`, [norm, sellerId])).rows;
    const out: string[] = [];
    if (rows.some(r => !r.mine)) out.push('Tiêu đề trùng với tin của người bán khác');
    if (rows.filter(r => r.mine).length >= 1) out.push('Tiêu đề trùng với tin bạn đã đăng');
    return out;
  }

  // ---------- điểm rủi ro ----------
  async riskUsers() {
    const rows = (await this.db!.query(`
      SELECT u.id::text, u.full_name, u.email, u.status::text AS status, COALESCE(u.is_verified,false) AS verified, u.created_at,
        EXTRACT(EPOCH FROM (now()-u.created_at))/86400 AS age_days,
        (SELECT COUNT(*)::int FROM content_reports r WHERE r.reported_user_id=u.id) AS reports,
        (SELECT COUNT(*)::int FROM order_disputes d JOIN orders o ON o.id=d.order_id WHERE (o.seller_id=u.id AND d.opened_role='BUYER') OR (o.buyer_id=u.id AND d.opened_role='SELLER')) AS disputes,
        (SELECT COUNT(*)::int FROM seller_reviews sr WHERE sr.seller_id=u.id AND sr.status='VISIBLE') AS review_count,
        COALESCE((SELECT AVG(sr.rating) FROM seller_reviews sr WHERE sr.seller_id=u.id AND sr.status='VISIBLE'),5)::float AS review_avg,
        (SELECT COUNT(*)::int FROM user_blocks b WHERE b.blocked_id=u.id) AS blocks,
        (SELECT COUNT(*)::int FROM messages m WHERE m.sender_id=u.id AND m.safety_flags IS NOT NULL AND cardinality(m.safety_flags)>0 AND m.created_at > now()-interval '7 days') AS flagged_msgs,
        (SELECT COUNT(*)::int FROM moderation_events e JOIN products p ON p.id=e.product_id WHERE p.seller_id=u.id AND e.decision='REJECTED') AS rejected
      FROM users u WHERE u.deleted_at IS NULL AND u.role NOT IN ('ADMIN'::user_role,'SUPER_ADMIN'::user_role) AND u.status::text <> 'DELETED'
      ORDER BY u.created_at DESC LIMIT 2000`)).rows;
    return rows.map(r => {
      const signals: { key: string; label: string; points: number }[] = [];
      const add = (key: string, label: string, points: number) => { if (points > 0) signals.push({ key, label, points }); };
      add('age', r.age_days < 3 ? 'Tài khoản dưới 3 ngày tuổi' : r.age_days < 7 ? 'Tài khoản dưới 7 ngày tuổi' : '', r.age_days < 3 ? 2 : r.age_days < 7 ? 1 : 0);
      add('unverified', 'Chưa xác minh', r.verified ? 0 : 1);
      add('reports', `${r.reports} lần bị báo cáo`, Math.min(r.reports * 2, 6));
      add('disputes', `${r.disputes} khiếu nại từ đối tác`, Math.min(r.disputes * 2, 6));
      add('reviews', `Điểm đánh giá thấp (${Number(r.review_avg).toFixed(1)}/5)`, r.review_count >= 3 && r.review_avg < 3 ? 2 : 0);
      add('blocks', `${r.blocks} người đã chặn`, Math.min(r.blocks, 3));
      add('chat', `${r.flagged_msgs} tin nhắn bị cảnh báo (7 ngày)`, Math.min(r.flagged_msgs, 4));
      add('rejected', `${r.rejected} tin bị từ chối`, Math.min(r.rejected, 3));
      const score = signals.reduce((t, s) => t + s.points, 0);
      return { id: r.id, name: r.full_name, email: r.email, status: r.status, verified: r.verified, createdAt: r.created_at, score, level: score >= 6 ? 'HIGH' : score >= 3 ? 'MEDIUM' : 'LOW', signals };
    }).filter(r => r.score >= 2).sort((a, b) => b.score - a.score).slice(0, 100);
  }
}
