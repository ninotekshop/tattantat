-- Immutable per-order values used by financial posting and refunds.  They
-- retain the actual charged amounts even after a pricing rule changes.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_amount BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  ADD COLUMN IF NOT EXISTS discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS shipping_fee_amount BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee_amount >= 0);

UPDATE orders
SET subtotal_amount = CASE WHEN subtotal_amount = 0 THEN product_price::bigint ELSE subtotal_amount END,
    shipping_fee_amount = CASE
      WHEN shipping_fee_amount = 0 AND total_amount::bigint > product_price::bigint
      THEN total_amount::bigint - product_price::bigint
      ELSE shipping_fee_amount
    END
WHERE subtotal_amount = 0 OR shipping_fee_amount = 0;
