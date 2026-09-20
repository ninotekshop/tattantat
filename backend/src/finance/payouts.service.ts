import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { money, parseVnd } from './finance-money';
import { FinanceAuthorizationService } from './finance-authorization.service';
import { IdempotencyService } from './idempotency.service';
import { LedgerWriterService } from './ledger-writer.service';
import { CancelPayoutDto, PayoutStatusDto, RequestPayoutDto } from './dto/finance.dto';

interface WalletRow {
  pending_balance: string;
  available_balance: string;
  held_balance: string;
}

interface PayoutRow {
  id: string;
  seller_id: string;
  amount: string;
  fee: string;
  net_amount: string;
  bank_account_id: string | null;
  ledger_transaction_id: string | null;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requested_at: Date;
  processed_at: Date | null;
  failure_reason: string | null;
}

@Injectable()
export class PayoutsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly idempotency: IdempotencyService,
    private readonly authorization: FinanceAuthorizationService,
    private readonly ledger: LedgerWriterService,
  ) {}

  async wallet(sellerId: string) {
    const wallet = await this.db.query<WalletRow>(
      `SELECT pending_balance::text, available_balance::text, held_balance::text
       FROM seller_wallets WHERE seller_id=$1`,
      [sellerId],
    );
    const row = wallet.rows[0];
    return {
      pendingBalance: row?.pending_balance ?? '0',
      availableBalance: row?.available_balance ?? '0',
      heldBalance: row?.held_balance ?? '0',
      currency: 'VND',
    };
  }

  async revenue(sellerId: string) {
    const result = await this.db.query<{
      gross_seller_payout: string;
      refunded_seller_payout: string;
      withdrawn: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('PENDING','AVAILABLE','HELD','WITHDRAWN') AND amount > 0 THEN amount ELSE 0 END),0)::text AS gross_seller_payout,
         COALESCE(SUM(CASE WHEN status='REFUNDED' THEN -amount ELSE 0 END),0)::text AS refunded_seller_payout,
         COALESCE(SUM(CASE WHEN status='WITHDRAWN' THEN -amount ELSE 0 END),0)::text AS withdrawn
       FROM wallet_transactions WHERE seller_id=$1`,
      [sellerId],
    );
    const row = result.rows[0];
    return {
      grossSellerPayout: row?.gross_seller_payout ?? '0',
      refundedSellerPayout: row?.refunded_seller_payout ?? '0',
      withdrawn: row?.withdrawn ?? '0',
      wallet: await this.wallet(sellerId),
      currency: 'VND',
    };
  }

  async list(sellerId: string) {
    const result = await this.db.query<PayoutRow & { bank_name: string | null; account_number_last4: string | null }>(
      `SELECT p.id, p.seller_id, p.amount::text, p.fee::text, p.net_amount::text,
              p.bank_account_id, p.ledger_transaction_id, p.status::text, p.requested_at,
              p.processed_at, p.failure_reason, b.bank_name, b.account_number_last4
       FROM payouts p LEFT JOIN seller_bank_accounts b ON b.id=p.bank_account_id
       WHERE p.seller_id=$1 ORDER BY p.requested_at DESC`,
      [sellerId],
    );
    return result.rows.map((row) => this.publicPayout(row));
  }

  async listForAdmin(status: PayoutRow['status'] | undefined, limit: number) {
    const result = await this.db.query<PayoutRow & { bank_name: string | null; account_number_last4: string | null; seller_name: string; seller_email: string | null; seller_phone: string | null }>(
      `SELECT p.id,p.seller_id,p.amount::text,p.fee::text,p.net_amount::text,p.bank_account_id,p.ledger_transaction_id,
              p.status::text,p.requested_at,p.processed_at,p.failure_reason,b.bank_name,b.account_number_last4,
              u.full_name AS seller_name,u.email AS seller_email,u.phone AS seller_phone
       FROM payouts p JOIN users u ON u.id=p.seller_id LEFT JOIN seller_bank_accounts b ON b.id=p.bank_account_id
       WHERE ($1::payout_status IS NULL OR p.status=$1::payout_status)
       ORDER BY p.requested_at ASC LIMIT $2`, [status ?? null, limit]);
    return result.rows.map((row) => ({ ...this.publicPayout(row), sellerName: row.seller_name, sellerEmail: row.seller_email,
      sellerPhone: row.seller_phone, bankName: row.bank_name, accountNumberLast4: row.account_number_last4 }));
  }

  async request(sellerId: string, dto: RequestPayoutDto, rawIdempotencyKey: string | undefined) {
    const amount = parseVnd(dto.amount, 'amount');
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown }>(
        client,
        'seller-payout',
        sellerId,
        rawIdempotencyKey,
        { amount: dto.amount, bankAccountId: dto.bankAccountId ?? null },
      );
      if (claim.replay) return claim.replay;

      const bankAccount = await this.resolveBankAccount(client, sellerId, dto.bankAccountId);
      await client.query(
        `INSERT INTO seller_wallets(seller_id) VALUES($1) ON CONFLICT(seller_id) DO NOTHING`,
        [sellerId],
      );
      const wallet = await this.lockWallet(client, sellerId);
      const available = BigInt(wallet.available_balance);
      if (available < amount) {
        throw new BadRequestException('Số tiền rút vượt quá số dư khả dụng');
      }

      // Payout fee is backend-owned. It is zero until an active payout-fee pricing rule is introduced.
      const fee = 0n;
      const netAmount = amount - fee;
      const payout = await client.query<PayoutRow>(
        `INSERT INTO payouts(seller_id, amount, fee, net_amount, bank_account_id, idempotency_key)
         VALUES($1,$2,$3,$4,$5,$6)
         RETURNING id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
                   ledger_transaction_id, status::text, requested_at, processed_at, failure_reason`,
        [sellerId, amount.toString(), fee.toString(), netAmount.toString(), bankAccount.id, claim.scopedKey],
      );
      const created = payout.rows[0];
      const ledgerTransactionId = await this.ledger.createPendingPayout(client, created.id, claim.scopedKey);
      await client.query(
        'UPDATE payouts SET ledger_transaction_id=$2, updated_at=NOW() WHERE id=$1',
        [created.id, ledgerTransactionId],
      );
      created.ledger_transaction_id = ledgerTransactionId;

      await client.query(
        `UPDATE seller_wallets
         SET available_balance=available_balance-$2, held_balance=held_balance+$2, updated_at=NOW()
         WHERE seller_id=$1`,
        [sellerId, amount.toString()],
      );
      await client.query(
        `INSERT INTO wallet_transactions(seller_id, ledger_transaction_id, status, amount)
         VALUES($1,$2,'HELD',$3)`,
        [sellerId, ledgerTransactionId, (-amount).toString()],
      );
      await this.recordPayoutEvent(client, created.id, sellerId, null, 'REQUESTED', null, {
        bankAccountId: bankAccount.id,
      });

      const response = {
        success: true,
        data: this.publicPayout(created),
        message: 'Đã giữ số dư và tạo yêu cầu rút tiền',
        errorCode: null,
      };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  async cancel(
    sellerId: string,
    payoutId: string,
    dto: CancelPayoutDto,
    rawIdempotencyKey: string | undefined,
  ) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown }>(
        client,
        'seller-payout-cancel',
        sellerId,
        rawIdempotencyKey,
        { payoutId, reason: dto.reason ?? null },
      );
      if (claim.replay) return claim.replay;

      const payout = await this.lockPayout(client, payoutId);
      if (payout.seller_id !== sellerId) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
      if (payout.status !== 'REQUESTED') {
        throw new ConflictException('Chỉ có thể hủy yêu cầu rút tiền đang chờ');
      }
      if (!payout.ledger_transaction_id) throw new ConflictException('Thiếu ledger transaction của payout');
      const amount = BigInt(payout.amount);
      const wallet = await this.lockWallet(client, sellerId);
      if (BigInt(wallet.held_balance) < amount) {
        throw new ConflictException('Số dư giữ lại không đủ để hủy payout');
      }

      await this.ledger.reversePending(client, payout.ledger_transaction_id);
      await client.query(
        `UPDATE seller_wallets
         SET held_balance=held_balance-$2, available_balance=available_balance+$2, updated_at=NOW()
         WHERE seller_id=$1`,
        [sellerId, amount.toString()],
      );
      const updated = await client.query<PayoutRow>(
        `UPDATE payouts SET status='CANCELLED', failure_reason=$2, updated_at=NOW() WHERE id=$1
         RETURNING id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
                   ledger_transaction_id, status::text, requested_at, processed_at, failure_reason`,
        [payoutId, dto.reason ?? 'Seller cancelled payout request'],
      );
      await client.query(
        `INSERT INTO wallet_transactions(seller_id, ledger_transaction_id, status, amount)
         VALUES($1,$2,'AVAILABLE',$3)`,
        [sellerId, payout.ledger_transaction_id, amount.toString()],
      );
      await this.recordPayoutEvent(client, payoutId, sellerId, 'REQUESTED', 'CANCELLED', dto.reason ?? null);

      const response = {
        success: true,
        data: this.publicPayout(updated.rows[0]),
        message: 'Đã hủy yêu cầu rút tiền và hoàn số dư khả dụng',
        errorCode: null,
      };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  async transitionByAdmin(
    actorId: string,
    payoutId: string,
    dto: PayoutStatusDto,
    rawIdempotencyKey: string | undefined,
  ) {
    return this.db.transaction(async (client) => {
      await this.authorization.requireFinanceAdmin(client, actorId);
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown }>(
        client,
        'admin-payout-transition',
        actorId,
        rawIdempotencyKey,
        { payoutId, status: dto.status, reason: dto.reason ?? null },
      );
      if (claim.replay) return claim.replay;

      const payout = await this.lockPayout(client, payoutId);
      if (payout.status === 'COMPLETED' || payout.status === 'CANCELLED' || payout.status === 'FAILED') {
        throw new ConflictException('Payout đã ở trạng thái cuối');
      }
      if (!payout.ledger_transaction_id) throw new ConflictException('Thiếu ledger transaction của payout');

      if (dto.status === 'PROCESSING') {
        if (payout.status !== 'REQUESTED') throw new ConflictException('Payout không thể chuyển sang PROCESSING');
        const updated = await client.query<PayoutRow>(
          `UPDATE payouts SET status='PROCESSING', updated_at=NOW() WHERE id=$1
           RETURNING id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
                     ledger_transaction_id, status::text, requested_at, processed_at, failure_reason`,
          [payoutId],
        );
        await this.recordPayoutEvent(client, payoutId, actorId, 'REQUESTED', 'PROCESSING', dto.reason ?? null);
        const response = { success: true, data: this.publicPayout(updated.rows[0]), message: null, errorCode: null };
        await this.idempotency.complete(client, claim.scopedKey, response);
        return response;
      }

      const amount = BigInt(payout.amount);
      const fee = BigInt(payout.fee);
      const netAmount = BigInt(payout.net_amount);
      const wallet = await this.lockWallet(client, payout.seller_id);
      if (BigInt(wallet.held_balance) < amount) {
        throw new ConflictException('Số dư giữ lại không khớp payout');
      }

      if (dto.status === 'COMPLETED') {
        await this.ledger.finalize(client, payout.ledger_transaction_id, [
          { accountCode: 'PLATFORM_CASH', amount: -netAmount, userId: payout.seller_id },
          { accountCode: 'SELLER_PAYABLE', amount, userId: payout.seller_id },
          ...(fee > 0n ? [{ accountCode: 'PAYOUT_FEE_REVENUE', amount: -fee, userId: payout.seller_id }] : []),
        ]);
        await client.query(
          `UPDATE seller_wallets SET held_balance=held_balance-$2, updated_at=NOW() WHERE seller_id=$1`,
          [payout.seller_id, amount.toString()],
        );
        const updated = await client.query<PayoutRow>(
          `UPDATE payouts SET status='COMPLETED', processed_at=NOW(), updated_at=NOW(), failure_reason=NULL
           WHERE id=$1
           RETURNING id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
                     ledger_transaction_id, status::text, requested_at, processed_at, failure_reason`,
          [payoutId],
        );
        await client.query(
          `INSERT INTO wallet_transactions(seller_id, ledger_transaction_id, status, amount)
           VALUES($1,$2,'WITHDRAWN',$3)`,
          [payout.seller_id, payout.ledger_transaction_id, (-amount).toString()],
        );
        await this.recordPayoutEvent(client, payoutId, actorId, payout.status, 'COMPLETED', dto.reason ?? null);
        const response = {
          success: true,
          data: this.publicPayout(updated.rows[0]),
          message: 'Đã chốt payout và ghi ledger',
          errorCode: null,
        };
        await this.idempotency.complete(client, claim.scopedKey, response);
        return response;
      }

      // A failed bank transfer releases the reserved seller funds; no finalized
      // payout ledger exists yet, so its pending transaction is reversed.
      await this.ledger.reversePending(client, payout.ledger_transaction_id);
      await client.query(
        `UPDATE seller_wallets
         SET held_balance=held_balance-$2, available_balance=available_balance+$2, updated_at=NOW()
         WHERE seller_id=$1`,
        [payout.seller_id, amount.toString()],
      );
      const updated = await client.query<PayoutRow>(
        `UPDATE payouts SET status='FAILED', failure_reason=$2, processed_at=NOW(), updated_at=NOW()
         WHERE id=$1
         RETURNING id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
                   ledger_transaction_id, status::text, requested_at, processed_at, failure_reason`,
        [payoutId, dto.reason ?? 'Bank transfer failed'],
      );
      await client.query(
        `INSERT INTO wallet_transactions(seller_id, ledger_transaction_id, status, amount)
         VALUES($1,$2,'AVAILABLE',$3)`,
        [payout.seller_id, payout.ledger_transaction_id, amount.toString()],
      );
      await this.recordPayoutEvent(client, payoutId, actorId, payout.status, 'FAILED', dto.reason ?? null);
      const response = {
        success: true,
        data: this.publicPayout(updated.rows[0]),
        message: 'Payout thất bại; số dư đã được hoàn về khả dụng',
        errorCode: null,
      };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  private async resolveBankAccount(client: PoolClient, sellerId: string, requestedId?: string) {
    const result = await client.query<{ id: string }>(
      `SELECT id FROM seller_bank_accounts
       WHERE seller_id=$1 AND status='ACTIVE' AND ($2::uuid IS NULL OR id=$2::uuid)
       ORDER BY CASE WHEN $2::uuid IS NULL THEN is_default ELSE FALSE END DESC, created_at DESC
       LIMIT 1 FOR UPDATE`,
      [sellerId, requestedId ?? null],
    );
    const account = result.rows[0];
    if (!account) throw new BadRequestException('Cần chọn tài khoản ngân hàng đang hoạt động');
    return account;
  }

  private async lockWallet(client: PoolClient, sellerId: string): Promise<WalletRow> {
    const result = await client.query<WalletRow>(
      `SELECT pending_balance::text, available_balance::text, held_balance::text
       FROM seller_wallets WHERE seller_id=$1 FOR UPDATE`,
      [sellerId],
    );
    if (!result.rows[0]) throw new ConflictException('Không tìm thấy seller wallet');
    return result.rows[0];
  }

  private async lockPayout(client: PoolClient, payoutId: string): Promise<PayoutRow> {
    const result = await client.query<PayoutRow>(
      `SELECT id, seller_id, amount::text, fee::text, net_amount::text, bank_account_id,
              ledger_transaction_id, status::text, requested_at, processed_at, failure_reason
       FROM payouts WHERE id=$1 FOR UPDATE`,
      [payoutId],
    );
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy payout');
    return result.rows[0];
  }

  private async recordPayoutEvent(
    client: PoolClient,
    payoutId: string,
    actorId: string,
    fromStatus: string | null,
    toStatus: string,
    reason: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await client.query(
      `INSERT INTO payout_events(payout_id, actor_id, from_status, to_status, reason, metadata)
       VALUES($1,$2,$3::payout_status,$4::payout_status,$5,$6::jsonb)`,
      [payoutId, actorId, fromStatus, toStatus, reason, metadata ? JSON.stringify(metadata) : null],
    );
    await client.query(
      `INSERT INTO financial_audit_logs(actor_id, action, entity_type, entity_id, new_value, reason)
       VALUES($1,$2,'PAYOUT',$3,$4::jsonb,$5)`,
      [
        actorId,
        `PAYOUT_${toStatus}`,
        payoutId,
        JSON.stringify({ fromStatus, toStatus, metadata: metadata ?? null }),
        reason,
      ],
    );
  }

  private publicPayout(row: PayoutRow) {
    return {
      id: row.id,
      sellerId: row.seller_id,
      amount: money(BigInt(row.amount)),
      fee: money(BigInt(row.fee)),
      netAmount: money(BigInt(row.net_amount)),
      bankAccountId: row.bank_account_id,
      status: row.status,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      failureReason: row.failure_reason,
      currency: 'VND',
    };
  }
}
