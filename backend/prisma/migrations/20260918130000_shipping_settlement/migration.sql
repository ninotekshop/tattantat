ALTER TYPE ledger_transaction_type ADD VALUE IF NOT EXISTS 'SHIPPING_SETTLEMENT';

CREATE TABLE IF NOT EXISTS shipping_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  customer_fee BIGINT NOT NULL CHECK(customer_fee >= 0),
  provider_cost BIGINT NOT NULL CHECK(provider_cost >= 0),
  platform_margin BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SETTLED','CANCELLED')),
  ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  settled_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shipping_transactions_status_idx ON shipping_transactions(status, created_at DESC);
