# Payouts and refunds API

All endpoints use `Authorization: Bearer <access-token>`. Amounts are decimal
strings representing whole VND; for example `"9700000"`. Clients must never
send a platform fee, seller payout, or ledger amount.

## Seller wallet and bank account

- `GET /api/v1/seller/wallet` returns `pendingBalance`, `availableBalance`, and
  `heldBalance` as VND strings.
- `GET /api/v1/seller/revenue` returns seller wallet/revenue aggregates.
- `GET /api/v1/seller/bank-accounts` returns masked active bank accounts.
- `POST /api/v1/seller/bank-accounts` creates a bank account. Account numbers
  are AES-256-GCM encrypted before storage and are never returned. This needs
  `BANK_ACCOUNT_ENCRYPTION_KEY` in the server environment.

```json
{
  "bankName": "Vietcombank",
  "accountHolder": "NGUYEN VAN A",
  "accountNumber": "0123456789",
  "isDefault": true
}
```

## Payout lifecycle

Every state-changing payout request requires a unique `Idempotency-Key` header.
Replaying the same key and payload returns the original response; reusing it
with a different payload returns `409`.

`POST /api/v1/seller/payout` holds available funds but does not claim that a
bank transfer has settled yet:

```http
Idempotency-Key: payout-20260918-001
```

```json
{
  "amount": "9700000",
  "bankAccountId": "UUID optional when a default account exists"
}
```

The request atomically creates a payout, a pending ledger transaction and a
`HELD` wallet record, then moves the balance from `available` to `held`.

- `GET /api/v1/seller/payouts` lists the seller's payouts.
- `POST /api/v1/seller/payouts/:id/cancel` releases a `REQUESTED` payout and
  reverses its pending ledger reservation. It also needs `Idempotency-Key`.
- `POST /api/v1/admin/payouts/:id/status` is finance-admin-only. Its body is
  `{ "status": "PROCESSING" | "COMPLETED" | "FAILED", "reason": "..." }`
  and it also needs `Idempotency-Key`.

On `COMPLETED`, the server creates balanced append-only ledger entries:

| Account | Signed amount |
| --- | ---: |
| `PLATFORM_CASH` | `-netAmount` |
| `SELLER_PAYABLE` | `+amount` |
| `PAYOUT_FEE_REVENUE` | `-fee` when a payout fee applies |

## Refund lifecycle

- `GET /api/v1/orders/:id/refunds` is available to the buyer, seller, or
  finance admin.
- `POST /api/v1/orders/:id/refund` requires an `Idempotency-Key`, a completed
  order, a finalized balanced `ORDER_PAYMENT` transaction, and authorization
  as the order seller or finance admin.

```json
{
  "amount": "500000",
  "reason": "Sản phẩm không đúng mô tả"
}
```

Omit `amount` to refund the remaining refundable VND total. The endpoint
does not modify existing ledger rows. It creates a `REFUND` transaction whose
entries reverse the original `ORDER_PAYMENT` proportionally. The allocation is
cumulative with `ROUND_HALF_UP`, so several partial refunds reconcile exactly
to the original transaction after a full refund. Seller wallet balances are
reduced atomically alongside the reversal. If seller money has already been
withdrawn, the automatic refund is rejected for finance-team handling rather
than allowing a negative wallet balance.
