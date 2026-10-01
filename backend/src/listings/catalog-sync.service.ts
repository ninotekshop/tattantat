import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseService } from '../database/database.service';
import { syncCatalog } from './catalog-sync';

/**
 * Đồng bộ danh mục & biểu mẫu đăng tin theo listing-catalog.ts khi backend khởi động (chạy nền, không chặn server).
 * Mặc định BẬT ở môi trường phát triển, TẮT ở production; đặt CATALOG_SYNC=on / off để ép bật / tắt.
 * Tin đã đăng và bản nháp không bị ảnh hưởng vì luôn lưu bản chụp biểu mẫu (template_snapshot) riêng.
 */
@Injectable()
export class CatalogSyncService implements OnModuleInit {
  private readonly log = new Logger('CatalogSync');
  constructor(private readonly db: DatabaseService) {}

  /** Ghi thêm vào backend/catalog-sync.log để kiểm tra kết quả đồng bộ mà không cần mở cửa sổ console. */
  private note(message: string) {
    this.log.log(message);
    try { appendFileSync(join(process.cwd(), 'catalog-sync.log'), `${new Date().toISOString()} ${message}\n`); } catch { /* không quan trọng */ }
  }

  onModuleInit() {
    const flag = process.env.CATALOG_SYNC;
    const enabled = flag === 'on' || (flag !== 'off' && process.env.NODE_ENV !== 'production');
    if (!enabled) { this.note(`Bỏ qua đồng bộ danh mục (NODE_ENV=${process.env.NODE_ENV}, CATALOG_SYNC=${flag ?? 'chưa đặt'}).`); return; }
    this.note('Bắt đầu đồng bộ danh mục...');
    void this.run();
  }

  async run(force = false) {
    try {
      const report = await this.db.transaction(client => syncCatalog(client, { force }));
      if (report.skipped) this.note(`Danh mục đã ở phiên bản mới nhất (${report.hash}).`);
      else this.note(`Đã đồng bộ danh mục ${report.hash}: tạo ${report.categoriesCreated.length} chuyên mục, ${report.templatesCreated} biểu mẫu mới, cập nhật ${report.templatesUpdated} biểu mẫu.`);
      for (const warning of report.warnings) this.note('Cảnh báo: ' + warning);
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error('Không đồng bộ được danh mục: ' + message);
      this.note('LỖI: Không đồng bộ được danh mục: ' + message);
    }
  }
}
