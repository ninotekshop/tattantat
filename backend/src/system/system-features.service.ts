import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type SystemFeatures = {
  maintenanceMode: boolean;   // Bảo trì: chặn mọi thao tác ghi của người dùng (xem vẫn được)
  allowRegistration: boolean; // Cho phép đăng ký / đăng nhập mạng xã hội tạo tài khoản mới
  allowListingPublish: boolean; // Cho phép đăng tin mới
  allowOrders: boolean;       // Cho phép đặt mua / thanh toán đảm bảo
  allowTopup: boolean;        // Cho phép tạo mã nạp tiền vào ví
  allowPackagePurchase: boolean; // Cho phép mua gói đăng tin / đẩy tin
  allowChat: boolean;         // Cho phép nhắn tin giữa người mua và người bán
  allowReviews: boolean;      // Cho phép gửi đánh giá
};
export const DEFAULT_SYSTEM_FEATURES: SystemFeatures = {
  maintenanceMode: false, allowRegistration: true, allowListingPublish: true, allowOrders: true,
  allowTopup: true, allowPackagePurchase: true, allowChat: true, allowReviews: true,
};
const KEYS = Object.keys(DEFAULT_SYSTEM_FEATURES) as (keyof SystemFeatures)[];

/** Công tắc bật/tắt các chức năng quan trọng, do Admin cấu hình (lưu ở app_settings.system_features). */
@Injectable()
export class SystemFeaturesService implements OnModuleInit {
  private readonly log = new Logger('SystemFeatures');
  private cache: { at: number; value: SystemFeatures } | null = null;
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    try { await this.db.query(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by UUID)`); } catch { /* bỏ qua */ }
  }

  async features(fresh = false): Promise<SystemFeatures> {
    if (!fresh && this.cache && Date.now() - this.cache.at < 10_000) return this.cache.value;
    let value = { ...DEFAULT_SYSTEM_FEATURES };
    try {
      const row = (await this.db.query(`SELECT value FROM app_settings WHERE key='system_features'`)).rows[0];
      const stored = (row?.value ?? {}) as Partial<SystemFeatures>;
      for (const k of KEYS) if (typeof stored[k] === 'boolean') value[k] = stored[k] as boolean;
    } catch (e) { this.log.warn('Không đọc được cấu hình chức năng: ' + (e instanceof Error ? e.message : String(e))); value = this.cache?.value ?? value; }
    this.cache = { at: Date.now(), value };
    return value;
  }

  async save(actorId: string, input: Partial<SystemFeatures>) {
    const current = await this.features(true);
    const next = { ...current };
    for (const k of KEYS) if (typeof input?.[k] === 'boolean') next[k] = input[k] as boolean;
    await this.db.query(`INSERT INTO app_settings(key,value,updated_by) VALUES('system_features',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by`, [JSON.stringify(next), actorId]);
    this.cache = { at: Date.now(), value: next };
    return { success: true, data: next, message: 'Đã lưu cấu hình chức năng hệ thống.', errorCode: null };
  }
}
