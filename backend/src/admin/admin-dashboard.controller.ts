import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditLogService,
  ) {}

  @Get()
  async getDashboard(@Query('range') rawRange?: string) {
    const range = (rawRange || '30d').toLowerCase();
    let days = 30;
    if (range === 'today' || range === 'hôm nay') days = 1;
    else if (range === '7d' || range === '7 ngày') days = 7;
    else if (range === '1y' || range === '365d') days = 365;

    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    // 1. KPI Metrics
    const [
      activePostsCur, activePostsPrev,
      newUsersCur, newUsersPrev,
      completedOrdersCur, completedOrdersPrev,
      revenueCur, revenuePrev,
      pendingPosts, pendingReports, failedTx, pendingVerifications,
      categoryDistribution,
      latestPosts, latestOrders,
      recentAuditLogs,
    ] = await Promise.all([
      this.db.query(`SELECT COUNT(*)::int AS count FROM products WHERE status='ACTIVE' AND deleted_at IS NULL AND created_at >= $1`, [currentStart]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM products WHERE status='ACTIVE' AND deleted_at IS NULL AND created_at >= $1 AND created_at < $2`, [previousStart, currentStart]),

      this.db.query(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= $1`, [currentStart]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= $1 AND created_at < $2`, [previousStart, currentStart]),

      this.db.query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status='COMPLETED' AND created_at >= $1`, [currentStart]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status='COMPLETED' AND created_at >= $1 AND created_at < $2`, [previousStart, currentStart]),

      this.db.query(`SELECT COALESCE(SUM(total_amount),0)::text AS sum FROM orders WHERE order_status='COMPLETED' AND created_at >= $1`, [currentStart]),
      this.db.query(`SELECT COALESCE(SUM(total_amount),0)::text AS sum FROM orders WHERE order_status='COMPLETED' AND created_at >= $1 AND created_at < $2`, [previousStart, currentStart]),

      // 2. Action Needed Items
      this.db.query(`SELECT COUNT(*)::int AS count FROM products WHERE status='PENDING' AND deleted_at IS NULL`),
      this.db.query(`SELECT COUNT(*)::int AS count FROM content_reports WHERE status IN ('OPEN', 'REVIEWING')`),
      this.db.query(`SELECT COUNT(*)::int AS count FROM ledger_transactions WHERE status='FAILED'`),
      this.db.query(`SELECT COUNT(*)::int AS count FROM users WHERE verification_status='PENDING'`),

      // 3. Category Distribution
      this.db.query(`
        SELECT p.category_id, COALESCE(cat.name, 'Đồ công nghệ') AS category_name, COUNT(*)::int AS count
        FROM products p
        LEFT JOIN listing_categories cat ON cat.id::text = p.category_id::text
        WHERE p.deleted_at IS NULL
        GROUP BY p.category_id, cat.name
        ORDER BY count DESC
        LIMIT 5
      `),

      // 4. Latest Posts
      this.db.query(`
        SELECT p.id, p.title, p.price, p.status, p.image_url, p.created_at,
               COALESCE(cat.name, 'Khác') AS category_name
        FROM products p
        LEFT JOIN listing_categories cat ON cat.id::text = p.category_id::text
        WHERE p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT 5
      `),

      // 5. Latest Orders
      this.db.query(`
        SELECT o.id, o.order_code, o.total_amount, o.order_status, o.payment_status,
               COALESCE(u.full_name, 'Khách hàng') AS buyer_name, o.created_at
        FROM orders o
        LEFT JOIN users u ON u.id = o.buyer_id
        ORDER BY o.created_at DESC
        LIMIT 5
      `),

      // 6. Recent Audit Logs
      this.audit.getRecentLogs(10),
    ]);

    const totalActiveCount = await this.db.query(`SELECT COUNT(*)::int AS count FROM products WHERE status='ACTIVE' AND deleted_at IS NULL`);
    const totalUsersCount = await this.db.query(`SELECT COUNT(*)::int AS count FROM users`);

    const curActive = activePostsCur.rows[0]?.count || 0;
    const prevActive = activePostsPrev.rows[0]?.count || 0;

    const curUsers = newUsersCur.rows[0]?.count || 0;
    const prevUsers = newUsersPrev.rows[0]?.count || 0;

    const curOrders = completedOrdersCur.rows[0]?.count || 0;
    const prevOrders = completedOrdersPrev.rows[0]?.count || 0;

    const curRev = BigInt(revenueCur.rows[0]?.sum || '0');
    const prevRev = BigInt(revenuePrev.rows[0]?.sum || '0');

    const calcTrend = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    const calcBigIntTrend = (cur: bigint, prev: bigint) => {
      if (prev === 0n) return cur > 0n ? 100 : 0;
      return Number(((cur - prev) * 100n) / prev);
    };

    return {
      success: true,
      data: {
        kpis: {
          activeListings: totalActiveCount.rows[0]?.count || curActive,
          activeListingsTrend: calcTrend(curActive, prevActive),
          newUsers: totalUsersCount.rows[0]?.count || curUsers,
          newUsersTrend: calcTrend(curUsers, prevUsers),
          completedOrders: curOrders,
          completedOrdersTrend: calcTrend(curOrders, prevOrders),
          totalRevenue: curRev.toString(),
          revenueTrend: calcBigIntTrend(curRev, prevRev),
        },
        actionRequired: {
          pendingPosts: pendingPosts.rows[0]?.count || 0,
          pendingReports: pendingReports.rows[0]?.count || 0,
          failedTransactions: failedTx.rows[0]?.count || 0,
          pendingVerifications: pendingVerifications.rows[0]?.count || 0,
        },
        categories: categoryDistribution.rows,
        latestPosts: latestPosts.rows,
        latestOrders: latestOrders.rows,
        recentActivities: recentAuditLogs,
      },
      message: null,
      errorCode: null,
    };
  }
}
