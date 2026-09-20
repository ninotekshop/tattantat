import { BadRequestException, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

@Controller('promotions/orders')
@UseGuards(JwtAuthGuard)
export class PromotionActivationController {
  constructor(private readonly db: DatabaseService) {}

  @Post(':id/activate')
  async activate(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query<{ product_id: string; promotion_type_snapshot: string; duration_hours_snapshot: number }>(
      `SELECT product_id,promotion_type_snapshot::text,duration_hours_snapshot FROM promotion_orders
       WHERE id=$1 AND seller_id=$2 AND status='PAID'`, [id, request.user.id]);
    const order = result.rows[0];
    if (!order) throw new BadRequestException('Promotion order chưa thanh toán');
    const activation = await this.db.query(
      `INSERT INTO promotion_activations(promotion_order_id,product_id,promotion_type,starts_at,ends_at)
       VALUES($1,$2,$3::promotion_type,NOW(),NOW()+($4::text||' hours')::interval)
       ON CONFLICT(promotion_order_id) DO NOTHING RETURNING *`,
      [id, order.product_id, order.promotion_type_snapshot, order.duration_hours_snapshot]);
    if (order.promotion_type_snapshot === 'FEATURED') await this.db.query('UPDATE products SET is_featured=TRUE WHERE id=$1', [order.product_id]);
    return { success: true, data: activation.rows[0] ?? { alreadyActive: true }, message: null, errorCode: null };
  }
}
