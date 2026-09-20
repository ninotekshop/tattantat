-- A paid plan/campaign is not activated from a client request. These durable
-- purchase records connect the commercial object to its immutable ledger sale.
CREATE TABLE IF NOT EXISTS subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  price_snapshot BIGINT NOT NULL CHECK (price_snapshot >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CANCELLED','FAILED')),
  idempotency_key TEXT NOT NULL UNIQUE,
  ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscription_orders_seller_status_idx
  ON subscription_orders(seller_id,status,created_at DESC);

ALTER TABLE advertising_campaigns
  ADD COLUMN IF NOT EXISTS ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
