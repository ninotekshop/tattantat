-- Derived daily reporting projection. The append-only ledger remains the
-- authoritative accounting source; this table is safe to refresh/rebuild.
CREATE TABLE platform_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_date DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  gmv BIGINT NOT NULL DEFAULT 0,
  platform_fee BIGINT NOT NULL DEFAULT 0,
  payment_processing_cost BIGINT NOT NULL DEFAULT 0,
  seller_payout BIGINT NOT NULL DEFAULT 0,
  promotion_revenue BIGINT NOT NULL DEFAULT 0,
  subscription_revenue BIGINT NOT NULL DEFAULT 0,
  advertising_revenue BIGINT NOT NULL DEFAULT 0,
  shipping_margin BIGINT NOT NULL DEFAULT 0,
  refund_volume BIGINT NOT NULL DEFAULT 0 CHECK (refund_volume >= 0),
  net_revenue BIGINT NOT NULL DEFAULT 0,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_revenues_date_currency_unique UNIQUE (revenue_date, currency)
);

CREATE INDEX platform_revenues_currency_date_idx ON platform_revenues(currency, revenue_date DESC);
