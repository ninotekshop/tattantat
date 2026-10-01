import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { allowed, categoryOf, mergePrefs } from './notification-channels';
import { MailerService } from './mailer.service';
import { DatabaseService } from '../database/database.service';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { existsSync, readFileSync } from 'fs';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly log = new Logger('Notifications');
  constructor(private readonly db: DatabaseService, @Optional() private readonly mailer?: MailerService) {}

  async onModuleInit() {
    try { await this.db.query(`CREATE TABLE IF NOT EXISTS notification_prefs (user_id UUID PRIMARY KEY, prefs JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`); }
    catch (e) { this.log.error('Không tạo được bảng notification_prefs: ' + (e instanceof Error ? e.message : String(e))); }
  }

  private async deliver(userId: string, type: string, title: string, content: string, referenceType?: string, referenceId?: string) {
    const category = categoryOf(type);
    const row = (await this.db.query<{ email: string | null; prefs: unknown }>(`SELECT u.email, np.prefs FROM users u LEFT JOIN notification_prefs np ON np.user_id=u.id WHERE u.id=$1`, [userId]).catch(() => ({ rows: [] as { email: string | null; prefs: unknown }[] }))).rows[0];
    const prefs = mergePrefs(row?.prefs);
    if (category === null || allowed(prefs, 'push', category)) await this.sendPush(userId, title, content, referenceType, referenceId).catch(() => undefined);
    if (this.mailer?.enabled && row?.email && allowed(prefs, 'email', category)) {
      const link = referenceType === 'ORDER' ? '/orders' : referenceType === 'PRODUCT' && referenceId ? `/products/${referenceId}` : referenceType === 'CHAT' && referenceId ? `/messages?chat=${referenceId}` : referenceType === 'SAVED_SEARCH' ? '/account?section=searches' : null;
      await this.mailer.send(userId, row.email, title, content, link);
    }
  }

  async create(userId: string, type: string, title: string, content: string, referenceType?: string, referenceId?: string): Promise<void> {
    await this.db.query(
      `INSERT INTO notifications(user_id,type,title,content,reference_type,reference_id)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [userId, type, title, content, referenceType ?? null, referenceId ?? null],
    );
    void this.deliver(userId, type, title, content, referenceType, referenceId).catch(() => undefined);
  }

  private async sendPush(userId: string, title: string, body: string, referenceType?: string, referenceId?: string) {
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? `${process.cwd()}/firebase-service-account.json`;
    if (!existsSync(keyPath)) return;
    if (!getApps().length) initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
    const devices = await this.db.query<{ token: string }>('SELECT token FROM push_devices WHERE user_id=$1 AND active=TRUE', [userId]);
    if (!devices.rows.length) return;
    const result = await getMessaging().sendEachForMulticast({ tokens: devices.rows.map((d) => d.token), notification: { title, body }, data: { referenceType: referenceType ?? '', referenceId: referenceId ?? '' }, android: { priority: 'high' } });
    const invalid = result.responses.flatMap((response, index) => !response.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(response.error?.code ?? '') ? [devices.rows[index].token] : []);
    if (invalid.length) await this.db.query('UPDATE push_devices SET active=FALSE,updated_at=NOW() WHERE token=ANY($1::text[])', [invalid]);
  }
}
