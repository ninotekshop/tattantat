import { BadRequestException, Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { CATEGORIES, mergePrefs, sanitizePrefs } from './notification-channels';
import { MailerService } from './mailer.service';

const ok = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
@Controller('me/notification-prefs')
@UseGuards(JwtAuthGuard)
export class NotificationPrefsController {
  constructor(private readonly db: DatabaseService, private readonly mailer: MailerService) {}
  @Get() async get(@Req() r: { user: { id: string } }) {
    const row = (await this.db.query(`SELECT prefs FROM notification_prefs WHERE user_id=$1`, [r.user.id])).rows[0];
    return ok({ prefs: mergePrefs(row?.prefs), categories: CATEGORIES, emailAvailable: this.mailer.enabled });
  }
  @Put() async put(@Req() r: { user: { id: string } }, @Body() body: { prefs?: unknown }) {
    let prefs; try { prefs = sanitizePrefs(body?.prefs); } catch { throw new BadRequestException('Cài đặt không hợp lệ'); }
    await this.db.query(`INSERT INTO notification_prefs(user_id,prefs) VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET prefs=EXCLUDED.prefs, updated_at=now()`, [r.user.id, JSON.stringify(prefs)]);
    return ok({ prefs }, 'Đã lưu cài đặt thông báo.');
  }
}
