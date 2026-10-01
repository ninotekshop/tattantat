import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
class ReplyDto { @IsString() @MaxLength(1000) reply!: string; }
class ReportDto { @IsString() @MaxLength(30) reason!: string; @IsOptional() @IsString() @MaxLength(500) note?: string; }
type Req_ = { user: { id: string } };
const ok = (data: unknown, message: string | null = null) => ({ success: true, data, message, errorCode: null });

@Controller()
export class ReviewsController {
  constructor(private readonly db: DatabaseService, private readonly reviews: ReviewsService) {}

  /** Người mua đánh giá người bán. */
  @Post('orders/:id/review') @UseGuards(JwtAuthGuard)
  async create(@Param('id') id: string, @Req() r: Req_, @Body() dto: CreateReviewDto) { return ok(await this.reviews.create(r.user.id, id, 'buyer', dto), 'Cảm ơn bạn đã đánh giá'); }

  /** Người bán đánh giá người mua. */
  @Post('orders/:id/buyer-review') @UseGuards(JwtAuthGuard)
  async createBuyer(@Param('id') id: string, @Req() r: Req_, @Body() dto: CreateReviewDto) { return ok(await this.reviews.create(r.user.id, id, 'seller', dto), 'Đã gửi đánh giá người mua'); }

  @Get('orders/:id/reviews') @UseGuards(JwtAuthGuard)
  async forOrder(@Param('id') id: string, @Req() r: Req_) { return ok(await this.reviews.forOrder(r.user.id, id)); }

  @Post('reviews/:kind/:id/reply') @UseGuards(JwtAuthGuard)
  async reply(@Param('kind') kind: string, @Param('id') id: string, @Req() r: Req_, @Body() dto: ReplyDto) { return ok(await this.reviews.reply(r.user.id, kind, id, dto.reply), 'Đã gửi phản hồi'); }

  @Post('reviews/:kind/:id/report') @UseGuards(JwtAuthGuard)
  async report(@Param('kind') kind: string, @Param('id') id: string, @Req() r: Req_, @Body() dto: ReportDto) { return ok(await this.reviews.report(r.user.id, kind, id, dto), 'Đã gửi báo cáo, quản trị viên sẽ xem xét'); }

  /** Hồ sơ đánh giá công khai (không cần đăng nhập). */
  @Get('users/:id/reviews')
  async profile(@Param('id') id: string, @Query('role') role?: string, @Query('page') page?: string) { return ok(await this.reviews.profile(id, role ?? 'seller', Number(page) || 1)); }

  @Get('reviews/seller-summaries')
  async summaries(@Query('ids') ids?: string) { return ok(await this.reviews.sellerSummaries(String(ids ?? '').split(',').filter(Boolean))); }

  @Get('seller/reviews') @UseGuards(JwtAuthGuard)
  async mine(@Req() request: Req_) {
    const reviews = await this.db.query(
      `SELECT r.id,r.order_id,r.rating,r.comment,r.reply,r.created_at,b.full_name AS buyer_name,
              COALESCE(ROUND(AVG(r.rating) OVER ()::numeric,1),0)::text AS average_rating
       FROM seller_reviews r JOIN users b ON b.id=r.buyer_id
       WHERE r.seller_id=$1 AND r.status='VISIBLE' ORDER BY r.created_at DESC`,
      [request.user.id],
    );
    return { success: true, data: reviews.rows, message: null, errorCode: null };
  }
}

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}
  @Get() async list(@Query() q: { status?: string; kind?: string; page?: string }) { return ok(await this.reviews.adminList(q)); }
  @Post(':kind/:id/hide') async hide(@Req() r: Req_, @Param('kind') kind: string, @Param('id') id: string) { return ok(await this.reviews.adminSetStatus(r.user.id, kind, id, 'HIDDEN'), 'Đã ẩn đánh giá.'); }
  @Post(':kind/:id/show') async show(@Req() r: Req_, @Param('kind') kind: string, @Param('id') id: string) { return ok(await this.reviews.adminSetStatus(r.user.id, kind, id, 'VISIBLE'), 'Đã hiện lại đánh giá.'); }
}
