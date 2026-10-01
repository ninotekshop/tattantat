import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';
import { RefundsService } from '../finance/refunds.service';

export const DISPUTE_REASONS: Record<string, string> = {
  NOT_RECEIVED: 'Chưa nhận được hàng', NOT_AS_DESCRIBED: 'Hàng không đúng mô tả', DAMAGED: 'Hàng hư hỏng / lỗi', WRONG_ITEM: 'Giao sai sản phẩm',
  SELLER_UNRESPONSIVE: 'Người bán không phản hồi', BUYER_REFUSED: 'Người mua từ chối nhận / thanh toán', PAYMENT_ISSUE: 'Vấn đề thanh toán', OTHER: 'Lý do khác',
};
const BUYER_ONLY = ['NOT_RECEIVED', 'NOT_AS_DESCRIBED', 'DAMAGED', 'WRONG_ITEM', 'SELLER_UNRESPONSIVE'];
const SELLER_ONLY = ['BUYER_REFUSED'];
export const DISPUTE_WINDOW_DAYS = 7;
export type Decision = 'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECT';
type Actor = 'BUYER' | 'SELLER' | 'ADMIN';

/**
 * Khiếu nại đơn hàng. Đơn chưa hoàn tất (đang giao / đã giao) được chuyển sang DISPUTED để chặn việc ghi nhận
 * doanh thu và giải ngân trong lúc chờ xử lý. Đơn đã hoàn tất giữ nguyên trạng thái; hoàn tiền đi qua RefundsService
 * (bút toán đảo có kiểm soát), không sửa số dư thủ công.
 */
