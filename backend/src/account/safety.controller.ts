import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

class ReportDto {
  @IsOptional() @IsString() reportedUserId?: string;
  @IsOptional() @IsString() productId?: string;
  @IsIn(['SPAM', 'FRAUD', 'PROHIBITED', 'ABUSE', 'OTHER']) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly db: DatabaseService) {}

  @Get('me/blocks')
  async blocks(@Req() request: { user: { id: string } }) {
    const result = await this.db.query(
      `SELECT u.id,u.full_name,u.avatar_url,b.created_at
       FROM user_blocks b JOIN users u ON u.id=b.blocked_id
       WHERE b.blocker_id=$1 ORDER BY b.created_at DESC`,
      [request.user.id],
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Post('reports')
  async report(@Req() request: { user: { id: string } }, @Body() body: ReportDto) {
    if (!body.reportedUserId && !body.productId) throw new BadRequestException('Cần chọn nội dung báo cáo');
    const report = await this.db.transaction(async (client) => {
      let targetUserId = body.reportedUserId;
      if (body.productId) {
        const product = await client.query<{ seller_id: string }>('SELECT seller_id FROM products WHERE id=$1 AND deleted_at IS NULL', [body.productId]);
        if (!product.rows[0]) throw new BadRequestException('Tin đăng không tồn tại');
        if (targetUserId && targetUserId !== product.rows[0].seller_id) throw new BadRequestException('Người bị báo cáo không khớp với tin đăng');
        targetUserId = product.rows[0].seller_id;
      }
      if (!targetUserId || targetUserId === request.user.id) throw new BadRequestException('Không thể báo cáo chính mình');
      const target = await client.query('SELECT id FROM users WHERE id=$1', [targetUserId]);
      if (!target.rows[0]) throw new BadRequestException('Người dùng không tồn tại');
      const created = await client.query(
        `INSERT INTO content_reports(reporter_id,reported_user_id,product_id,reason,details)
         VALUES($1,$2,$3,$4,$5) RETURNING id,status`,
        [request.user.id, targetUserId, body.productId ?? null, body.reason, body.details?.trim() || null],
      );
      return created.rows[0];
    });
    return { success: true, data: report, message: 'Đã gửi báo cáo', errorCode: null };
  }

  @Post('users/:id/block')
  async block(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    if (id === request.user.id) throw new BadRequestException('Không thể chặn chính mình');
    await this.db.transaction(async (client) => {
      const target = await client.query('SELECT id FROM users WHERE id=$1', [id]);
      if (!target.rows[0]) throw new BadRequestException('Người dùng không tồn tại');
      await client.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [request.user.id, id]);
    });
    return { success: true, data: { blockedUserId: id }, message: null, errorCode: null };
  }

  @Delete('users/:id/block')
  async unblock(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    await this.db.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2', [request.user.id, id]);
    return { success: true, data: null, message: null, errorCode: null };
  }
}
