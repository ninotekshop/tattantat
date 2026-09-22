import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminOrdersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list(
    @Query('q') query?: string,
    @Query('status') status?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = Math.max(Number(rawPage) || 1, 1);
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const searchTerm = query?.trim() ? `%${query.trim()}%` : null;
    const filterStatus = status?.toUpperCase() || null;

    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT o.id, o.order_code, o.total_amount, o.order_status, o.payment_status, o.payment_method,
                o.created_at, o.completed_at,
                buyer.id AS buyer_id, buyer.full_name AS buyer_name, buyer.email AS buyer_email,
                seller.id AS seller_id, seller.full_name AS seller_name
         FROM orders o
         LEFT JOIN users buyer ON buyer.id = o.buyer_id
         LEFT JOIN users seller ON seller.id = o.seller_id
         WHERE ($1::text IS NULL OR o.order_code ILIKE $1 OR o.id::text ILIKE $1 OR buyer.full_name ILIKE $1)
           AND ($2::text IS NULL OR o.order_status = $2)
         ORDER BY o.created_at DESC
         LIMIT $3 OFFSET $4`,
        [searchTerm, filterStatus, limit, offset],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM orders o
         LEFT JOIN users buyer ON buyer.id = o.buyer_id
         WHERE ($1::text IS NULL OR o.order_code ILIKE $1 OR o.id::text ILIKE $1 OR buyer.full_name ILIKE $1)
           AND ($2::text IS NULL OR o.order_status = $2)`,
        [searchTerm, filterStatus],
      ),
    ]);

    return {
      success: true,
      data: items.rows,
      meta: {
        page,
        limit,
        total: count.rows[0]?.total || 0,
      },
      message: null,
      errorCode: null,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const order = await this.db.query(
      `SELECT o.*,
              buyer.id AS buyer_id, buyer.full_name AS buyer_name, buyer.phone AS buyer_phone,
              seller.id AS seller_id, seller.full_name AS seller_name, seller.phone AS seller_phone
       FROM orders o
       LEFT JOIN users buyer ON buyer.id = o.buyer_id
       LEFT JOIN users seller ON seller.id = o.seller_id
       WHERE (${isUuid ? 'o.id = $1::uuid' : 'FALSE'}) OR o.order_code = $1`,
      [id],
    );
    if (!order.rows[0]) throw new BadRequestException('Không tìm thấy đơn hàng');
    return { success: true, data: order.rows[0], message: null, errorCode: null };
  }
}