@Injectable()
export class DisputesService implements OnModuleInit {
  private readonly log = new Logger('Disputes');
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly refunds: RefundsService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS order_disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id), opened_by UUID NOT NULL REFERENCES users(id),
        opened_role TEXT NOT NULL CHECK (opened_role IN ('BUYER','SELLER')), reason_code TEXT NOT NULL, description TEXT NOT NULL,
        evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb, status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWING','RESOLVED')),
        prior_order_status TEXT, resolution TEXT, refund_amount BIGINT, admin_note TEXT, resolved_by UUID, resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_order_dispute_active ON order_disputes(order_id) WHERE status IN ('OPEN','REVIEWING')`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_order_disputes_status ON order_disputes(status, created_at DESC)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS order_dispute_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id UUID NOT NULL REFERENCES order_disputes(id) ON DELETE CASCADE,
        author_id UUID, author_role TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_dispute_messages ON order_dispute_messages(dispute_id, created_at)`);
    } catch (e) { this.log.error('Không tạo được bảng khiếu nại: ' + (e instanceof Error ? e.message : String(e))); }
  }

  private notify(userId: string | null | undefined, title: string, content: string, orderId: string, type = 'ORDER_DISPUTE') {
    if (userId) void this.notifications.create(userId, type, title, content, 'ORDER', orderId).catch(() => undefined);
  }
  private async admins(): Promise<string[]> {
    return (await this.db.query(`SELECT id::text FROM users u WHERE u.deleted_at IS NULL AND (u.role IN ('ADMIN'::user_role,'SUPER_ADMIN'::user_role) OR EXISTS(SELECT 1 FROM admin_users a WHERE a.user_id=u.id AND a.status='ACTIVE'))`)).rows.map(r => r.id);
  }
  private cleanEvidence(list: unknown): string[] {
    if (list == null) return [];
    if (!Array.isArray(list) || list.length > 5) throw new BadRequestException('Tối đa 5 ảnh/tệp bằng chứng.');
    return list.map(u => String(u).trim()).filter(Boolean).map(u => { if (u.length > 500 || !/^(https:\/\/|\/)[^\s"'<>]+$/i.test(u)) throw new BadRequestException('Đường dẫn bằng chứng không hợp lệ.'); return u; });
  }

  // ---------- Người dùng ----------
  async open(userId: string, orderId: string, dto: { reason?: string; description?: string; evidence?: unknown }) {
    const reason = String(dto.reason ?? '').toUpperCase();
    const description = String(dto.description ?? '').trim();
    if (!DISPUTE_REASONS[reason]) throw new BadRequestException('Chọn lý do khiếu nại.');
    if (description.length < 10 || description.length > 2000) throw new BadRequestException('Mô tả khiếu nại cần từ 10 đến 2000 ký tự.');
    const evidence = this.cleanEvidence(dto.evidence);
    const out = await this.db.transaction(async c => {
      const o = (await c.query(`SELECT id::text, order_code, buyer_id::text, seller_id::text, order_status::text AS status, COALESCE(completed_at, updated_at) AS done_at FROM orders WHERE id=$1 FOR UPDATE`, [orderId])).rows[0];
      if (!o) throw new NotFoundException('Không tìm thấy đơn hàng.');
      const role: 'BUYER' | 'SELLER' | null = o.buyer_id === userId ? 'BUYER' : o.seller_id === userId ? 'SELLER' : null;
      if (!role) throw new ForbiddenException('Bạn không phải người mua hoặc người bán của đơn này.');
      if (role === 'BUYER' && SELLER_ONLY.includes(reason)) throw new BadRequestException('Lý do này chỉ dành cho người bán.');
      if (role === 'SELLER' && BUYER_ONLY.includes(reason)) throw new BadRequestException('Lý do này chỉ dành cho người mua.');
      const okStatus = role === 'BUYER' ? ['SHIPPING', 'DELIVERED', 'COMPLETED'] : ['SHIPPING', 'DELIVERED'];
      if (!okStatus.includes(o.status)) throw new BadRequestException('Đơn hàng ở trạng thái hiện tại chưa thể khiếu nại.');
      if (o.status === 'COMPLETED' && Date.now() - new Date(o.done_at).getTime() > DISPUTE_WINDOW_DAYS * 86_400_000) throw new BadRequestException(`Đã quá ${DISPUTE_WINDOW_DAYS} ngày kể từ khi đơn hoàn tất, không thể khiếu nại.`);
      const active = (await c.query(`SELECT 1 FROM order_disputes WHERE order_id=$1 AND status IN ('OPEN','REVIEWING')`, [orderId])).rows[0];
      if (active) throw new ConflictException('Đơn này đang có khiếu nại chưa xử lý xong.');
      const d = (await c.query(`INSERT INTO order_disputes(order_id, opened_by, opened_role, reason_code, description, evidence_urls, prior_order_status) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING id::text`,
        [orderId, userId, role, reason, description, JSON.stringify(evidence), o.status])).rows[0];
      await c.query(`INSERT INTO order_dispute_messages(dispute_id, author_id, author_role, content) VALUES($1,$2,$3,$4)`, [d.id, userId, role, description]);
      if (o.status !== 'COMPLETED') {
        await c.query(`UPDATE orders SET order_status='DISPUTED', updated_at=NOW() WHERE id=$1`, [orderId]);
        await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,'DISPUTED',$2,$3)`, [orderId, userId, `Khiếu nại: ${DISPUTE_REASONS[reason]}`]);
      }
      return { id: d.id, code: o.order_code, other: role === 'BUYER' ? o.seller_id : o.buyer_id, role };
    });
    this.notify(out.other, 'Đơn hàng có khiếu nại', `Đơn ${out.code} có khiếu nại: ${DISPUTE_REASONS[reason]}. Vui lòng phản hồi trong mục Đơn hàng.`, orderId);
    for (const a of await this.admins()) this.notify(a, 'Có khiếu nại đơn hàng mới', `Đơn ${out.code}: ${DISPUTE_REASONS[reason]}. Vào mục Khiếu nại để xử lý.`, orderId, 'ADMIN_DISPUTE_OPENED');
    return { id: out.id };
  }

  /** Khiếu nại gần nhất của đơn + tin nhắn; chỉ hai bên của đơn (hoặc admin) được xem. */
  async forOrder(userId: string, orderId: string, isAdmin = false) {
    const o = (await this.db.query(`SELECT buyer_id::text, seller_id::text FROM orders WHERE id=$1`, [orderId])).rows[0];
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (!isAdmin && o.buyer_id !== userId && o.seller_id !== userId) throw new ForbiddenException('Bạn không có quyền xem khiếu nại của đơn này.');
    const d = (await this.db.query(`SELECT id::text, opened_role, reason_code, description, evidence_urls, status, resolution, refund_amount::text, admin_note, created_at, resolved_at FROM order_disputes WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, [orderId])).rows[0];
    if (!d) return null;
    return { ...d, reasonLabel: DISPUTE_REASONS[d.reason_code] ?? d.reason_code, messages: await this.messages(d.id) };
  }
  private async messages(disputeId: string) {
    return (await this.db.query(`SELECT m.id::text, m.author_role, m.content, m.created_at, CASE WHEN m.author_role='ADMIN' THEN 'Quản trị viên' ELSE COALESCE(u.full_name,'Thành viên') END AS author_name
      FROM order_dispute_messages m LEFT JOIN users u ON u.id=m.author_id WHERE m.dispute_id=$1 ORDER BY m.created_at`, [disputeId])).rows;
  }
  async reply(userId: string, orderId: string, content: string) {
    const text = String(content ?? '').trim();
    if (text.length < 2 || text.length > 2000) throw new BadRequestException('Nội dung phản hồi cần từ 2 đến 2000 ký tự.');
    const row = (await this.db.query(`SELECT d.id::text, o.order_code, o.buyer_id::text, o.seller_id::text FROM order_disputes d JOIN orders o ON o.id=d.order_id WHERE d.order_id=$1 AND d.status IN ('OPEN','REVIEWING')`, [orderId])).rows[0];
    if (!row) throw new NotFoundException('Đơn không có khiếu nại đang xử lý.');
    const role: Actor | null = row.buyer_id === userId ? 'BUYER' : row.seller_id === userId ? 'SELLER' : null;
    if (!role) throw new ForbiddenException('Bạn không có quyền phản hồi khiếu nại này.');
    await this.db.query(`INSERT INTO order_dispute_messages(dispute_id, author_id, author_role, content) VALUES($1,$2,$3,$4)`, [row.id, userId, role, text]);
    await this.db.query(`UPDATE order_disputes SET updated_at=NOW() WHERE id=$1`, [row.id]);
    this.notify(role === 'BUYER' ? row.seller_id : row.buyer_id, 'Phản hồi khiếu nại', `Đơn ${row.order_code} có phản hồi mới trong khiếu nại.`, orderId);
    return { id: row.id };
  }

  // ---------- Quản trị ----------
  async list(q: { status?: string; q?: string; page?: string }) {
    const page = Math.max(Number(q.page) || 1, 1); const limit = 20;
    const where: string[] = []; const params: unknown[] = [];
    if (q.status?.trim()) { const s = q.status.trim().toUpperCase(); if (!['OPEN', 'REVIEWING', 'RESOLVED'].includes(s)) throw new BadRequestException('Trạng thái không hợp lệ.'); params.push(s); where.push(`d.status=$${params.length}`); }
    if (q.q?.trim()) { params.push(`%${q.q.trim()}%`); where.push(`(o.order_code ILIKE $${params.length} OR buyer.full_name ILIKE $${params.length} OR seller.full_name ILIKE $${params.length})`); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM order_disputes d JOIN orders o ON o.id=d.order_id LEFT JOIN users buyer ON buyer.id=o.buyer_id LEFT JOIN users seller ON seller.id=o.seller_id`;
    const [rows, count] = await Promise.all([
      this.db.query(`SELECT d.id::text, d.order_id::text, o.order_code, o.total_amount::text AS total_amount, o.order_status::text AS order_status, d.status, d.reason_code, d.opened_role, d.resolution, d.created_at, d.updated_at,
        buyer.full_name AS buyer_name, seller.full_name AS seller_name ${from} ${w} ORDER BY (d.status='RESOLVED'), d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
      this.db.query(`SELECT COUNT(*)::int AS total ${from} ${w}`, params),
    ]);
    return { items: rows.rows.map(r => ({ ...r, reasonLabel: DISPUTE_REASONS[r.reason_code] ?? r.reason_code })), meta: { page, limit, total: count.rows[0].total } };
  }
  async stats() {
    const r = (await this.db.query(`SELECT COUNT(*) FILTER (WHERE status='OPEN')::int AS open, COUNT(*) FILTER (WHERE status='REVIEWING')::int AS reviewing, COUNT(*) FILTER (WHERE status='RESOLVED')::int AS resolved,
      COUNT(*) FILTER (WHERE status IN ('OPEN','REVIEWING') AND created_at < NOW()-interval '48 hours')::int AS overdue,
      COALESCE(SUM(refund_amount) FILTER (WHERE status='RESOLVED'),0)::text AS refunded FROM order_disputes`)).rows[0];
    return r;
  }
  async detail(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Mã khiếu nại không hợp lệ.');
    const d = (await this.db.query(`SELECT d.id::text, d.order_id::text, d.opened_role, d.reason_code, d.description, d.evidence_urls, d.status, d.resolution, d.refund_amount::text, d.admin_note, d.prior_order_status, d.created_at, d.resolved_at,
        o.order_code, o.total_amount::text AS total_amount, o.order_status::text AS order_status, o.payment_status::text AS payment_status, o.payment_method::text AS payment_method,
        COALESCE(p.title,'Sản phẩm') AS product_title, buyer.full_name AS buyer_name, buyer.phone AS buyer_phone, seller.full_name AS seller_name, seller.phone AS seller_phone
      FROM order_disputes d JOIN orders o ON o.id=d.order_id LEFT JOIN products p ON p.id=o.product_id LEFT JOIN users buyer ON buyer.id=o.buyer_id LEFT JOIN users seller ON seller.id=o.seller_id WHERE d.id=$1`, [id])).rows[0];
    if (!d) throw new NotFoundException('Không tìm thấy khiếu nại.');
    return { ...d, reasonLabel: DISPUTE_REASONS[d.reason_code] ?? d.reason_code, messages: await this.messages(id) };
  }
  async review(adminId: string, id: string) {
    const r = await this.db.query(`UPDATE order_disputes SET status='REVIEWING', updated_at=NOW() WHERE id=$1 AND status='OPEN' RETURNING order_id::text`, [id]);
    if (!r.rows[0]) throw new ConflictException('Khiếu nại không ở trạng thái chờ tiếp nhận.');
    await this.db.query(`INSERT INTO order_dispute_messages(dispute_id, author_id, author_role, content) VALUES($1,$2,'ADMIN','Quản trị viên đã tiếp nhận khiếu nại và đang xem xét.')`, [id, adminId]);
    const o = (await this.db.query(`SELECT order_code, buyer_id::text, seller_id::text FROM orders WHERE id=$1`, [r.rows[0].order_id])).rows[0];
    for (const u of [o.buyer_id, o.seller_id]) this.notify(u, 'Khiếu nại đang được xem xét', `Quản trị viên đã tiếp nhận khiếu nại của đơn ${o.order_code}.`, r.rows[0].order_id);
    return { id };
  }
  async adminMessage(adminId: string, id: string, content: string) {
    const text = String(content ?? '').trim();
    if (text.length < 2 || text.length > 2000) throw new BadRequestException('Nội dung cần từ 2 đến 2000 ký tự.');
    const d = (await this.db.query(`SELECT d.order_id::text, o.order_code, o.buyer_id::text, o.seller_id::text FROM order_disputes d JOIN orders o ON o.id=d.order_id WHERE d.id=$1 AND d.status IN ('OPEN','REVIEWING')`, [id])).rows[0];
    if (!d) throw new NotFoundException('Khiếu nại không còn được xử lý.');
    await this.db.query(`INSERT INTO order_dispute_messages(dispute_id, author_id, author_role, content) VALUES($1,$2,'ADMIN',$3)`, [id, adminId, text]);
    for (const u of [d.buyer_id, d.seller_id]) this.notify(u, 'Quản trị viên phản hồi khiếu nại', `Đơn ${d.order_code}: ${text.slice(0, 120)}`, d.order_id);
    return { id };
  }

  async resolve(adminId: string, id: string, dto: { decision?: string; amount?: string; note?: string }) {
    const decision = String(dto.decision ?? '').toUpperCase() as Decision;
    if (!['REFUND_FULL', 'REFUND_PARTIAL', 'REJECT'].includes(decision)) throw new BadRequestException('Quyết định không hợp lệ.');
    const note = String(dto.note ?? '').trim();
    if (note.length < 5 || note.length > 1000) throw new BadRequestException('Ghi rõ lý do quyết định (5–1000 ký tự) — hai bên sẽ thấy nội dung này.');
    if (decision === 'REFUND_PARTIAL' && !/^[1-9]\d{0,14}$/.test(String(dto.amount ?? ''))) throw new BadRequestException('Nhập số tiền hoàn một phần (VND, số nguyên dương).');
    const d = (await this.db.query(`SELECT d.id::text, d.status, d.order_id::text, d.prior_order_status, o.order_code, o.order_status::text AS order_status, o.payment_status::text AS pay, o.buyer_id::text, o.seller_id::text, o.product_id::text, o.total_amount::text AS total
      FROM order_disputes d JOIN orders o ON o.id=d.order_id WHERE d.id=$1`, [id])).rows[0];
    if (!d) throw new NotFoundException('Không tìm thấy khiếu nại.');
    if (d.status === 'RESOLVED') throw new ConflictException('Khiếu nại này đã được xử lý.');

    let refunded = 0n; let manualTransfer = false;
    if (decision === 'REJECT') {
      await this.db.transaction(async c => {
        if (d.order_status === 'DISPUTED') {
          const back = d.prior_order_status && ['SHIPPING', 'DELIVERED'].includes(d.prior_order_status) ? d.prior_order_status : 'DELIVERED';
          await c.query(`UPDATE orders SET order_status=$2::order_status, updated_at=NOW() WHERE id=$1`, [d.order_id, back]);
          await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,$2::order_status,$3,$4)`, [d.order_id, back, adminId, `[Admin] Bác khiếu nại: ${note}`]);
        }
      });
    } else if (d.order_status === 'COMPLETED') {
      const res = await this.refunds.refund(adminId, d.order_id, { amount: decision === 'REFUND_PARTIAL' ? String(dto.amount) : undefined, reason: `Khiếu nại ${d.order_code}: ${note}` }, `dispute-${id}`);
      refunded = BigInt((res.data as { amount?: string })?.amount ?? '0');
    } else if (d.order_status === 'DISPUTED') {
      if (decision === 'REFUND_PARTIAL') throw new BadRequestException('Chỉ hoàn một phần được khi đơn đã hoàn tất. Đơn đang tranh chấp chỉ hoàn toàn bộ hoặc bác khiếu nại.');
      refunded = BigInt(d.total.split('.')[0] || '0');
      manualTransfer = ['PAID', 'PROCESSING'].includes(d.pay);
      await this.db.transaction(async c => {
        await c.query(`UPDATE orders SET order_status='CANCELLED', cancelled_at=NOW(), payment_status = CASE WHEN payment_status IN ('PAID','PROCESSING') THEN 'REFUNDED'::payment_status ELSE payment_status END, updated_at=NOW() WHERE id=$1`, [d.order_id]);
        if (d.product_id) await c.query(`UPDATE products SET status='ACTIVE', updated_at=NOW() WHERE id=$1 AND status IN ('RESERVED')`, [d.product_id]);
        await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,'CANCELLED',$2,$3)`, [d.order_id, adminId, `[Admin] Hoàn tiền theo khiếu nại: ${note}`]);
      });
    } else {
      throw new ConflictException(`Đơn đang ở trạng thái ${d.order_status}, không thể hoàn tiền theo khiếu nại.`);
    }

    const label = decision === 'REJECT' ? 'Bác khiếu nại' : decision === 'REFUND_FULL' ? 'Hoàn tiền toàn bộ' : 'Hoàn tiền một phần';
    await this.db.transaction(async c => {
      await c.query(`UPDATE order_disputes SET status='RESOLVED', resolution=$2, refund_amount=$3, admin_note=$4, resolved_by=$5, resolved_at=NOW(), updated_at=NOW() WHERE id=$1`, [id, decision, refunded > 0n ? refunded.toString() : null, note, adminId]);
      await c.query(`INSERT INTO order_dispute_messages(dispute_id, author_id, author_role, content) VALUES($1,$2,'ADMIN',$3)`, [id, adminId, `Quyết định: ${label}${refunded > 0n ? ` (${Number(refunded).toLocaleString('vi-VN')} ₫)` : ''}. ${note}`]);
    });
    try { await this.db.query(`INSERT INTO admin_audit_logs(actor_id, actor_name, action, entity_type, entity_id, metadata) VALUES($1::uuid,'Admin','DISPUTE_RESOLVED','ORDER_DISPUTE',$2,$3::jsonb)`, [adminId, id, JSON.stringify({ decision, refund: refunded.toString(), orderId: d.order_id })]); } catch { /* nhật ký là phụ */ }
    const money = refunded > 0n ? ` Số tiền hoàn: ${Number(refunded).toLocaleString('vi-VN')} ₫.` : '';
    this.notify(d.buyer_id, 'Khiếu nại đã được giải quyết', `Đơn ${d.order_code}: ${label}.${money} ${note}`, d.order_id);
    this.notify(d.seller_id, 'Khiếu nại đã được giải quyết', `Đơn ${d.order_code}: ${label}.${money} ${note}`, d.order_id);
    return { decision, refunded: refunded.toString(), manualTransfer };
  }
}
