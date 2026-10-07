import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';

/** Chuyển ảnh đại diện cũ (data URL trong DB) sang Supabase Storage, từng lô nhỏ, chạy nền sau khi khởi động. */
@Injectable()
export class AvatarMigrationService implements OnApplicationBootstrap {
  private readonly log = new Logger('AvatarMigration');
  constructor(private readonly db: DatabaseService, private readonly storage: StorageService) {}
  onApplicationBootstrap() { setTimeout(() => { void this.run().catch(e => this.log.warn(String(e))); }, 20_000); }
  async run() {
    for (let round = 0; round < 200; round++) {
      const { rows } = await this.db.query<{ id: string; avatar_url: string }>(`SELECT id, avatar_url FROM users WHERE avatar_url LIKE 'data:image/%' ORDER BY id LIMIT 10`);
      if (!rows.length) return;
      let moved = 0;
      for (const u of rows) {
        const url = await this.storage.uploadAvatar(u.id, u.avatar_url);
        if (!url) continue;
        await this.db.query(`UPDATE users SET avatar_url=$1 WHERE id=$2 AND avatar_url=$3`, [url, u.id, u.avatar_url]); moved++;
      }
      if (!moved) { this.log.warn('Không chuyển được ảnh đại diện nào (thiếu sharp hoặc Storage lỗi); dừng.'); return; }
    }
  }
}
