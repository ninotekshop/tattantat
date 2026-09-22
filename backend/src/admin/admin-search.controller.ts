import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin/search')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminSearchController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async search(@Query('q') rawQuery?: string) {
    const q = rawQuery?.trim();
    if (!q || q.length < 2) {
      return { success: true, data: { posts: [], users: [], orders: [] }, message: null, errorCode: null };
    }

    const term = `%${q}%`;

    const [posts, users, orders] = await Promise.all([
      this.db.query(
        `SELECT p.id, p.title, p.price, p.status, p.image_url, p.created_at
         FROM products p
         WHERE p.deleted_at IS NULL AND (p.title ILIKE $1 OR p.id::text ILIKE $1)
         ORDER BY p.created_at DESC LIMIT 5`,
        [term],
      ),
      this.db.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.avatar_url
         FROM users u
         WHERE u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 OR u.id::text ILIKE $1
         ORDER BY u.created_at DESC LIMIT 5`,
        [term],
      ),
      this.db.query(
        `SELECT o.id, o.order_code, o.total_amount, o.order_status, o.created_at
         FROM orders o
         WHERE o.order_code ILIKE $1 OR o.id::text ILIKE $1
         ORDER BY o.created_at DESC LIMIT 5`,
        [term],
      ),
    ]);

    return {
      success: true,
      data: {
        posts: posts.rows,
        users: users.rows,
        orders: orders.rows,
      },
      message: null,
      errorCode: null,
    };
  }
}
