import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

const DEFAULT_DATABASE_URL =
  'postgresql://postgres.brabreqaarmuowymfnkl:Zf3Vqufu5lHZycg0@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    let connectionString =
      config.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL ||
      DEFAULT_DATABASE_URL;

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
