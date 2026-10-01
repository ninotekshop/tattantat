import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminAuditLogService } from './admin-audit-log.service';
import { NotificationsService } from '../account/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
/** Các bước admin được phép chuyển. COMPLETED không nằm ở đây: hoàn tất đơn phải đi qua luồng tài chính (ghi sổ, giải ngân). */
const ADMIN_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'], PREPARING: ['SHIPPING', 'CANCELLED'], SHIPPING: ['DELIVERED'],
};
const STATUS_TEXT: Record<string, string> = { CONFIRMED: 'đã được xác nhận', PREPARING: 'đang được chuẩn bị', SHIPPING: 'đang được giao', DELIVERED: 'đã giao thành công', CANCELLED: 'đã bị hủy' };

class OrderStatusDto {
  @IsString() @MaxLength(20) status!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminOrdersController {
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly audit: AdminAuditLogService) {}

  /** Dựng điều kiện lọc dùng chung cho danh sách, thống kê và xuất file. */
  private filters(q: Record<string, string | undefined>) {
    const where: string[] = []; const params: unknown[] = [];
    const add = (sql: string, value: unknown) => { params.push(value); where.push(sql.split('$#').join(`$${params.length}`)); };
    if (q.q?.trim()) add(`(o.order_code ILIKE $# OR o.id::text ILIKE $# OR buyer.full_name ILIKE $# OR buyer.email ILIKE $# OR buyer.phone ILIKE $# OR seller.full_name ILIKE $# OR p.title ILIKE $#)`, `%${q.q.trim()}%`);
    if (q.status?.trim()) { if (!ORDER_STATUSES.includes(q.status.trim().toUpperCase())) throw new BadRequestException('Trạng thái đơn hàng không hợp lệ.'); add(`o.order_status::text = $#`, q.status.trim().toUpperCase()); }
    if (q.paymentStatus?.trim()) add(`o.payment_status::text = $#`, q.paymentStatus.trim().toUpperCase());
    if (q.paymentMethod?.trim()) add(`o.payment_method::text = $#`, q.paymentMethod.trim().toUpperCase());
    const day = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    const from = day(q.from), to = day(q.to);
    if (q.from && !from || q.to && !to) throw new BadRequestException('Ngày lọc không hợp lệ (định dạng YYYY-MM-DD).');
    if (from) add(`o.created_at >= ($#::date)::timestamptz`, from);
    if (to) add(`o.created_at < (($#::date) + 1)::timestamptz`, to);
    const num = (v?: string) => (v && /^\d{1,15}$/.test(v) ? v : null);
    if (q.minAmount && !num(q.minAmount) || q.maxAmount && !num(q.maxAmount)) throw new BadRequestException('Số tiền lọc không hợp lệ.');
    if (num(q.minAmount)) add(`o.total_amount >= $#::numeric`, num(q.minAmount));
    if (num(q.maxAmount)) add(`o.total_amount <= $#::numeric`, num(q.maxAmount));
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
  }
  private static readonly FROM = `FROM orders o
         LEFT JOIN products p ON p.id = o.product_id
         LEFT JOIN users buyer ON buyer.id = o.buyer_id
         LEFT JOIN users seller ON seller.id = o.seller_id`;
  private static readonly FEE = `COALESCE(NULLIF(o.platform_fee_amount,0), ROUND(o.total_amount * 0.025))`;

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const f = this.filters(query);
    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT o.id, o.order_code, o.total_amount::text AS total_amount,
                ${AdminOrdersController.FEE}::text AS platform_fee,
                (o.total_amount - ${AdminOrdersController.FEE})::text AS seller_net_amount,
                o.order_status::text AS order_status, o.payment_status::text AS payment_status,
                o.shipping_status::text AS shipping_status, o.payment_method::text AS payment_method,
                o.created_at, o.completed_at,
                COALESCE(p.title, 'Sản phẩm mua bán') AS product_title,
                buyer.id AS buyer_id, buyer.full_name AS buyer_name, buyer.email AS buyer_email,
                seller.id AS seller_id, seller.full_name AS seller_name, seller.email AS seller_email
         ${AdminOrdersController.FROM}
         ${f.sql}
         ORDER BY o.created_at DESC
         LIMIT $${f.params.length + 1} OFFSET $${f.params.length + 2}`,
        [...f.params, limit, (page - 1) * limit],
      ),
      this.db.query(`SELECT COUNT(*)::int AS total, COALESCE(SUM(o.total_amount),0)::text AS amount ${AdminOrdersController.FROM} ${f.sql}`, f.params),
    ]);
    return { success: true, data: items.rows, meta: { page, limit, total: count.rows[0]?.total || 0, amount: count.rows[0]?.amount || '0' }, message: null, errorCode: null };
  }

  /** Thẻ thống kê: đếm theo trạng thái + doanh thu, không phụ thuộc bộ lọc để luôn thấy bức tranh chung. */
  @Get('stats')
  async stats() {
    const [byStatus, money] = await Promise.all([
      this.db.query(`SELECT order_status::text AS status, COUNT(*)::int AS count FROM orders GROUP BY 1`),
      this.db.query(`SELECT
          COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today,
          COALESCE(SUM(total_amount) FILTER (WHERE order_status='COMPLETED'),0)::text AS completed_amount,
          COALESCE(SUM(COALESCE(NULLIF(platform_fee_amount,0), ROUND(total_amount*0.025))) FILTER (WHERE order_status='COMPLETED'),0)::text AS platform_fee,
          COALESCE(SUM(total_amount) FILTER (WHERE order_status NOT IN ('COMPLETED','CANCELLED')),0)::text AS in_progress_amount
        FROM orders`),
    ]);
    const counts: Record<string, number> = {}; let total = 0;
    for (const r of byStatus.rows) { counts[r.status] = r.count; total += r.count; }
    return { success: true, data: { total, counts, ...money.rows[0] }, message: null, errorCode: null };
  }

  /** Xuất CSV theo bộ lọc hiện tại (tối đa 5.000 đơn). Có BOM để Excel đọc đúng tiếng Việt. */
  @Get('export')
  async exportCsv(@Query() query: Record<string, string | undefined>, @Res() res: Response) {
    const f = this.filters(query);
    const rows = (await this.db.query(
      `SELECT o.order_code, o.created_at, o.order_status::text AS order_status, o.payment_status::text AS payment_status, o.payment_method::text AS payment_method,
              COALESCE(p.title,'') AS product_title, buyer.full_name AS buyer_name, buyer.phone AS buyer_phone, seller.full_name AS seller_name, seller.phone AS seller_phone,
              o.total_amount::text AS total_amount, ${AdminOrdersController.FEE}::text AS platform_fee, (o.total_amount - ${AdminOrdersController.FEE})::text AS seller_net
       ${AdminOrdersController.FROM} ${f.sql} ORDER BY o.created_at DESC LIMIT 5000`, f.params)).rows;
    const cell = (v: unknown) => { let t = v == null ? '' : v instanceof Date ? v.toISOString() : String(v); if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const head = ['Mã đơn', 'Ngày tạo', 'Trạng thái', 'Thanh toán', 'Phương thức', 'Sản phẩm', 'Người mua', 'SĐT mua', 'Người bán', 'SĐT bán', 'Giá trị', 'Phí nền tảng', 'Người bán nhận'];
    const csv = '﻿' + [head.join(','), ...rows.map(r => [r.order_code, r.created_at, r.order_status, r.payment_status, r.payment_method, r.product_title, r.buyer_name, r.buyer_phone, r.seller_name, r.seller_phone, r.total_amount, r.platform_fee, r.seller_net].map(cell).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="don-hang-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get('subscriptions/list')
  async listSubscriptions() {
    const result = await this.db.query(
      `SELECT s.id, s.seller_id, COALESCE(u.full_name, 'Khách hàng / Shop') AS seller_name,
              u.email AS seller_email, u.phone AS seller_phone,
              COALESCE(s.billing_cycle_snapshot, 'Gói Đẩy tin VIP') AS plan_name,
              s.price_snapshot::text AS price, COALESCE(s.max_listings_snapshot, 50) AS max_listings,
              s.status, s.starts_at, s.ends_at, s.created_at
       FROM subscriptions s
       LEFT JOIN users u ON u.id = s.seller_id
       ORDER BY s.created_at DESC`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Get('advertising/list')
  async listAdvertising() {
    const result = await this.db.query(
      `SELECT a.id, a.seller_id, COALESCE(u.full_name, 'Nhà quảng cáo') AS user_name,
              u.email AS user_email, u.phone AS user_phone,
              a.campaign_type AS ad_type, a.budget::text AS price,
              a.pricing_model, a.created_at, a.status, a.start_at, a.end_at, a.paid_at, p.title AS product_title
       FROM advertising_campaigns a
       LEFT JOIN users u ON u.id = a.seller_id
       LEFT JOIN products p ON p.id = a.product_id
       ORDER BY a.created_at DESC`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  /** Hủy chiến dịch quảng cáo đang chờ thanh toán (chưa ghi nhận doanh thu). */
  @Post('advertising/:id/cancel')
  async cancelAdvertising(@Param('id') id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Mã chiến dịch không hợp lệ.');
    const row = (await this.db.query(`UPDATE advertising_campaigns SET status='CANCELLED', updated_at=NOW() WHERE id=$1 AND status='PENDING_PAYMENT' RETURNING seller_id::text`, [id])).rows[0];
    if (!row) throw new NotFoundException('Chiến dịch không còn ở trạng thái chờ thanh toán.');
    await this.notifications.create(row.seller_id, 'AD_CANCELLED', 'Chiến dịch quảng cáo đã bị hủy', 'Chiến dịch quảng cáo của bạn chưa được thanh toán nên đã bị hủy. Bạn có thể tạo chiến dịch mới bất cứ lúc nào.', 'ADVERTISING', id).catch(() => undefined);
    return { success: true, data: { id }, message: 'Đã hủy chiến dịch chờ thanh toán.', errorCode: null };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const order = (await this.db.query(
      `SELECT o.id, o.order_code, o.order_status::text AS order_status, o.payment_status::text AS payment_status, o.shipping_status::text AS shipping_status,
              o.payment_method::text AS payment_method, o.shipping_method, o.note, o.quantity,
              o.product_price::text, o.shipping_fee::text, o.discount_amount::text, o.total_amount::text,
              ${AdminOrdersController.FEE}::text AS platform_fee, o.payment_fee_amount::text AS payment_fee,
              (o.total_amount - ${AdminOrdersController.FEE})::text AS seller_net_amount,
              o.created_at, o.confirmed_at, o.completed_at, o.cancelled_at, o.product_id,
              COALESCE(p.title, 'Sản phẩm mua bán') AS product_title,
              buyer.id AS buyer_id, buyer.full_name AS buyer_name, buyer.email AS buyer_email, buyer.phone AS buyer_phone,
              seller.id AS seller_id, seller.full_name AS seller_name, seller.email AS seller_email, seller.phone AS seller_phone,
              a.receiver_name, a.receiver_phone, a.address_line
       ${AdminOrdersController.FROM}
       LEFT JOIN user_addresses a ON a.id = o.shipping_address_id
       WHERE (${isUuid ? 'o.id = $1::uuid' : 'FALSE'}) OR o.order_code = $1`,
      [id],
    )).rows[0];
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const [items, history, payment, shipment] = await Promise.all([
      this.db.query(`SELECT product_name, unit_price::text, quantity, subtotal::text FROM order_items WHERE order_id=$1 ORDER BY created_at`, [order.id]),
      this.db.query(`SELECT h.status::text AS status, h.note, h.created_at, COALESCE(u.full_name, 'Hệ thống') AS actor FROM order_status_history h LEFT JOIN users u ON u.id = h.changed_by WHERE h.order_id=$1 ORDER BY h.created_at`, [order.id]),
      this.db.query(`SELECT provider, status::text AS status, amount::text, transaction_id, paid_at, created_at FROM payments WHERE order_id=$1 ORDER BY created_at DESC LIMIT 5`, [order.id]),
      this.db.query(`SELECT carrier, tracking_code, status::text AS status, picked_up_at, delivered_at FROM shipments WHERE order_id=$1`, [order.id]),
    ]);
    const allowed = ADMIN_TRANSITIONS[order.order_status] ?? [];
    return { success: true, data: { ...order, items: items.rows, history: history.rows, payments: payment.rows, shipment: shipment.rows[0] ?? null, allowedTransitions: allowed }, message: null, errorCode: null };
  }

  /** Admin đổi trạng thái đơn (các bước vận hành). Ghi lịch sử + nhật ký + báo cho cả hai bên. */
  @Post(':id/status')
  async changeStatus(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() dto: OrderStatusDto) {
    const target = String(dto.status ?? '').toUpperCase();
    const reason = String(dto.reason ?? '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Mã đơn hàng không hợp lệ.');
    if (!ORDER_STATUSES.includes(target)) throw new BadRequestException('Trạng thái không hợp lệ.');
    if (target === 'CANCELLED' && reason.length < 3) throw new BadRequestException('Nhập lý do hủy đơn (tối thiểu 3 ký tự).');
    const out = await this.db.transaction(async client => {
      const o = (await client.query(`SELECT id, order_code, buyer_id::text, seller_id::text, product_id::text, order_status::text AS status, payment_status::text AS pay FROM orders WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!o) throw new NotFoundException('Không tìm thấy đơn hàng.');
      if (!(ADMIN_TRANSITIONS[o.status] ?? []).includes(target)) {
        throw new BadRequestException(target === 'COMPLETED' ? 'Đơn chỉ được hoàn tất qua luồng đối soát/giải ngân tài chính, không đổi thủ công được.' : `Không thể chuyển đơn từ ${o.status} sang ${target}.`);
      }
      if (target === 'CANCELLED' && ['PAID', 'PROCESSING', 'PARTIALLY_REFUNDED'].includes(o.pay)) {
        throw new BadRequestException('Đơn đã thanh toán nên không hủy trực tiếp được — cần hoàn tiền qua luồng tài chính trước.');
      }
      await client.query(
        `UPDATE orders SET order_status=$2::order_status, updated_at=NOW(),
           confirmed_at = CASE WHEN $2='CONFIRMED' THEN COALESCE(confirmed_at, NOW()) ELSE confirmed_at END,
           cancelled_at = CASE WHEN $2='CANCELLED' THEN NOW() ELSE cancelled_at END
         WHERE id=$1`, [id, target]);
      if (target === 'CANCELLED' && o.product_id) await client.query(`UPDATE products SET status='ACTIVE', updated_at=NOW() WHERE id=$1 AND status='RESERVED'`, [o.product_id]);
      await client.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,$2::order_status,$3,$4)`, [id, target, request.user.id, reason ? `[Admin] ${reason}` : '[Admin] Cập nhật trạng thái']);
      return o;
    });
    await this.audit.log(request.user.id, null, 'ORDER_STATUS_CHANGE', 'ORDER', id, { from: out.status, to: target, reason: reason || null });
    const text = STATUS_TEXT[target] ?? 'đã được cập nhật';
    const note = reason ? ` Lý do: ${reason}` : '';
    for (const uid of new Set([out.buyer_id, out.seller_id])) {
      void this.notifications.create(uid, 'ORDER_STATUS', 'Cập nhật đơn hàng', `Đơn ${out.order_code} ${text} bởi quản trị viên.${note}`, 'ORDER', id).catch(() => undefined);
    }
    return { success: true, data: { id, status: target }, message: `Đã chuyển đơn ${out.order_code} sang ${target}.`, errorCode: null };
  }

  @Get(':id/chat-history')
  async chatHistory(@Param('id') id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const order = await this.db.query(
      `SELECT o.id, o.buyer_id, o.seller_id, o.product_id,
              buyer.full_name AS buyer_name, seller.full_name AS seller_name
       FROM orders o
       LEFT JOIN users buyer ON buyer.id = o.buyer_id
       LEFT JOIN users seller ON seller.id = o.seller_id
       WHERE (${isUuid ? 'o.id = $1::uuid' : 'FALSE'}) OR o.order_code = $1`,
      [id],
    );

    let buyerName = 'Bên Mua';
    let sellerName = 'Bên Bán';
    let buyerId = '';
    let sellerId = '';

    if (order.rows[0]) {
      buyerName = order.rows[0].buyer_name || 'Bên Mua';
      sellerName = order.rows[0].seller_name || 'Bên Bán';
      buyerId = order.rows[0].buyer_id;
      sellerId = order.rows[0].seller_id;
    }

    let messages: any[] = [];
    if (buyerId && sellerId) {
      const chatRes = await this.db.query(
        `SELECT m.id, m.sender_id, m.content, m.created_at,
                COALESCE(u.full_name, 'Thành viên') AS sender_name
         FROM messages m
         LEFT JOIN chats c ON c.id = m.chat_id
         LEFT JOIN users u ON u.id = m.sender_id
         WHERE (c.buyer_id = $1 AND c.seller_id = $2)
            OR (c.buyer_id = $2 AND c.seller_id = $1)
            OR m.sender_id = $1 OR m.sender_id = $2
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [buyerId, sellerId],
      );
      messages = chatRes.rows;
    }

    return {
      success: true,
      data: {
        orderId: id,
        buyerName,
        sellerName,
        messages
      },
      message: null,
      errorCode: null,
    };
  }
}
