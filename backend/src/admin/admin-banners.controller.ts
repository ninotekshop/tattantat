import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';

class CreateBannerDto {
  @IsString() @MaxLength(255) title!: string;
  @IsString() position!: string;
  @IsString() imageUrl!: string;
  @IsString() targetUrl!: string;
  @IsString() expiryDate!: string;
  @IsIn(['ACTIVE', 'INACTIVE']) status!: 'ACTIVE' | 'INACTIVE';
}

class UpdateBannerDto {
  @IsOptional() @IsString() @MaxLength(255) title?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() targetUrl?: string;
  @IsOptional() @IsString() expiryDate?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'EXPIRED']) status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

@Controller('admin/banners')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminBannersController {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditLogService,
  ) {}

  @Get()
  async list() {
    const result = await this.db.query(
      `SELECT id, code, title, image_url AS "imageUrl", position, target_url AS "targetUrl",
              expiry_date AS "expiryDate", status, created_at AS "createdAt"
       FROM banners
       ORDER BY created_at DESC`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Post()
  async create(@Req() request: { user: { id: string } }, @Body() body: CreateBannerDto) {
    const result = await this.db.query(
      `INSERT INTO banners (title, image_url, position, target_url, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, title, image_url AS "imageUrl", position, target_url AS "targetUrl",
                 expiry_date AS "expiryDate", status, created_at AS "createdAt"`,
      [body.title.trim(), body.imageUrl.trim(), body.position, body.targetUrl.trim(), body.expiryDate, body.status],
    );
    const created = result.rows[0];
    await this.audit.log(request.user.id, 'Super Admin', 'CREATE_BANNER', 'Banner', created.id, { title: body.title });
    return { success: true, data: created, message: 'Đã tạo Banner thành công', errorCode: null };
  }

  @Patch(':id')
  async update(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateBannerDto) {
    const existing = await this.db.query('SELECT * FROM banners WHERE id=$1 OR code=$1', [id]);
    if (!existing.rows[0]) throw new BadRequestException('Không tìm thấy Banner');
    const current = existing.rows[0];

    const result = await this.db.query(
      `UPDATE banners
       SET title = COALESCE($2, title),
           image_url = COALESCE($3, image_url),
           position = COALESCE($4, position),
           target_url = COALESCE($5, target_url),
           expiry_date = COALESCE($6, expiry_date),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $1 OR code = $1
       RETURNING id, code, title, image_url AS "imageUrl", position, target_url AS "targetUrl",
                 expiry_date AS "expiryDate", status, created_at AS "createdAt"`,
      [id, body.title?.trim() || null, body.imageUrl?.trim() || null, body.position || null, body.targetUrl?.trim() || null, body.expiryDate || null, body.status || null],
    );
    const updated = result.rows[0];
    await this.audit.log(request.user.id, 'Super Admin', 'UPDATE_BANNER', 'Banner', updated.id, { old: current.title, new: updated.title });
    return { success: true, data: updated, message: 'Đã cập nhật Banner thành công', errorCode: null };
  }

  @Delete(':id')
  async delete(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const existing = await this.db.query('SELECT * FROM banners WHERE id=$1 OR code=$1', [id]);
    if (!existing.rows[0]) throw new BadRequestException('Không tìm thấy Banner');
    await this.db.query('DELETE FROM banners WHERE id=$1 OR code=$1', [id]);
    await this.audit.log(request.user.id, 'Super Admin', 'DELETE_BANNER', 'Banner', id, { title: existing.rows[0].title });
    return { success: true, data: { id }, message: 'Đã xóa Banner thành công', errorCode: null };
  }
}
