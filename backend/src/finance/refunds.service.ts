import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { FinanceAuthorizationService } from './finance-authorization.service';
import { decimalToVnd, money, parseOptionalVnd, proportionalRound } from './finance-money';
import { IdempotencyService } from './idempotency.service';
import { LedgerLine, LedgerWriterService } from './ledger-writer.service';
import { RefundOrderDto } from './dto/finance.dto';

interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: string;
  seller_payout_amount: string;
  payment_method: string | null;
  payment_status: string;
  order_status: string;
}

interface OriginalLedgerEntryRow {
  account_code: string;
  amount: string;
  user_id: string | null;
  order_id: string | null;
}

interface WalletRow {
  pending_balance: string;
  available_balance: string;
  held_balance: string;
}

interface RefundRow {
  id: string;
  order_id: string;
  payment_id: string | null;
  requested_by: string;
  processed_by: string | null;
  type: string;
  amount: string;
  currency: string;
  reason: string | null;
  status: string;
  original_ledger_transaction_id: string | null;
  reversing_ledger_transaction_id: string | null;
  requested_at: Date;
  processed_at: Date | null;
}

@Injectable()
export class RefundsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly idempotency: IdempotencyService,
    private readonly authorization: FinanceAuthorizationService,
    private readonly ledger: LedgerWriterService,
  ) {}

  async list(actorId: string, orderId: string) {
    return this.db.transaction(async (client) => {
      const order = await this.lockOrder(client, orderId);
      const isAdmin = await this.authorization.isFinanceAdmin(client, actorId);
      if (!isAdmin && actorId !== order.buyer_id && actorId !== order.seller_id) {
        throw new ForbiddenException('Bạn không có quyền xem hoàn tiền của đơn này');
      }
      const refunds = await client.query<RefundRow>(
        `SELECT id, order_id, payment_id, requested_by, processed_by, type::text, amount::text,
                currency, reason, status::text, original_ledger_transaction_id,
                reversing_ledger_transaction_id, requested_at, processed_at
         FROM refunds WHERE order_id=$1 ORDER BY requested_at DESC`,
        [orderId],
      );
      return refunds.rows.map((refund) => this.publicRefund(refund));
    });
  }

  async refund(
    actorId: string,
    orderId: string,
    dto: RefundOrderDto,
    rawIdempotencyKey: string | undefined,
  ) {
    const requestedAmount = parseOptionalVnd(dto.amount, 'amount');
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown }>(
        client,
        'order-refund',
        actorId,
        rawIdempotencyKey,
        { orderId, amount: dto.amount ?? null, reason: dto.reason ?? null },
      );
      if (claim.replay) return claim.replay;

      const order = await this.lockOrder(client, orderId);
      const isAdmin = await this.authorization.isFinanceAdmin(client, actorId);
      if (!isAdmin && actorId !== order.seller_id) {
        throw new ForbiddenException('Chỉ người bán hoặc quản trị viên tài chính có thể xử lý hoàn tiền');
      }
      this.assertRefundableOrder(order);

      const originalLedger = await client.query<{ id: string }>(
        `SELECT id FROM ledger_transactions
         WHERE order_id=$1 AND type='ORDER_PAYMENT' AND status='FINALIZED'
         ORDER BY finalized_at DESC NULLS LAST, created_at DESC LIMIT 1 FOR UPDATE`,
        [orderId],
      );
      const originalLedgerId = originalLedger.rows[0]?.id;
      if (!originalLedgerId) {
        throw new ConflictException('Đơn chưa có bút toán thanh toán đã chốt để hoàn tiền');
      }
      const originalEntries = await client.query<OriginalLedgerEntryRow>(
        `SELECT account_code, amount::text, user_id, order_id
         FROM ledger_entries WHERE transaction_id=$1 ORDER BY id FOR UPDATE`,
        [originalLedgerId],
      );
      if (originalEntries.rows.length < 2) {
        throw new ConflictException('Bút toán thanh toán gốc không đủ để đối soát');
      }
      const sourceBalance = originalEntries.rows.reduce((total, line) => total + BigInt(line.amount), 0n);
      if (sourceBalance !== 0n) {
        throw new ConflictException('RECONCILIATION_ERROR: bút toán thanh toán gốc không cân bằng');
      }

      const orderTotal = decimalToVnd(order.total_amount, 'Giá trị đơn hàng');
      if (orderTotal <= 0n) throw new ConflictException('Đơn không có giá trị hoàn tiền');
      const previous = await client.query<{ refunded: string }>(
        `SELECT COALESCE(SUM(amount),0)::text AS refunded FROM refunds
         WHERE order_id=$1 AND status='COMPLETED'`,
        [orderId],
      );
      const previouslyRefunded = BigInt(previous.rows[0]?.refunded ?? '0');
      const remaining = orderTotal - previouslyRefunded;
      if (remaining <= 0n) throw new ConflictException('Đơn đã được hoàn toàn bộ');

      const amount = requestedAmount ?? remaining;
      if (amount > remaining) {
        throw new BadRequestException('Số tiền hoàn vượt quá giá trị còn có thể hoàn');
      }
      const cumulative = previouslyRefunded + amount;
      const type = previouslyRefunded === 0n && amount === orderTotal ? 'FULL_REFUND' : 'PARTIAL_REFUND';
      const payment = await client.query<{ id: string }>(
        `SELECT id FROM payments
         WHERE order_id=$1 AND status IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')
         ORDER BY paid_at DESC NULLS LAST, created_at DESC LIMIT 1`,
        [orderId],
      );

      const refund = await client.query<RefundRow>(
        `INSERT INTO refunds(
           order_id, payment_id, requested_by, processed_by, type, amount, reason,
           status, idempotency_key, original_ledger_transaction_id
         ) VALUES($1,$2,$3,$3,$4,$5,$6,'PROCESSING',$7,$8)
         RETURNING id, order_id, payment_id, requested_by, processed_by, type::text, amount::text,
                   currency, reason, status::text, original_ledger_transaction_id,
                   reversing_ledger_transaction_id, requested_at, processed_at`,
        [
          orderId,
          payment.rows[0]?.id ?? null,
          actorId,
          type,
          amount.toString(),
          dto.reason ?? null,
          claim.scopedKey,
          originalLedgerId,
        ],
      );
      const created = refund.rows[0];
      await this.recordRefundEvent(client, created.id, actorId, null, 'PROCESSING', dto.reason ?? null);

      const reversalLines = this.reversalLines(
        originalEntries.rows,
        previouslyRefunded,
        cumulative,
        orderTotal,
      );
      const ledgerTransaction = await client.query<{ id: string }>(
        `INSERT INTO ledger_transactions(type, order_id, payment_id, reference_id, idempotency_key, status)
         VALUES('REFUND',$1,$2,$3,$4,'PENDING') RETURNING id`,
        [orderId, payment.rows[0]?.id ?? null, created.id, claim.scopedKey],
      );
      const reversingLedgerId = ledgerTransaction.rows[0].id;
      await this.ledger.finalize(client, reversingLedgerId, reversalLines);

      const sellerRefund = this.sellerPayoutRefund(
        originalEntries.rows,
        BigInt(order.seller_payout_amount),
        previouslyRefunded,
        cumulative,
        orderTotal,
      );
      await this.reverseSellerWallet(client, order, sellerRefund, reversingLedgerId);

      const paymentStatus = cumulative === orderTotal ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      await client.query(
        `UPDATE orders SET payment_status=$2::payment_status, updated_at=NOW() WHERE id=$1`,
        [orderId, paymentStatus],
      );
      const completed = await client.query<RefundRow>(
        `UPDATE refunds
         SET status='COMPLETED', reversing_ledger_transaction_id=$2, processed_at=NOW(), updated_at=NOW()
         WHERE id=$1
         RETURNING id, order_id, payment_id, requested_by, processed_by, type::text, amount::text,
                   currency, reason, status::text, original_ledger_transaction_id,
                   reversing_ledger_transaction_id, requested_at, processed_at`,
        [created.id, reversingLedgerId],
      );
      await this.recordRefundEvent(client, created.id, actorId, 'PROCESSING', 'COMPLETED', dto.reason ?? null, {
        refundedBefore: money(previouslyRefunded),
        refundedAfter: money(cumulative),
      });
      await client.query(
        `INSERT INTO financial_audit_logs(actor_id, action, entity_type, entity_id, new_value, reason)
         VALUES($1,'ORDER_REFUND_COMPLETED','REFUND',$2,$3::jsonb,$4)`,
        [actorId, created.id, JSON.stringify({ orderId, amount: money(amount), reversingLedgerId }), dto.reason ?? null],
      );

      const response = {
        success: true,
        data: this.publicRefund(completed.rows[0]),
        message: 'Đã tạo bút toán đảo cho hoàn tiền',
        errorCode: null,
      };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  private assertRefundableOrder(order: OrderRow): void {
    if (order.order_status !== 'COMPLETED') {
      throw new ConflictException('Chỉ hoàn tiền cho đơn đã hoàn tất');
    }
    const paid = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(order.payment_status);
    if (order.payment_method !== 'COD' && !paid) {
      throw new ConflictException('Thanh toán của đơn chưa được xác nhận');
    }
  }

  /**
   * Calculates an incremental reversal from cumulative proportional allocation.
   * This makes several partial refunds add up exactly to the original entries
   * when the order is ultimately fully refunded, while every individual ledger
   * transaction still balances to zero.
   */
  private reversalLines(
    entries: OriginalLedgerEntryRow[],
    refundedBefore: bigint,
    refundedAfter: bigint,
    orderTotal: bigint,
  ): LedgerLine[] {
    const balanceIndex = this.selectBalancingEntry(entries);
    const lines: LedgerLine[] = [];
    let sum = 0n;
    for (const [index, entry] of entries.entries()) {
      if (index === balanceIndex) continue;
      const originalAmount = BigInt(entry.amount);
      const before = proportionalRound(originalAmount, refundedBefore, orderTotal);
      const after = proportionalRound(originalAmount, refundedAfter, orderTotal);
      const amount = -(after - before);
      if (amount !== 0n) {
        lines.push({
          accountCode: entry.account_code,
          amount,
          userId: entry.user_id,
          orderId: entry.order_id,
        });
        sum += amount;
      }
    }
    const last = entries[balanceIndex];
    const balancingAmount = -sum;
    if (balancingAmount !== 0n) {
      lines.push({
        accountCode: last.account_code,
        amount: balancingAmount,
        userId: last.user_id,
        orderId: last.order_id,
      });
    }
    if (lines.length < 2 || lines.reduce((total, line) => total + line.amount, 0n) !== 0n) {
      throw new ConflictException('Không thể tạo bút toán hoàn tiền cân bằng');
    }
    return lines;
  }

  /** Keep buyer cash and seller payable proportional whenever possible. A fee
   * account absorbs the one-VND rounding residual, so wallet and ledger stay
   * in sync across a series of partial refunds. */
  private selectBalancingEntry(entries: OriginalLedgerEntryRow[]): number {
    const preferred = ['PLATFORM_REVENUE', 'PAYMENT_PROCESSING_FEE', 'SHIPPING_MARGIN', 'PLATFORM_FEE'];
    for (const code of preferred) {
      const index = entries.findIndex((entry) => entry.account_code === code);
      if (index >= 0) return index;
    }
    const nonCashOrSeller = entries.findIndex(
      (entry) => !['CASH_CLEARING', 'PLATFORM_CASH', 'SELLER_PAYABLE'].includes(entry.account_code),
    );
    if (nonCashOrSeller >= 0) return nonCashOrSeller;
    return entries.length - 1;
  }

  private sellerPayoutRefund(
    entries: OriginalLedgerEntryRow[],
    orderSnapshotPayout: bigint,
    refundedBefore: bigint,
    refundedAfter: bigint,
    orderTotal: bigint,
  ): bigint {
    const sellerPayable = entries.find((entry) => entry.account_code === 'SELLER_PAYABLE');
    const originalPayout = sellerPayable ? (BigInt(sellerPayable.amount) < 0n ? -BigInt(sellerPayable.amount) : BigInt(sellerPayable.amount)) : orderSnapshotPayout;
    if (originalPayout === 0n) return 0n;
    return proportionalRound(originalPayout, refundedAfter, orderTotal)
      - proportionalRound(originalPayout, refundedBefore, orderTotal);
  }

  private async reverseSellerWallet(
    client: PoolClient,
    order: OrderRow,
    amount: bigint,
    ledgerTransactionId: string,
  ) {
    if (amount === 0n) return;
    const wallet = await client.query<WalletRow>(
      `SELECT pending_balance::text, available_balance::text, held_balance::text
       FROM seller_wallets WHERE seller_id=$1 FOR UPDATE`,
      [order.seller_id],
    );
    const row = wallet.rows[0];
    if (!row) throw new ConflictException('Không tìm thấy seller wallet cho đơn cần hoàn tiền');
    const pending = BigInt(row.pending_balance);
    const available = BigInt(row.available_balance);
    const pendingDeduction = pending >= amount ? amount : pending;
    const availableDeduction = amount - pendingDeduction;
    if (available < availableDeduction) {
      throw new ConflictException('Seller đã rút số dư; hoàn tiền cần được bộ phận tài chính xử lý thủ công');
    }
    await client.query(
      `UPDATE seller_wallets
       SET pending_balance=pending_balance-$2, available_balance=available_balance-$3, updated_at=NOW()
       WHERE seller_id=$1`,
      [order.seller_id, pendingDeduction.toString(), availableDeduction.toString()],
    );
    await client.query(
      `INSERT INTO wallet_transactions(seller_id, order_id, ledger_transaction_id, status, amount)
       VALUES($1,$2,$3,'REFUNDED',$4)`,
      [order.seller_id, order.id, ledgerTransactionId, (-amount).toString()],
    );
  }

  private async lockOrder(client: PoolClient, orderId: string): Promise<OrderRow> {
    const result = await client.query<OrderRow>(
      `SELECT id, buyer_id, seller_id, total_amount::text, seller_payout_amount::text,
              payment_method::text, payment_status::text, order_status::text
       FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId],
    );
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy đơn hàng');
    return result.rows[0];
  }

  private async recordRefundEvent(
    client: PoolClient,
    refundId: string,
    actorId: string,
    fromStatus: string | null,
    toStatus: string,
    reason: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await client.query(
      `INSERT INTO refund_events(refund_id, actor_id, from_status, to_status, reason, metadata)
       VALUES($1,$2,$3::refund_status,$4::refund_status,$5,$6::jsonb)`,
      [refundId, actorId, fromStatus, toStatus, reason, metadata ? JSON.stringify(metadata) : null],
    );
  }

  private publicRefund(row: RefundRow) {
    return {
      id: row.id,
      orderId: row.order_id,
      paymentId: row.payment_id,
      requestedBy: row.requested_by,
      processedBy: row.processed_by,
      type: row.type,
      amount: money(BigInt(row.amount)),
      currency: row.currency,
      reason: row.reason,
      status: row.status,
      originalLedgerTransactionId: row.original_ledger_transaction_id,
      reversingLedgerTransactionId: row.reversing_ledger_transaction_id,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
    };
  }
}
