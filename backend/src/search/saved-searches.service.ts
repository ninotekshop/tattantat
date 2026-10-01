import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';
import { sanitizeParams, SearchService } from './search.service';

const ok = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
const MAX_PER_USER = 20;

@Injectable()
export class SavedSearchesService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('SavedSearches');
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService, private readonly search: SearchService, private readonly notifications: NotificationsService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS saved_searches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, name TEXT NOT NULL, params JSONB NOT NULL, notify BOOLEAN NOT NULL DEFAULT true, last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id)`);
    } catch (e) { this.log.error('Không tạo được bảng tìm kiếm đã lưu: ' + (e instanceof Error ? e.message : String(e))); }
    if (process.env.SAVED_SEARCH_JOB === 'false') return;
    const cfg = Number(process.env.SAVED_SEARCH_INTERVAL_MS ?? 900_000);
    const interval = Number.isSafeInteger(cfg) ? Math.max(cfg, 60_000) : 900_000;
    setTimeout(() => void this.runSafely(), 90_000).unref();
    this.timer = setInterval(() => void this.runSafely(), interval); this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async runSafely() { try { await this.run(); } catch (e) { this.log.warn('Lỗi quét tìm kiếm đã lưu: ' + (e instanceof Error ? e.message : String(e))); } }

  async list(uid: string) { return ok((await this.db.query(`SELECT id, name, params, notify, created_at FROM saved_searches WHERE user_id=$1 ORDER BY created_at DESC`, [uid])).rows); }
  async create(uid: string, name: string | undefined, rawParams: Record<string, unknown>) {
    const params = sanitizeParams(rawParams ?? {}); delete (params as Record<string, unknown>).since;
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== false && v !== ''));
    if (!Object.keys(clean).length) throw new BadRequestException('Hãy nhập từ khóa hoặc chọn bộ lọc trước khi lưu tìm kiếm.');
    if ((await this.db.query(`SELECT COUNT(*)::int AS n FROM saved_searches WHERE user_id=$1`, [uid])).rows[0].n >= MAX_PER_USER) throw new BadRequestException(`Bạn chỉ lưu được tối đa ${MAX_PER_USER} tìm kiếm. Hãy xóa bớt.`);
    const label = (name?.trim() || String(clean.q ?? 'Tìm kiếm của tôi')).slice(0, 80);
    const row = (await this.db.query(`INSERT INTO saved_searches(user_id,name,params) VALUES($1,$2,$3::jsonb) RETURNING id, name, params, notify, created_at`, [uid, label, JSON.stringify(clean)])).rows[0];
    return ok(row, 'Đã lưu tìm kiếm. Bạn sẽ được báo khi có tin mới phù hợp.');
  }
  async toggle(uid: string, id: string, notify: boolean) {
    const r = await this.db.query(`UPDATE saved_searches SET notify=$3 WHERE id=$1 AND user_id=$2 RETURNING id, notify`, [id, uid, notify]);
    if (!r.rows[0]) throw new NotFoundException('Không tìm thấy tìm kiếm đã lưu'); return ok(r.rows[0]);
  }
  async remove(uid: string, id: string) { await this.db.query(`DELETE FROM saved_searches WHERE id=$1 AND user_id=$2`, [id, uid]); return ok({ id }, 'Đã xóa.'); }

  /** Báo cho người dùng khi có tin mới khớp tìm kiếm đã lưu (tối đa 1 thông báo / tìm kiếm / lần quét). */
  async run(): Promise<number> {
    const locked = await this.db.transaction(async c => (await c.query(`SELECT pg_try_advisory_xact_lock(hashtext('saved-search-job')) AS ok`)).rows[0].ok as boolean);
    if (!locked) return 0;
    const rows = (await this.db.query(`SELECT id::text, user_id::text, name, params, last_checked_at FROM saved_searches WHERE notify ORDER BY last_checked_at LIMIT 300`)).rows;
    let sent = 0; const startedAt = new Date().toISOString();
    for (const r of rows) {
      try {
        const { n, sample } = await this.search.countSince(sanitizeParams(r.params ?? {}), new Date(r.last_checked_at).toISOString());
        await this.db.query(`UPDATE saved_searches SET last_checked_at=$2 WHERE id=$1`, [r.id, startedAt]);
        if (n > 0) { await this.notifications.create(r.user_id, 'SAVED_SEARCH', `${n} tin mới cho “${r.name}”`, `${sample ?? 'Có tin mới'}${n > 1 ? ` và ${n - 1} tin khác` : ''} vừa được đăng.`, 'SAVED_SEARCH', r.id).catch(() => undefined); sent++; }
      } catch (e) { this.log.warn(`Bỏ qua tìm kiếm ${r.id}: ${e instanceof Error ? e.message : e}`); }
    }
    return sent;
  }
}
