import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ModeratorGuard } from './moderator.guard';

type Kind = 'LISTING' | 'REPORT' | 'DISPUTE' | 'VERIFY' | 'ORDER' | 'CANCEL' | 'PAYMENT';
type Alert = { id: string; kind: Kind; from: 'BUYER' | 'SELLER' | 'SYSTEM'; title: string; detail: string; createdAt: string; nav: string; total: number };

const REASON: Record<string, string> = { FRAUD: 'Nghi ngờ lừa đảo', SPAM: 'Spam', PROHIBITED: 'Hàng cấm', FAKE: 'Hàng giả', WRONG_INFO: 'Thông tin sai lệch' };

/** Trung tâm cảnh báo cho quản trị viên: gom các việc cần xử lý từ người mua / người bán. */
@Controller('admin/alerts')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class AdminAlertsController {
  private readonly log = new Logger(AdminAlertsController.name);
  constructor(private readonly db: DatabaseService) {}

  private async run(kind: Kind, sql: string, map: (r: Record<string, any>) => Omit<Alert, 'kind' | 'total'>): Promise<Alert[]> {
    try {
      const rows = (await this.db.query(sql)).rows as Record<string, any>[];
      return rows.map((r) => ({ ...map(r), kind, total: Number(r.total ?? rows.length) }));
    } catch (e) {
      this.log.warn(`Cảnh báo ${kind} bỏ qua: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    }
  }

  /** Số việc cần xử lý theo từng mục menu quản trị. */
  @Get('counts')
  async counts() {
    const n = async (sql: string) => { try { return Number((await this.db.query(sql)).rows[0]?.n ?? 0); } catch { return 0; } };
    const [listings, verify, reports, payments, orders, users] = await Promise.all([
      n(`SELECT COUNT(*)::int AS n FROM products WHERE status='PENDING' AND deleted_at IS NULL`),
      n(`SELECT ((SELECT COUNT(*) FROM phone_verifications WHERE status='PENDING') + (SELECT COUNT(*) FROM identity_verifications WHERE status='PENDING'))::int AS n`),
      n(`SELECT COUNT(*)::int AS n FROM content_reports WHERE status IN ('OPEN','REVIEWING')`),
      n(`SELECT COUNT(*)::int AS n FROM ledger_transactions WHERE status='FAILED'`),
      n(`SELECT COUNT(*)::int AS n FROM orders WHERE created_at > NOW()-INTERVAL '24 hours'`),
      n(`SELECT COUNT(*)::int AS n FROM users WHERE created_at > NOW()-INTERVAL '24 hours'`),
    ]);
    return { success: true, data: { 'tin-dang': listings, 'xac-minh': verify, reports, 'thanh-toan-online': payments, 'don-hang': orders, 'nguoi-dung': users }, message: null, errorCode: null };
  }

  @Get()
  @UseGuards(FinanceAdminGuard)
  async alerts() {
    const lists = await Promise.all([
      this.run('LISTING', `SELECT p.id, p.title, p.created_at, u.full_name, COUNT(*) OVER() AS total
        FROM products p LEFT JOIN users u ON u.id=p.seller_id WHERE p.status='PENDING' AND p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 8`,
        (r) => ({ id: `L${r.id}`, from: 'SELLER', title: 'Tin đăng chờ duyệt', detail: `${r.full_name ?? 'Người bán'} · ${r.title}`, createdAt: r.created_at, nav: 'tin-dang' })),
      this.run('REPORT', `SELECT r.id, r.reason, r.created_at, u.full_name, COUNT(*) OVER() AS total
        FROM content_reports r LEFT JOIN users u ON u.id=r.reporter_id WHERE r.status IN ('OPEN','REVIEWING') ORDER BY r.created_at DESC LIMIT 8`,
        (r) => ({ id: `R${r.id}`, from: 'BUYER', title: 'Báo cáo vi phạm mới', detail: `${r.full_name ?? 'Người dùng'} báo cáo: ${REASON[r.reason] ?? r.reason}`, createdAt: r.created_at, nav: 'reports' })),
      this.run('DISPUTE', `SELECT d.id, d.opened_role, d.reason_code, d.created_at, d.status, u.full_name, COUNT(*) OVER() AS total
        FROM order_disputes d LEFT JOIN users u ON u.id=d.opened_by WHERE d.status IN ('OPEN','REVIEWING') ORDER BY d.created_at DESC LIMIT 8`,
        (r) => ({ id: `D${r.id}`, from: r.opened_role === 'SELLER' ? 'SELLER' : 'BUYER', title: r.opened_role === 'SELLER' ? 'Người bán mở khiếu nại' : 'Người mua mở khiếu nại', detail: `${r.full_name ?? ''} · lý do ${r.reason_code}`, createdAt: r.created_at, nav: 'khieu-nai' })),
      this.run('VERIFY', `SELECT id, title, detail, created_at, COUNT(*) OVER() AS total FROM (
          SELECT v.id::text AS id, 'Yêu cầu xác minh số điện thoại' AS title, COALESCE(u.full_name,'Người dùng') || ' · ' || v.phone AS detail, v.created_at FROM phone_verifications v LEFT JOIN users u ON u.id=v.user_id WHERE v.status='PENDING'
          UNION ALL
          SELECT i.id::text, 'Hồ sơ xác minh CCCD', COALESCE(i.full_name,'Người dùng') || ' · ••••' || i.id_last4, i.created_at FROM identity_verifications i WHERE i.status='PENDING'
        ) x ORDER BY created_at DESC LIMIT 8`,
        (r) => ({ id: `V${r.id}`, from: 'SELLER', title: r.title, detail: r.detail, createdAt: r.created_at, nav: 'xac-minh' })),
      this.run('ORDER', `SELECT o.id, COALESCE(to_jsonb(o)->>'order_code', LEFT(o.id::text,8)) AS code, o.total_amount::text AS amount, o.created_at, bu.full_name, COUNT(*) OVER() AS total
        FROM orders o LEFT JOIN users bu ON bu.id=o.buyer_id WHERE o.created_at > NOW()-INTERVAL '24 hours' ORDER BY o.created_at DESC LIMIT 8`,
        (r) => ({ id: `O${r.id}`, from: 'BUYER', title: 'Đơn hàng mới', detail: `${r.full_name ?? 'Người mua'} · ${r.code} · ${Number(r.amount).toLocaleString('vi-VN')} đ`, createdAt: r.created_at, nav: 'don-hang' })),
      this.run('CANCEL', `SELECT o.id, COALESCE(to_jsonb(o)->>'order_code', LEFT(o.id::text,8)) AS code, o.updated_at, o.created_at, bu.full_name, COUNT(*) OVER() AS total
        FROM orders o LEFT JOIN users bu ON bu.id=o.buyer_id WHERE o.order_status::text='CANCELLED' AND COALESCE(o.updated_at,o.created_at) > NOW()-INTERVAL '48 hours' ORDER BY COALESCE(o.updated_at,o.created_at) DESC LIMIT 6`,
        (r) => ({ id: `C${r.id}`, from: 'BUYER', title: 'Đơn hàng bị hủy', detail: `${r.full_name ?? 'Người mua'} · ${r.code}`, createdAt: r.updated_at ?? r.created_at, nav: 'don-hang' })),
      this.run('PAYMENT', `SELECT t.id, t.created_at, COUNT(*) OVER() AS total FROM ledger_transactions t WHERE t.status='FAILED' ORDER BY t.created_at DESC LIMIT 4`,
        (r) => ({ id: `P${r.id}`, from: 'SYSTEM', title: 'Giao dịch thanh toán lỗi', detail: 'Cần đối soát trong mục Thanh toán online', createdAt: r.created_at, nav: 'thanh-toan-online' })),
    ]);
    const items = lists.flat().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 40);
    const counts: Record<string, number> = {};
    for (const l of lists) if (l[0]) counts[l[0].kind] = l[0].total;
    // Việc "cần xử lý" (không tính đơn mới / đơn hủy chỉ mang tính thông tin)
    const actionable = ['LISTING', 'REPORT', 'DISPUTE', 'VERIFY', 'PAYMENT'].reduce((s, k) => s + (counts[k] ?? 0), 0);
    return { success: true, data: { counts, actionable, items }, message: null, errorCode: null };
  }
}
