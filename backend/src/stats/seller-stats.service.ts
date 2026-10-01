import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const ok = <T>(data: T) => ({ success: true, data, message: null, errorCode: null });

@Injectable()
export class SellerStatsService {
  constructor(private readonly db: DatabaseService) {}

  async overview(sellerId: string, rawDays: unknown) {
    const days = Number(rawDays ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new BadRequestException('Khoảng ngày không hợp lệ (1–365).');
    const since = `now() - ($2 || ' days')::interval`;
    const [totals, orders, daily, top] = await Promise.all([
      this.db.query(`SELECT
          (SELECT COUNT(*)::int FROM products WHERE seller_id=$1 AND status='ACTIVE' AND deleted_at IS NULL) AS active_listings,
          (SELECT COALESCE(SUM(view_count),0)::bigint::text FROM products WHERE seller_id=$1 AND deleted_at IS NULL) AS total_views,
          (SELECT COUNT(*)::int FROM chats WHERE seller_id=$1 AND created_at >= ${since}) AS new_chats,
          (SELECT COUNT(*)::int FROM favorites f JOIN products p ON p.id=f.product_id WHERE p.seller_id=$1 AND f.created_at >= ${since}) AS new_favorites`, [sellerId, String(days)]).catch(() => ({ rows: [{ active_listings: 0, total_views: '0', new_chats: 0, new_favorites: 0 }] })),
      this.db.query(`SELECT COUNT(*)::int AS orders, COUNT(*) FILTER (WHERE order_status='COMPLETED')::int AS completed, COUNT(*) FILTER (WHERE order_status='CANCELLED')::int AS cancelled,
          COALESCE(SUM(seller_payout_amount) FILTER (WHERE order_status='COMPLETED'),0)::text AS revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE order_status NOT IN ('CANCELLED','COMPLETED')),0)::text AS in_progress
        FROM orders WHERE seller_id=$1 AND created_at >= ${since}`, [sellerId, String(days)]),
      this.db.query(`SELECT to_char(d::date,'YYYY-MM-DD') AS day,
          COUNT(o.id)::int AS orders, COALESCE(SUM(o.seller_payout_amount) FILTER (WHERE o.order_status='COMPLETED'),0)::text AS revenue
        FROM generate_series((now() - ($2 || ' days')::interval)::date, now()::date, '1 day') d
        LEFT JOIN orders o ON o.seller_id=$1 AND o.created_at::date = d::date GROUP BY d ORDER BY d`, [sellerId, String(days)]),
      this.db.query(`SELECT p.id::text, p.title, p.view_count::text AS views, p.status::text AS status,
          (SELECT COUNT(*)::int FROM chats c WHERE c.product_id=p.id) AS chats,
          (SELECT COUNT(*)::int FROM orders o WHERE o.product_id=p.id AND o.order_status<>'CANCELLED') AS orders
        FROM products p WHERE p.seller_id=$1 AND p.deleted_at IS NULL ORDER BY p.view_count DESC, p.created_at DESC LIMIT 10`, [sellerId]),
    ]);
    const t = totals.rows[0], o = orders.rows[0];
    return ok({ days, totals: { activeListings: t.active_listings, totalViews: t.total_views, newChats: t.new_chats, newFavorites: t.new_favorites }, orders: { total: o.orders, completed: o.completed, cancelled: o.cancelled, revenue: o.revenue, inProgress: o.in_progress, completionRate: o.orders ? Math.round((o.completed / o.orders) * 100) : null }, daily: daily.rows, topListings: top.rows });
  }
}
