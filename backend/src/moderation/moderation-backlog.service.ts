import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';
import { ModerationPolicyService } from './moderation-policy.service';

/**
 * Nhắc quản trị viên khi có tin chờ duyệt quá lâu. Khóa advisory giúp chỉ một tiến trình
 * xử lý mỗi lượt khi chạy nhiều bản backend; mốc "lần nhắc gần nhất" lưu trong app_settings
 * để không nhắc lặp sau khi khởi động lại.
 */
@Injectable()
export class ModerationBacklogService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('ModerationBacklog');
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService, private readonly policy: ModerationPolicyService, private readonly notifications: NotificationsService) {}

  onModuleInit() {
    if (process.env.MODERATION_REMINDER_ENABLED === 'false') return;
    const configured = Number(process.env.MODERATION_REMINDER_INTERVAL_MS ?? 600_000);
    const interval = Number.isSafeInteger(configured) ? Math.max(configured, 60_000) : 600_000;
    setTimeout(() => void this.runSafely(), 30_000).unref();
    this.timer = setInterval(() => void this.runSafely(), interval);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async runSafely() { try { await this.run(); } catch (error) { this.log.warn('Không chạy được nhắc hàng chờ: ' + (error instanceof Error ? error.message : String(error))); } }

  /** Trả về số quản trị viên đã được nhắc (0 nếu chưa cần). */
  async run(force = false): Promise<number> {
    const s = await this.policy.settings(true);
    if (!s.backlogReminder && !force) return 0;
    const backlog = await this.policy.backlog(s.backlogHours);
    if (!backlog.overdue) return 0;
    const gotLock = await this.db.transaction(async client => {
      if (!(await client.query(`SELECT pg_try_advisory_xact_lock(hashtext('moderation-backlog-reminder')) AS ok`)).rows[0].ok) return false;
      const last = (await client.query(`SELECT value->>'at' AS at FROM app_settings WHERE key='moderation_backlog_last'`)).rows[0]?.at as string | undefined;
      if (!force && last && Date.now() - new Date(last).getTime() < s.backlogRepeatHours * 3_600_000) return false;
      await client.query(`INSERT INTO app_settings(key,value) VALUES('moderation_backlog_last',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, [JSON.stringify({ at: new Date().toISOString(), overdue: backlog.overdue })]);
      return true;
    });
    if (!gotLock) return 0;
    const admins = (await this.db.query(`SELECT id::text FROM users u WHERE u.deleted_at IS NULL AND (u.role IN ('ADMIN'::user_role,'SUPER_ADMIN'::user_role) OR EXISTS(SELECT 1 FROM admin_users a WHERE a.user_id=u.id AND a.status='ACTIVE'))`)).rows;
    const waited = backlog.oldest ? Math.max(1, Math.round((Date.now() - new Date(backlog.oldest).getTime()) / 3_600_000)) : s.backlogHours;
    const title = `Có ${backlog.overdue} tin chờ duyệt quá ${s.backlogHours} giờ`;
    const content = `Hàng chờ có ${backlog.pending} tin, trong đó ${backlog.overdue} tin đã chờ quá ${s.backlogHours} giờ (lâu nhất khoảng ${waited} giờ). Vào mục Kiểm duyệt tin đăng để xử lý.`;
    for (const admin of admins) await this.notifications.create(admin.id, 'ADMIN_MODERATION_BACKLOG', title, content, 'ADMIN', admin.id).catch(() => undefined);
    this.log.log(`Đã nhắc ${admins.length} quản trị viên: ${backlog.overdue} tin chờ quá ${s.backlogHours} giờ.`);
    return admins.length;
  }
}
