-- Payout and refund lifecycle. Monetary values are integer VND (BIGINT) and
-- financial corrections are represented by new ledger transactions.

DO $$ BEGIN
  CREATE TYPE refund_type AS ENUM ('FULL_REFUND', 'PARTIAL_REFUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  bank_name VARCHAR(120) NOT NULL,
  account_holder VARCHAR(150) NOT NULL,
  account_number_encrypted BYTEA NOT NULL,
  account_number_last4 CHAR(4) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_bank_accounts_seller_idx
  ON seller_bank_accounts(seller_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS seller_bank_accounts_one_default_idx
  ON seller_bank_accounts(seller_id) WHERE is_default AND status = 'ACTIVE';

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES seller_bank_accounts(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS payouts_seller_status_idx
  ON payouts(seller_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS payout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE RESTRICT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_status payout_status,
  to_status payout_status NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_events_payout_idx ON payout_events(payout_id, created_at);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES payments(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  processed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  type refund_type NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
  reason TEXT,
  status refund_status NOT NULL DEFAULT 'REQUESTED',
  idempotency_key TEXT NOT NULL UNIQUE,
  original_ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  reversing_ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refunds_order_status_idx ON refunds(order_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS refunds_requested_by_idx ON refunds(requested_by, requested_at DESC);

CREATE TABLE IF NOT EXISTS refund_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE RESTRICT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_status refund_status,
  to_status refund_status NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refund_events_refund_idx ON refund_events(refund_id, created_at);

CREATE TABLE IF NOT EXISTS financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS financial_audit_logs_entity_idx
  ON financial_audit_logs(entity_type, entity_id, created_at DESC);
