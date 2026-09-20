import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LedgerService } from '../finance/ledger.service';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../account/notifications.service';
@Controller('orders') @UseGuards(JwtAuthGuard) export class OrderFinancialController {
  constructor(private readonly ledger: LedgerService, private readonly db: DatabaseService, private readonly notifications: NotificationsService) {}
  @Post(':id/complete') async complete(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    const completed = await this.ledger.completeOrder(id, request.user.id);
    const buyer = await this.db.query<{ buyer_id: string }>('SELECT buyer_id FROM orders WHERE id=$1', [id]);
    if (buyer.rows[0]) void this.notifications.create(buyer.rows[0].buyer_id, 'ORDER_COMPLETED', 'Đơn hàng đã hoàn tất', 'Đơn hàng của bạn đã hoàn tất. Vui lòng kiểm tra và đánh giá người bán.', 'ORDER', id).catch(() => undefined);
    return { success: true, data: { id, orderStatus: 'COMPLETED', ...completed }, message: null, errorCode: null };
  }
}
