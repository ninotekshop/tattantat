import { ConflictException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

export interface LedgerLine {
  accountCode: string;
  amount: bigint;
  userId?: string | null;
  orderId?: string | null;
}

@Injectable()
export class LedgerWriterService {
  async createPendingPayout(
    client: PoolClient,
    payoutId: string,
    idempotencyKey: string,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO ledger_transactions(type, reference_id, idempotency_key, status)
       VALUES('PAYOUT', $1, $2, 'PENDING') RETURNING id`,
      [payoutId, idempotencyKey],
    );
    return result.rows[0].id;
  }

  async finalize(
    client: PoolClient,
    transactionId: string,
    lines: LedgerLine[],
  ): Promise<void> {
    if (lines.length < 2 || lines.some((line) => line.amount === 0n)) {
      throw new Error('A finalized ledger transaction needs non-zero balancing entries');
    }
    const total = lines.reduce((sum, line) => sum + line.amount, 0n);
    if (total !== 0n) {
      throw new Error(`Ledger transaction ${transactionId} is not balanced`);
    }

    const transaction = await client.query<{ status: string }>(
      'SELECT status FROM ledger_transactions WHERE id=$1 FOR UPDATE',
      [transactionId],
    );
    const status = transaction.rows[0]?.status;
    if (status === 'FINALIZED') return;
    if (status !== 'PENDING') {
      throw new ConflictException('Ledger transaction không ở trạng thái có thể chốt');
    }

    for (const line of lines) {
      await client.query(
        `INSERT INTO ledger_entries(transaction_id, account_code, amount, user_id, order_id)
         VALUES($1, $2, $3, $4, $5)`,
        [transactionId, line.accountCode, line.amount.toString(), line.userId ?? null, line.orderId ?? null],
      );
    }
    await client.query(
      `UPDATE ledger_transactions SET status='FINALIZED', finalized_at=NOW() WHERE id=$1`,
      [transactionId],
    );
  }

  async reversePending(client: PoolClient, transactionId: string): Promise<void> {
    const result = await client.query(
      `UPDATE ledger_transactions SET status='REVERSED'
       WHERE id=$1 AND status='PENDING'`,
      [transactionId],
    );
    if (result.rowCount !== 1) {
      throw new ConflictException('Không thể đảo trạng thái payout ledger');
    }
  }
}
