import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}

@Controller()
export class ReviewsController {
  constructor(private readonly db: DatabaseService) {}

  @Post('orders/:id/review')
  @UseGuards(JwtAuthGuard)
  async create(@Param('id') orderId: string, @Req() request: { user: { id: string } }, @Body() dto: CreateReviewDto) {
    const review = await this.db.transaction(async (client) => {
      const order = await client.query<{ buyer_id: string; seller_id: string; order_status: string }>(
        `SELECT buyer_id,seller_id,order_status::text FROM orders WHERE id=$1 FOR UPDATE`, [orderId],
      );
      const row = order.rows[0];
      if (!row || row.buyer_id !== request.user.id) throw new BadRequestException('Không tìm thấy đơn hàng của bạn');
      if (row.order_status !== 'COMPLETED') throw new BadRequestException('Chỉ có thể đánh giá sau khi đơn hoàn tất');
      const created = await client.query(
        `INSERT INTO seller_reviews(order_id,buyer_id,seller_id,rating,comment)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT(order_id) DO NOTHING
         RETURNING id,order_id,rating,comment,created_at`,
        [orderId, request.user.id, row.seller_id, dto.rating, dto.comment?.trim() || null],
      );
      if (!created.rows[0]) throw new BadRequestException('Đơn hàng này đã được đánh giá');
      return created.rows[0];
    });
    return { success: true, data: review, message: 'Cảm ơn bạn đã đánh giá', errorCode: null };
  }

  @Get('seller/reviews')
  @UseGuards(JwtAuthGuard)
  async mine(@Req() request: { user: { id: string } }) {
    const reviews = await this.db.query(
      `SELECT r.id,r.order_id,r.rating,r.comment,r.created_at,b.full_name AS buyer_name,
              COALESCE(ROUND(AVG(r.rating) OVER ()::numeric,1),0)::text AS average_rating
       FROM seller_reviews r JOIN users b ON b.id=r.buyer_id
       WHERE r.seller_id=$1 ORDER BY r.created_at DESC`,
      [request.user.id],
    );
    return { success: true, data: reviews.rows, message: null, errorCode: null };
  }
}
