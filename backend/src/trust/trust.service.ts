import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { computeTrust, TrustFacts, TrustResult } from './trust-score';

/** Cache còn "tươi" trong khoảng này; quá hạn thì lần đọc kế tiếp tự tính lại (phòng khi lỡ một sự kiện). */
const FRESH_MS = 10 * 60 * 1000;
const SWEEP_MS = 30 * 60 * 1000;

let instance: TrustService | null = null;

/** Gọi từ bất kỳ service nào khi dữ liệu uy tín thay đổi. Không bao giờ ném lỗi, không chặn luồng chính. */
export function triggerTrustRecalc(userId: string | null | undefined, reason: string): void {
  if (!userId || !instance) return;
  const t = setTimeout(() => { void instance?.recalculateTrustScore(userId, reason).catch(() => undefined); }, 1500);
  t.unref();
}

@Injectable()
export class TrustService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(TrustService.name);
  private timer?: NodeJS.Timeout;
  private ready?: Promise<void>;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    instance = this;
    this.ready = this.ensureSchema();
    this.timer = setInterval(() => { void this.sweep().catch(() => undefined); }, SWEEP_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (instance === this) instance = null;
  }

  private async ensureSchema() {
    try {
      await this.db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_custom BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE IF NOT EXISTS user_referrals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','rejected')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          verified_at TIMESTAMPTZ,
          CHECK (referrer_user_id <> referred_user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals (referrer_user_id, status);
        CREATE TABLE IF NOT EXISTS user_trust_scores (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          score SMALLINT NOT NULL DEFAULT 0,
          stars SMALLINT NOT NULL DEFAULT 1,
          level TEXT NOT NULL DEFAULT 'Thành viên mới',
          breakdown JSONB NOT NULL DEFAULT '[]',
          calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS user_trust_score_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          old_score SMALLINT,
          new_score SMALLINT NOT NULL,
          reason TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_trust_logs_user ON user_trust_score_logs (user_id, created_at DESC);
      `);
    } catch (err) {
      this.log.warn(`Chưa tạo được bảng điểm uy tín: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Thu thập dữ liệu thật từ DB (không tin dữ liệu từ frontend). */
  async collectFacts(userId: string): Promise<TrustFacts | null> {
    const r = await this.db.query<Record<string, unknown>>(
      `SELECT u.phone_verified AS phone_verified,
              (u.avatar_custom = TRUE AND u.avatar_url IS NOT NULL AND length(btrim(u.avatar_url)) > 0) AS has_portrait,
              ((SELECT count(*) FROM identity_verifications iv WHERE iv.user_id=u.id AND iv.status='APPROVED')
               + (SELECT count(*) FROM user_verifications v WHERE v.user_id=u.id AND v.verification_type='IDENTITY' AND v.status='VERIFIED'))::int AS identity_ok,
              (SELECT count(*)::int FROM products p WHERE p.seller_id=u.id AND p.deleted_at IS NULL AND p.status IN ('ACTIVE','RESERVED','SOLD')) AS listings,
              (SELECT count(*)::int FROM orders o WHERE (o.buyer_id=u.id OR o.seller_id=u.id) AND o.order_status='COMPLETED'
                  AND o.payment_status NOT IN ('REFUNDED','FAILED','CANCELLED') AND o.buyer_id <> o.seller_id) AS completed,
              (COALESCE((SELECT sum(w.amount) FROM wallet_transactions w WHERE w.seller_id=u.id AND w.status IN ('AVAILABLE','WITHDRAWN')),0)
               + COALESCE((SELECT sum(so.price_snapshot) FROM subscription_orders so WHERE so.seller_id=u.id AND so.status='PAID'),0)
               + COALESCE((SELECT sum(po.package_price_snapshot) FROM promotion_orders po WHERE po.seller_id=u.id AND po.status='PAID'),0))::text AS wallet_total,
              ((SELECT count(*) FROM subscription_orders so WHERE so.seller_id=u.id AND so.status='PAID')
               + (SELECT count(*) FROM promotion_orders po WHERE po.seller_id=u.id AND po.status='PAID'))::int AS packages,
              (SELECT count(*)::int FROM user_referrals rf WHERE rf.referrer_user_id=u.id AND rf.status='qualified') AS referrals
         FROM users u WHERE u.id=$1 AND u.deleted_at IS NULL`,
      [userId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      phoneVerified: row.phone_verified === true,
      identityVerified: Number(row.identity_ok) > 0,
      hasPortrait: row.has_portrait === true,
      validListings: Number(row.listings) || 0,
      completedTransactions: Number(row.completed) || 0,
      walletTotal: Number(row.wallet_total) || 0,
      packageTransactions: Number(row.packages) || 0,
      qualifiedReferrals: Number(row.referrals) || 0,
    };
  }

  /** Tính lại, lưu cache và ghi nhật ký nếu điểm đổi. */
  async recalculateTrustScore(userId: string, reason = 'manual'): Promise<TrustResult | null> {
    await this.ready;
    await this.qualifyReferral(userId);
    const facts = await this.collectFacts(userId);
    if (!facts) return null;
    const result = computeTrust(facts);
    const old = (await this.db.query<{ score: number }>(`SELECT score FROM user_trust_scores WHERE user_id=$1`, [userId])).rows[0];
    await this.db.query(
      `INSERT INTO user_trust_scores (user_id, score, stars, level, breakdown, calculated_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,now(),now())
       ON CONFLICT (user_id) DO UPDATE SET score=EXCLUDED.score, stars=EXCLUDED.stars, level=EXCLUDED.level,
         breakdown=EXCLUDED.breakdown, calculated_at=now(), updated_at=now()`,
      [userId, result.score, result.stars, result.level, JSON.stringify(result.criteria)],
    );
    if (!old || Number(old.score) !== result.score) {
      await this.db.query(`INSERT INTO user_trust_score_logs (user_id, old_score, new_score, reason) VALUES ($1,$2,$3,$4)`, [userId, old ? Number(old.score) : null, result.score, reason]);
    }
    return result;
  }

  /** Đọc từ cache; chỉ tính lại khi chưa có hoặc đã quá hạn. */
  async getTrustScore(userId: string): Promise<TrustResult | null> {
    await this.ready;
    const row = (await this.db.query<{ score: number; stars: number; level: string; breakdown: TrustResult['criteria']; calculated_at: Date }>(
      `SELECT score, stars, level, breakdown, calculated_at FROM user_trust_scores WHERE user_id=$1`, [userId])).rows[0];
    if (row && Date.now() - new Date(row.calculated_at).getTime() < FRESH_MS) {
      return { score: Number(row.score), maxScore: 10, stars: Number(row.stars), level: row.level, criteria: row.breakdown };
    }
    return this.recalculateTrustScore(userId, row ? 'stale_refresh' : 'first_view');
  }

  /** Giới thiệu: chỉ tính khi người được giới thiệu đã xác thực SĐT; chặn farm điểm vòng A↔B. */
  async qualifyReferral(referredUserId: string): Promise<void> {
    const r = (await this.db.query<{ id: string; referrer_user_id: string }>(
      `UPDATE user_referrals rf SET status='qualified', verified_at=now()
         FROM users u
        WHERE rf.referred_user_id=$1 AND rf.status='pending' AND u.id=rf.referred_user_id AND u.phone_verified=TRUE AND u.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM user_referrals x WHERE x.referrer_user_id=rf.referred_user_id AND x.referred_user_id=rf.referrer_user_id)
        RETURNING rf.id, rf.referrer_user_id`, [referredUserId])).rows[0];
    if (r) triggerTrustRecalc(r.referrer_user_id, 'referral_qualified');
  }

  referralCodeOf(userId: string): string {
    return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  /** Ghi nhận người giới thiệu cho tài khoản hiện tại (mỗi tài khoản chỉ một lần). */
  async applyReferral(userId: string, code: string): Promise<{ ok: boolean; message: string }> {
    await this.ready;
    const clean = String(code || '').trim().toUpperCase();
    if (!/^[0-9A-F]{8}$/.test(clean)) return { ok: false, message: 'Mã giới thiệu không hợp lệ' };
    const referrer = (await this.db.query<{ id: string }>(
      `SELECT id::text AS id FROM users WHERE upper(substr(replace(id::text,'-',''),1,8))=$1 AND status='ACTIVE' AND deleted_at IS NULL LIMIT 2`, [clean])).rows;
    if (referrer.length !== 1) return { ok: false, message: 'Không tìm thấy mã giới thiệu' };
    const rid = referrer[0].id;
    if (rid === userId) return { ok: false, message: 'Không thể tự giới thiệu chính mình' };
    const reverse = (await this.db.query(`SELECT 1 FROM user_referrals WHERE referrer_user_id=$1 AND referred_user_id=$2`, [userId, rid])).rows[0];
    if (reverse) return { ok: false, message: 'Mã giới thiệu này không hợp lệ với tài khoản của bạn' };
    const ins = await this.db.query(`INSERT INTO user_referrals (referrer_user_id, referred_user_id) VALUES ($1,$2) ON CONFLICT (referred_user_id) DO NOTHING RETURNING id`, [rid, userId]);
    if (!ins.rows[0]) return { ok: false, message: 'Tài khoản đã được ghi nhận người giới thiệu trước đó' };
    await this.qualifyReferral(userId);
    return { ok: true, message: 'Đã ghi nhận mã giới thiệu' };
  }

  async referralSummary(userId: string) {
    await this.ready;
    const r = (await this.db.query<{ pending: number; qualified: number }>(
      `SELECT count(*) FILTER (WHERE status='pending')::int AS pending, count(*) FILTER (WHERE status='qualified')::int AS qualified FROM user_referrals WHERE referrer_user_id=$1`, [userId])).rows[0];
    return { code: this.referralCodeOf(userId), pending: r?.pending ?? 0, qualified: r?.qualified ?? 0 };
  }

  /** Job định kỳ: tính lại tối đa 50 tài khoản có cache cũ hơn 24 giờ để giữ dữ liệu nhất quán. */
  async sweep() {
    await this.ready;
    const stale = (await this.db.query<{ user_id: string }>(
      `SELECT user_id::text AS user_id FROM user_trust_scores WHERE calculated_at < now() - interval '24 hours' ORDER BY calculated_at LIMIT 50`)).rows;
    for (const s of stale) await this.recalculateTrustScore(s.user_id, 'scheduled_check').catch(() => undefined);
  }
}
