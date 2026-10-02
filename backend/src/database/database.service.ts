import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    let connectionString =
      config.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Thiếu DATABASE_URL. Hãy khai báo trong backend/.env.');

    // Sanitize any non-ASCII en-dash or em-dash in hostnames (e.g. Hostinger UI auto-formatting)
    connectionString = connectionString.replace(/[–—]/g, '-');

    console.log(
      `[DatabaseService] Connecting to database host: ${connectionString.split('@')[1] || 'Supabase'}`,
    );

    // Máy chủ DB ở xa (Supabase, Sydney): mỗi lần mở kết nối mới tốn vài lượt TLS, nên giữ kết nối sống lâu thay vì đóng sau 10 giây.
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 300_000,
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
  }

  private keepAliveTimer?: NodeJS.Timeout;

  /** Chỉ mục phục vụ các trang quản trị (danh sách tin đăng / người dùng / đếm bài đăng, đơn hàng). Chạy nền, lỗi thì bỏ qua. */
  private ensurePerformanceIndexes() {
    const statements = [
      `CREATE INDEX IF NOT EXISTS idx_products_created_live ON products (created_at DESC) WHERE deleted_at IS NULL`,
      `CREATE INDEX IF NOT EXISTS idx_products_seller_live ON products (seller_id) WHERE deleted_at IS NULL`,
      `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders (buyer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_product_sort ON product_images (product_id, sort_order)`,
    ];
    void (async () => {
      for (const sql of statements) { try { await this.query(sql); } catch { /* bảng/cột có thể khác nhau giữa các môi trường */ } }
    })();
  }

  async onModuleInit() {
    // Ping định kỳ để kết nối tới DB không bị ngắt khi vắng người dùng (yêu cầu đầu tiên sẽ không phải bắt tay lại).
    this.keepAliveTimer = setInterval(() => { void this.pool.query('SELECT 1').catch(() => undefined); }, 60_000);
    this.keepAliveTimer.unref();
    this.ensurePerformanceIndexes();
    try { await this.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MOD'`); } catch (err: unknown) { console.warn('[DatabaseService] Chưa thêm được vai trò MOD:', err instanceof Error ? err.message : String(err)); }
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS banners (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE DEFAULT gen_random_uuid()::text,
          title VARCHAR(255) NOT NULL,
          image_url TEXT NOT NULL,
          position VARCHAR(100) NOT NULL,
          target_url TEXT NOT NULL DEFAULT '/',
          expiry_date VARCHAR(50) NOT NULL DEFAULT '2026-12-31',
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS code VARCHAR(50) DEFAULT gen_random_uuid()::text;
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_url TEXT DEFAULT '/';
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(50) DEFAULT '2026-12-31';
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
        ALTER TABLE banners ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_id UUID,
          actor_name VARCHAR(150),
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS content_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          reporter_id UUID NOT NULL,
          reported_user_id UUID,
          product_id UUID,
          reason VARCHAR(80) NOT NULL,
          details VARCHAR(1000),
          status VARCHAR(20) DEFAULT 'OPEN',
          reviewed_by UUID,
          reviewed_at TIMESTAMPTZ,
          resolution_note VARCHAR(1000),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS moderation_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_id UUID NOT NULL,
          actor_id UUID NOT NULL,
          old_status VARCHAR(20) NOT NULL,
          new_status VARCHAR(20) NOT NULL,
          note VARCHAR(1000),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('[DatabaseService] Admin tables initialized successfully');
    } catch (err: unknown) {
      console.warn('[DatabaseService] Table init warning:', err instanceof Error ? err.message : String(err));
    }
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  /**
   * Runs all supplied database work in one PostgreSQL transaction. Financial
   * workflows must use this instead of individual pool queries so that an
   * order, ledger, wallet and idempotency record either all commit or all
   * roll back together.
   */
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    await this.pool.end();
  }
}
