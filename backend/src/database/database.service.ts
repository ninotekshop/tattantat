import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
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
