import { DatabaseService } from '../database/database.service';

let ready: Promise<void> | null = null;
/** Bổ sung cột ghi lại ai xóa tin, vai trò và lý do (chạy một lần). */
export function ensureDeletionColumns(db: DatabaseService): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_reason TEXT`);
      await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_by UUID`);
      await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_by_role TEXT`);
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}
