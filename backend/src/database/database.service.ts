import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

const DEFAULT_DATABASE_URL =
  'postgresql://postgres.brabreqaarmuowymfnkl:Zf3Vqufu5lHZycg0@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    let connectionString =
      config.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL ||
      DEFAULT_DATABASE_URL;

    // Sanitize any non-ASCII en-dash or em-dash in hostnames (e.g. Hostinger UI auto-formatting)
    connectionString = connectionString.replace(/[–—]/g, '-');

    if (
      !connectionString ||
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1')
    ) {
      connectionString = DEFAULT_DATABASE_URL;
    }

    console.log(
      `[DatabaseService] Connecting to database host: ${connectionString.split('@')[1] || 'Supabase'}`,
    );

    this.pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }

  async onModuleInit() {
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
    await this.pool.end();
  }
}
