# Pricing & Revenue Architecture

Client only submits product, quantity, coupon and shipping option. The backend resolves an effective pricing version, calculates integer-VND amounts with `ROUND_HALF_UP`, stores an immutable order snapshot, then posts balanced ledger entries in the same database transaction.

`Order → Payment → Ledger transaction → Wallet pending credit → Wallet available → Payout`

Refunds never update finalized ledger rows: they create a reversing ledger transaction. Payment, payout and refund require an `Idempotency-Key`; its request hash and response are stored before side effects. Ledger entries are append-only and each transaction must reconcile to zero.

PostgreSQL triggers enforce the append-only rule for finalized journals. Any attempted `UPDATE` or `DELETE` of a finalized entry is rejected; a financial correction must create a new reversing journal.

Accounts use normal signed amounts: platform cash is positive when received; seller payable, gateway fee and payout are negative. Amounts are `BIGINT` VND only.
