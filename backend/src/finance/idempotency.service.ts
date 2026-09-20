import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PoolClient } from 'pg';

export interface IdempotencyClaim<T> {
  scopedKey: string;
  replay?: T;
}

@Injectable()
export class IdempotencyService {
  async claim<T>(
    client: PoolClient,
    scope: string,
    actorId: string,
    rawKey: string | undefined,
    request: unknown,
  ): Promise<IdempotencyClaim<T>> {
    if (!rawKey || rawKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(rawKey)) {
      throw new BadRequestException('Idempotency-Key hợp lệ là bắt buộc');
    }

    const scopedKey = `${scope}:${actorId}:${rawKey}`;
    const requestHash = createHash('sha256')
      .update(JSON.stringify({ scope, actorId, request }))
      .digest('hex');

    const inserted = await client.query(
      `INSERT INTO idempotency_keys(key, actor_id, request_hash, expires_at)
       VALUES($1, $2, $3, NOW() + INTERVAL '24 hours')
       ON CONFLICT(key) DO NOTHING`,
      [scopedKey, actorId, requestHash],
    );

    if (inserted.rowCount === 1) return { scopedKey };

    const existing = await client.query<{ request_hash: string; response: T | null }>(
      'SELECT request_hash, response FROM idempotency_keys WHERE key=$1 FOR UPDATE',
      [scopedKey],
    );
    const row = existing.rows[0];
    if (!row) throw new ConflictException('Không thể xác nhận Idempotency-Key');
    if (row.request_hash !== requestHash) {
      throw new ConflictException('Idempotency-Key đã được dùng cho nội dung khác');
    }
    if (row.response === null) {
      throw new ConflictException('Yêu cầu cùng Idempotency-Key đang được xử lý');
    }
    return { scopedKey, replay: row.response };
  }

  complete(client: PoolClient, scopedKey: string, response: unknown) {
    return client.query('UPDATE idempotency_keys SET response=$2::jsonb WHERE key=$1', [
      scopedKey,
      JSON.stringify(response),
    ]);
  }
}
