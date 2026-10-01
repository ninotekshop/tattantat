import { BadRequestException, Controller, ForbiddenException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LedgerService } from '../finance/ledger.service';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../account/notifications.service';
@Controller('orders') @UseGuards(JwtAuthGuard) export class OrderFinancialController {
  constructor(private readonly ledger: LedgerService, private readonly db: DatabaseService, private readonly notifications: NotificationsService) {}
  @Post(':id/complete') async complete(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    const info = (await this.db.query<{ payment_method: string; seller_id: string }>('SELECT payment_method::text, seller_id FROM orders WHERE id=$1', [id])).rows[0];
    if (info && info.seller_id === request.user.id && info.payment_method !== 'COD') throw new BadRequestException('Đơn thanh toán online được tất toán khi người mua xác nhận đã nhận hàng (hoặc tự động sau thời hạn quy định).');
    const completed = await this.ledger.completeOrder(id, request.user.id);
    const buyer = await this.db.query<{ buyer_id: string }>('SELECT buyer_id FROM orders WHERE id=$1', [id]);
    if (buyer.rows[0]) void this.notifications.create(buyer.rows[0].buyer_id, 'ORDER_COMPLETED', 'Đơn hàng đã hoàn tất', 'Đơn hàng của bạn đã hoàn tất. Vui lòng kiểm tra và đánh giá người bán.', 'ORDER', id).catch(() => undefined);
    return { success: true, data: { id, orderStatus: 'COMPLETED', ...completed }, message: null, errorCode: null };
  }
  /** Người mua xác nhận đã nhận hàng cho đơn thanh toán online → giải ngân cho người bán. */
  @Post(':id/confirm-receipt') async confirmReceipt(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    const o = (await this.db.query<{ buyer_id: string; seller_id: string; order_status: string; payment_method: string; payment_status: string }>(`SELECT buyer_id, seller_id, order_status::text, payment_method::text, payment_status::text FROM orders WHERE id=$1`, [id])).rows[0];
    if (!o || o.buyer_id !== request.user.id) throw new ForbiddenException('Không tìm thấy đơn hàng của bạn');
    if (o.payment_method === 'COD' || o.payment_status !== 'PAID') throw new BadRequestException('Chỉ áp dụng cho đơn đã thanh toán online.');
    if (!['SHIPPING', 'DELIVERED'].includes(o.order_status)) throw new BadRequestException('Đơn hàng chưa ở trạng thái giao hàng.');
    if (o.order_status === 'SHIPPING') await this.db.query(`UPDATE orders SET order_status='DELIVERED', updated_at=NOW() WHERE id=$1 AND order_status='SHIPPING'`, [id]);
    const completed = await this.ledger.completeOrder(id, o.seller_id);
    void this.notifications.create(o.seller_id, 'ORDER_COMPLETED', 'Người mua đã nhận hàng', 'Người mua đã xác nhận nhận hàng. Tiền đã được ghi vào ví của bạn.', 'ORDER', id).catch(() => undefined);
    return { success: true, data: { id, orderStatus: 'COMPLETED', ...completed }, message: 'Đã xác nhận nhận hàng. Cảm ơn bạn!', errorCode: null };
  }
}
