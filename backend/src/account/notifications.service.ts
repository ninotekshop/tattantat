import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { existsSync, readFileSync } from 'fs';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, type: string, title: string, content: string, referenceType?: string, referenceId?: string): Promise<void> {
    await this.db.query(
      `INSERT INTO notifications(user_id,type,title,content,reference_type,reference_id)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [userId, type, title, content, referenceType ?? null, referenceId ?? null],
    );
    void this.sendPush(userId, title, content, referenceType, referenceId).catch(() => undefined);
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
