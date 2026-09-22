import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminAuditLogService {
  constructor(private readonly db: DatabaseService) {}

  async log(
    actorId: string | null,
    actorName: string | null,
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: any,
  ) {
    try {
      const validActorId =
        actorId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorId)
          ? actorId
          : null;
      await this.db.query(
        `INSERT INTO admin_audit_logs (actor_id, actor_name, action, entity_type, entity_id, metadata)
         VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)`,
        [
          validActorId,
          actorName || 'Super Admin',
          action,
          entityType,
          entityId || null,
          metadata ? JSON.stringify(metadata) : null,
        ],
      );
    } catch (err: unknown) {
      console.warn(
        '[AdminAuditLogService] Failed to record audit log:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async getRecentLogs(limit: number = 20) {
    const result = await this.db.query(
      `SELECT id, actor_id, actor_name, action, entity_type, entity_id, metadata, created_at
       FROM admin_audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.min(Math.max(limit, 1), 100)],
    );
    return result.rows;
  }
}
