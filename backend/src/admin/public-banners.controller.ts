import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * Endpoint công khai (không cần đăng nhập) để trang chủ lấy các banner đang hoạt động.
 * Dữ liệu do trang quản trị ghi vào bảng `banners` qua /admin/banners.
 */
@Controller('banners')
export class PublicBannersController {
  constructor(private readonly db: DatabaseService) {}

  @Get('active')
  async active() {
    const result = await this.db.query(
      `SELECT id, title, image_url AS "imageUrl", position, target_url AS "targetUrl",
              expiry_date AS "expiryDate", status
       FROM banners
       WHERE status = 'ACTIVE'
         AND (expiry_date IS NULL OR expiry_date = '' OR expiry_date >= to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'))
       ORDER BY sort_order ASC, created_at ASC`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }
}
