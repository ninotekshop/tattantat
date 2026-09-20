-- Financial and entitlement snapshots are evidence. Status timestamps may
-- change during a workflow, but the values used to price the original action
-- must never be overwritten. Corrections use a reversing ledger entry or a
-- newly effective service-price version instead.
CREATE OR REPLACE FUNCTION reject_order_financial_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.product_price IS DISTINCT FROM OLD.product_price
    OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
    OR NEW.pricing_version_id IS DISTINCT FROM OLD.pricing_version_id
    OR NEW.platform_fee_rate_bps_snapshot IS DISTINCT FROM OLD.platform_fee_rate_bps_snapshot
    OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
    OR NEW.payment_fee_amount IS DISTINCT FROM OLD.payment_fee_amount
    OR NEW.seller_payout_amount IS DISTINCT FROM OLD.seller_payout_amount
    OR NEW.subtotal_amount IS DISTINCT FROM OLD.subtotal_amount
    OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
    OR NEW.shipping_fee_amount IS DISTINCT FROM OLD.shipping_fee_amount THEN
    RAISE EXCEPTION 'Order financial snapshot is immutable; use a refund/reversing transaction instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_financial_snapshot_immutable ON orders;
CREATE TRIGGER orders_financial_snapshot_immutable
BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION reject_order_financial_snapshot_mutation();

CREATE OR REPLACE FUNCTION reject_promotion_order_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id
    OR NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.package_id IS DISTINCT FROM OLD.package_id
    OR NEW.package_version_id IS DISTINCT FROM OLD.package_version_id
    OR NEW.package_price_snapshot IS DISTINCT FROM OLD.package_price_snapshot
    OR NEW.duration_hours_snapshot IS DISTINCT FROM OLD.duration_hours_snapshot
    OR NEW.promotion_type_snapshot IS DISTINCT FROM OLD.promotion_type_snapshot THEN
    RAISE EXCEPTION 'Promotion order snapshot is immutable; create a new promotion order instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS promotion_orders_snapshot_immutable ON promotion_orders;
CREATE TRIGGER promotion_orders_snapshot_immutable
BEFORE UPDATE ON promotion_orders FOR EACH ROW EXECUTE FUNCTION reject_promotion_order_snapshot_mutation();

CREATE OR REPLACE FUNCTION reject_subscription_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id
    OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
    OR NEW.plan_version_id IS DISTINCT FROM OLD.plan_version_id
    OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
    OR NEW.billing_cycle_snapshot IS DISTINCT FROM OLD.billing_cycle_snapshot
    OR NEW.max_listings_snapshot IS DISTINCT FROM OLD.max_listings_snapshot
    OR NEW.features_snapshot IS DISTINCT FROM OLD.features_snapshot THEN
    RAISE EXCEPTION 'Subscription snapshot is immutable; create a new subscription instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_snapshot_immutable ON subscriptions;
CREATE TRIGGER subscriptions_snapshot_immutable
BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION reject_subscription_snapshot_mutation();

CREATE OR REPLACE FUNCTION reject_subscription_order_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id
    OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
    OR NEW.plan_version_id IS DISTINCT FROM OLD.plan_version_id
    OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
    OR NEW.billing_cycle_snapshot IS DISTINCT FROM OLD.billing_cycle_snapshot
    OR NEW.max_listings_snapshot IS DISTINCT FROM OLD.max_listings_snapshot
    OR NEW.features_snapshot IS DISTINCT FROM OLD.features_snapshot THEN
    RAISE EXCEPTION 'Subscription order snapshot is immutable; create a new subscription order instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_orders_snapshot_immutable ON subscription_orders;
CREATE TRIGGER subscription_orders_snapshot_immutable
BEFORE UPDATE ON subscription_orders FOR EACH ROW EXECUTE FUNCTION reject_subscription_order_snapshot_mutation();
