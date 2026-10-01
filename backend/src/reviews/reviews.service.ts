import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';

export type Kind = 'seller' | 'buyer';
/** kind = 'seller': người mua đánh giá người bán (bảng seller_reviews). kind = 'buyer': người bán đánh giá người mua (bảng buyer_reviews). */
const TABLE: Record<Kind, string> = { seller: 'seller_reviews', buyer: 'buyer_reviews' };
export const REVIEW_WINDOW_DAYS = 14;
const REASONS = ['SPAM', 'OFFENSIVE', 'FAKE', 'PERSONAL_INFO', 'OTHER'];

@Injectable()
export class ReviewsService implements OnModuleInit {
  private readonly log = new Logger('Reviews');
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS buyer_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL UNIQUE REFERENCES orders(id), seller_id UUID NOT NULL REFERENCES users(id), buyer_id UUID NOT NULL REFERENCES users(id),
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment VARCHAR(1000), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      for (const t of Object.values(TABLE)) {
        await this.db.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS reply VARCHAR(1000)`);
        await this.db.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ`);
        await this.db.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'VISIBLE'`);
      }
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_buyer_reviews_buyer ON buyer_reviews(buyer_id, created_at DESC)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS review_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), kind TEXT NOT NULL CHECK (kind IN ('seller','buyer')), review_id UUID NOT NULL, reporter_id UUID NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL, note VARCHAR(500), status TEXT NOT NULL DEFAULT 'OPEN', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (kind, review_id, reporter_id))`);
    } catch (e) { this.log.error('Không tạo được bảng đánh giá: ' + (e instanceof Error ? e.message : String(e))); }
  }

  private static kind(k: string): Kind { if (k !== 'seller' && k !== 'buyer') throw new BadRequestException('Loại đánh giá không hợp lệ.'); return k; }
  private static clean(comment?: string): string | null {
    const t = String(comment ?? '').trim();
    if (t.length > 1000) throw new BadRequestException('Nhận xét tối đa 1000 ký tự.');
    return t || null;
  }

  /** Tạo đánh giá cho đơn. by = 'buyer' → người mua chấm người bán; by = 'seller' → người bán chấm người mua. */
  async create(userId: string, orderId: string, by: 'buyer' | 'seller', dto: { rating: number; comment?: string }) {
    const kind: Kind = by === 'buyer' ? 'seller' : 'buyer';
    const comment = ReviewsService.clean(dto.comment);
    const out = await this.db.transaction(async c => {
      const o = (await c.query(`SELECT buyer_id::text, seller_id::text, order_code, order_status::text AS status, COALESCE(completed_at, updated_at) AS done_at FROM orders WHERE id=$1 FOR UPDATE`, [orderId])).rows[0];
      const mine = by === 'buyer' ? o?.buyer_id : o?.seller_id;
      if (!o || mine !== userId) throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
      if (o.status !== 'COMPLETED') throw new BadRequestException('Chỉ có thể đánh giá sau khi đơn hoàn tất.');
      if (Date.now() - new Date(o.done_at).getTime() > REVIEW_WINDOW_DAYS * 86_400_000) throw new BadRequestException(`Đã quá ${REVIEW_WINDOW_DAYS} ngày kể từ khi đơn hoàn tất, không thể đánh giá.`);
      const row = (await c.query(`INSERT INTO ${TABLE[kind]}(order_id, buyer_id, seller_id, rating, comment) VALUES($1,$2,$3,$4,$5) ON CONFLICT(order_id) DO NOTHING RETURNING id::text, rating, comment, created_at`,
        [orderId, o.buyer_id, o.seller_id, dto.rating, comment])).rows[0];
      if (!row) throw new ConflictException('Bạn đã đánh giá đơn hàng này rồi.');
      return { row, target: by === 'buyer' ? o.seller_id : o.buyer_id, code: o.order_code };
    });
    void this.notifications.create(out.target, 'REVIEW_RECEIVED', 'Bạn nhận được một đánh giá mới', `Đơn ${out.code}: ${dto.rating}/5 sao${comment ? ` — “${comment.slice(0, 80)}”` : ''}.`, 'ORDER', orderId).catch(() => undefined);
    return { ...out.row, kind };
  }

  /** Trạng thái đánh giá của một đơn đối với người đang xem. */
  async forOrder(userId: string, orderId: string) {
    const o = (await this.db.query(`SELECT buyer_id::text, seller_id::text, order_status::text AS status, COALESCE(completed_at, updated_at) AS done_at FROM orders WHERE id=$1`, [orderId])).rows[0];
    if (!o || (o.buyer_id !== userId && o.seller_id !== userId)) throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
    const role: 'buyer' | 'seller' = o.buyer_id === userId ? 'buyer' : 'seller';
    const q = (t: string) => this.db.query(`SELECT id::text, rating, comment, reply, replied_at, created_at, status FROM ${t} WHERE order_id=$1`, [orderId]);
    const [sellerRev, buyerRev] = await Promise.all([q('seller_reviews'), q('buyer_reviews')]);
    const given = role === 'buyer' ? sellerRev.rows[0] : buyerRev.rows[0];
    const received = role === 'buyer' ? buyerRev.rows[0] : sellerRev.rows[0];
    const deadline = new Date(new Date(o.done_at).getTime() + REVIEW_WINDOW_DAYS * 86_400_000);
    return {
      role, canReview: o.status === 'COMPLETED' && !given && deadline.getTime() > Date.now(), deadline: o.status === 'COMPLETED' ? deadline : null,
      given: given ? { ...given, kind: role === 'buyer' ? 'seller' : 'buyer' } : null,
      received: received && received.status === 'VISIBLE' ? { ...received, kind: role === 'buyer' ? 'buyer' : 'seller' } : null,
    };
  }

  /** Người được đánh giá trả lời đúng một lần. */
  async reply(userId: string, kindRaw: string, id: string, text: string) {
    const kind = ReviewsService.kind(kindRaw); const reply = String(text ?? '').trim();
    if (reply.length < 2 || reply.length > 1000) throw new BadRequestException('Phản hồi cần từ 2 đến 1000 ký tự.');
    const target = kind === 'seller' ? 'seller_id' : 'buyer_id'; const author = kind === 'seller' ? 'buyer_id' : 'seller_id';
    const r = (await this.db.query(`UPDATE ${TABLE[kind]} SET reply=$3, replied_at=NOW(), updated_at=NOW() WHERE id=$1 AND ${target}=$2 AND reply IS NULL AND status='VISIBLE' RETURNING ${author}::text AS author, order_id::text`, [id, userId, reply])).rows[0];
    if (!r) throw new ConflictException('Không thể phản hồi: đánh giá không tồn tại, không phải của bạn, hoặc đã được phản hồi.');
    void this.notifications.create(r.author, 'REVIEW_REPLY', 'Có phản hồi cho đánh giá của bạn', reply.slice(0, 120), 'ORDER', r.order_id).catch(() => undefined);
    return { id };
  }

  async report(userId: string, kindRaw: string, id: string, dto: { reason?: string; note?: string }) {
    const kind = ReviewsService.kind(kindRaw); const reason = String(dto.reason ?? '').toUpperCase();
    if (!REASONS.includes(reason)) throw new BadRequestException('Chọn lý do báo cáo.');
    const target = kind === 'seller' ? 'seller_id' : 'buyer_id';
    const rev = (await this.db.query(`SELECT ${target}::text AS target FROM ${TABLE[kind]} WHERE id=$1 AND status='VISIBLE'`, [id])).rows[0];
    if (!rev) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (rev.target !== userId) throw new ForbiddenException('Chỉ người được đánh giá mới báo cáo được đánh giá này.');
    const ins = await this.db.query(`INSERT INTO review_reports(kind, review_id, reporter_id, reason, note) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`, [kind, id, userId, reason, String(dto.note ?? '').trim().slice(0, 500) || null]);
    if (!ins.rows[0]) throw new ConflictException('Bạn đã báo cáo đánh giá này rồi.');
    return { id };
  }

  /** Hồ sơ đánh giá công khai của một người dùng theo vai trò. */
  async profile(userId: string, role: string, page = 1) {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new BadRequestException('Mã người dùng không hợp lệ.');
    const kind = ReviewsService.kind(role === 'buyer' ? 'buyer' : 'seller'); const t = TABLE[kind]; const owner = kind === 'seller' ? 'seller_id' : 'buyer_id'; const author = kind === 'seller' ? 'buyer_id' : 'seller_id';
    const [sum, list, user] = await Promise.all([
      this.db.query(`SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating)::numeric,1),0)::float AS average,
        COUNT(*) FILTER (WHERE rating=5)::int AS r5, COUNT(*) FILTER (WHERE rating=4)::int AS r4, COUNT(*) FILTER (WHERE rating=3)::int AS r3, COUNT(*) FILTER (WHERE rating=2)::int AS r2, COUNT(*) FILTER (WHERE rating=1)::int AS r1
        FROM ${t} WHERE ${owner}=$1 AND status='VISIBLE'`, [userId]),
      this.db.query(`SELECT r.id::text, r.rating, r.comment, r.reply, r.replied_at, r.created_at, LEFT(COALESCE(u.full_name,'Thành viên'), 40) AS author_name FROM ${t} r LEFT JOIN users u ON u.id=r.${author}
        WHERE r.${owner}=$1 AND r.status='VISIBLE' ORDER BY r.created_at DESC LIMIT 10 OFFSET $2`, [userId, (Math.max(1, page) - 1) * 10]),
      this.db.query(`SELECT full_name, avatar_url, is_verified, created_at, (SELECT COUNT(*)::int FROM products p WHERE p.seller_id=users.id AND p.status='ACTIVE' AND p.deleted_at IS NULL) AS active_listings FROM users WHERE id=$1 AND deleted_at IS NULL`, [userId]),
    ]);
    if (!user.rows[0]) throw new NotFoundException('Không tìm thấy người dùng.');
    const s = sum.rows[0];
    return { user: { name: user.rows[0].full_name, avatarUrl: user.rows[0].avatar_url, verified: user.rows[0].is_verified, joinedAt: user.rows[0].created_at, activeListings: user.rows[0].active_listings }, role: kind === 'seller' ? 'seller' : 'buyer',
      summary: { count: s.count, average: s.average, distribution: { 5: s.r5, 4: s.r4, 3: s.r3, 2: s.r2, 1: s.r1 } }, reviews: list.rows };
  }

  /** Điểm trung bình + số đánh giá cho danh sách người bán (dùng trên thẻ tin đăng). */
  async sellerSummaries(ids: string[]) {
    const safe = ids.filter(i => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100);
    if (!safe.length) return {};
    const rows = (await this.db.query(`SELECT seller_id::text AS id, COUNT(*)::int AS count, ROUND(AVG(rating)::numeric,1)::float AS average FROM seller_reviews WHERE seller_id=ANY($1::uuid[]) AND status='VISIBLE' GROUP BY seller_id`, [safe])).rows;
    return Object.fromEntries(rows.map(r => [r.id, { count: r.count, average: r.average }]));
  }

  // ---------- Quản trị ----------
  async adminList(q: { status?: string; kind?: string; page?: string }) {
    const page = Math.max(Number(q.page) || 1, 1);
    const parts = (['seller', 'buyer'] as Kind[]).filter(k => !q.kind || q.kind === k).map(k => {
      const t = TABLE[k]; const target = k === 'seller' ? 'seller_id' : 'buyer_id'; const author = k === 'seller' ? 'buyer_id' : 'seller_id';
      const status = q.status === 'HIDDEN' ? `AND r.status='HIDDEN'` : q.status === 'REPORTED' ? `AND EXISTS(SELECT 1 FROM review_reports rr WHERE rr.kind='${k}' AND rr.review_id=r.id AND rr.status='OPEN')` : '';
      return `SELECT '${k}' AS kind, r.id::text, r.order_id::text, r.rating, r.comment, r.reply, r.status, r.created_at, tu.full_name AS target_name, au.full_name AS author_name,
        (SELECT COUNT(*)::int FROM review_reports rr WHERE rr.kind='${k}' AND rr.review_id=r.id AND rr.status='OPEN') AS reports
        FROM ${t} r LEFT JOIN users tu ON tu.id=r.${target} LEFT JOIN users au ON au.id=r.${author} WHERE TRUE ${status}`;
    });
    const rows = (await this.db.query(`SELECT * FROM (${parts.join(' UNION ALL ')}) x ORDER BY (reports > 0) DESC, created_at DESC LIMIT 20 OFFSET $1`, [(page - 1) * 20])).rows;
    return rows;
  }
  async adminSetStatus(adminId: string, kindRaw: string, id: string, status: 'VISIBLE' | 'HIDDEN') {
    const kind = ReviewsService.kind(kindRaw);
    const r = (await this.db.query(`UPDATE ${TABLE[kind]} SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING ${kind === 'seller' ? 'buyer_id' : 'seller_id'}::text AS author, order_id::text`, [id, status])).rows[0];
    if (!r) throw new NotFoundException('Không tìm thấy đánh giá.');
    await this.db.query(`UPDATE review_reports SET status=$3 WHERE kind=$1 AND review_id=$2 AND status='OPEN'`, [kind, id, status === 'HIDDEN' ? 'ACTIONED' : 'DISMISSED']);
    if (status === 'HIDDEN') void this.notifications.create(r.author, 'REVIEW_HIDDEN', 'Một đánh giá của bạn đã bị ẩn', 'Đánh giá vi phạm quy định cộng đồng nên đã bị quản trị viên ẩn.', 'ORDER', r.order_id).catch(() => undefined);
    try { await this.db.query(`INSERT INTO admin_audit_logs(actor_id, actor_name, action, entity_type, entity_id, metadata) VALUES($1::uuid,'Admin',$2,'REVIEW',$3,$4::jsonb)`, [adminId, status === 'HIDDEN' ? 'REVIEW_HIDDEN' : 'REVIEW_RESTORED', id, JSON.stringify({ kind })]); } catch { /* nhật ký là phụ */ }
    return { id, status };
  }
}
