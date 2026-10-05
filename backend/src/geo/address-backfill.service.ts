import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { convertAddress } from './vn-merge';

/** Khi máy chủ khởi động: cập nhật địa chỉ các tin đã đăng sang dạng "tên cũ (tên mới mới)". Chạy nền, an toàn khi chạy lại (tin đã chuyển sẽ bỏ qua). */
@Injectable()
export class AddressBackfillService implements OnModuleInit {
  private readonly log = new Logger('AddressBackfill');
  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    if (process.env.ADDRESS_BACKFILL === 'off') return;
    setTimeout(() => this.run().catch(e => this.log.warn(`Bỏ qua: ${(e as Error).message}`)), 15_000);
  }

  async run() {
    const rows = (await this.db.query<{ id: string; address: string }>(`SELECT id, address FROM products WHERE address IS NOT NULL AND address NOT LIKE '%mới)%'`)).rows;
    let changed = 0;
    for (const r of rows) {
      const next = convertAddress(r.address);
      if (next) { await this.db.query('UPDATE products SET address = $2 WHERE id = $1', [r.id, next]); changed++; }
    }
    if (changed) this.log.log(`Đã cập nhật địa chỉ mới cho ${changed}/${rows.length} tin.`);
  }
}
