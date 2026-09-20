-- Version service pricing/configuration. Existing service orders are first
-- backfilled from the package/plan that created them, then become independent
-- snapshots so later admin changes cannot alter historic entitlements.
CREATE TABLE promotion_package_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES promotion_packages(id),
  price BIGINT NOT NULL CHECK(price >= 0),
  duration_hours INTEGER NOT NULL CHECK(duration_hours > 0),
  promotion_type promotion_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX promotion_package_versions_active_idx
  ON promotion_package_versions(package_id,status,effective_from DESC);

CREATE TABLE subscription_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  price BIGINT NOT NULL CHECK(price >= 0),
  billing_cycle TEXT NOT NULL CHECK(billing_cycle IN ('MONTHLY','YEARLY')),
  max_listings INTEGER CHECK(max_listings IS NULL OR max_listings > 0),
  features JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX subscription_plan_versions_active_idx
  ON subscription_plan_versions(plan_id,status,effective_from DESC);

INSERT INTO promotion_package_versions(package_id,price,duration_hours,promotion_type,status,effective_from,effective_to,reason)
SELECT id,price,duration_hours,promotion_type,status,effective_from,effective_to,'Initial imported package price'
FROM promotion_packages;

INSERT INTO subscription_plan_versions(plan_id,price,billing_cycle,max_listings,features,status,effective_from,effective_to,reason)
SELECT id,price,billing_cycle,max_listings,features,status,effective_from,effective_to,'Initial imported plan price'
FROM subscription_plans;

ALTER TABLE promotion_orders ADD COLUMN package_version_id UUID REFERENCES promotion_package_versions(id);
ALTER TABLE promotion_orders ADD COLUMN duration_hours_snapshot INTEGER;
ALTER TABLE promotion_orders ADD COLUMN promotion_type_snapshot promotion_type;
UPDATE promotion_orders o SET
  package_version_id = v.id,
  duration_hours_snapshot = v.duration_hours,
  promotion_type_snapshot = v.promotion_type
FROM promotion_package_versions v WHERE v.package_id=o.package_id;
ALTER TABLE promotion_orders ALTER COLUMN package_version_id SET NOT NULL;
ALTER TABLE promotion_orders ALTER COLUMN duration_hours_snapshot SET NOT NULL;
ALTER TABLE promotion_orders ALTER COLUMN promotion_type_snapshot SET NOT NULL;
CREATE INDEX promotion_orders_version_idx ON promotion_orders(package_version_id);

ALTER TABLE subscription_orders ADD COLUMN plan_version_id UUID REFERENCES subscription_plan_versions(id);
ALTER TABLE subscription_orders ADD COLUMN billing_cycle_snapshot TEXT;
ALTER TABLE subscription_orders ADD COLUMN max_listings_snapshot INTEGER;
ALTER TABLE subscription_orders ADD COLUMN features_snapshot JSONB NOT NULL DEFAULT '[]';
UPDATE subscription_orders o SET
  plan_version_id=v.id,billing_cycle_snapshot=v.billing_cycle,
  max_listings_snapshot=v.max_listings,features_snapshot=v.features
FROM subscription_plan_versions v WHERE v.plan_id=o.plan_id;
ALTER TABLE subscription_orders ALTER COLUMN plan_version_id SET NOT NULL;
ALTER TABLE subscription_orders ALTER COLUMN billing_cycle_snapshot SET NOT NULL;
ALTER TABLE subscription_orders ADD CONSTRAINT subscription_orders_cycle_snapshot_check
  CHECK(billing_cycle_snapshot IN ('MONTHLY','YEARLY'));
CREATE INDEX subscription_orders_version_idx ON subscription_orders(plan_version_id);

ALTER TABLE subscriptions ADD COLUMN plan_version_id UUID REFERENCES subscription_plan_versions(id);
ALTER TABLE subscriptions ADD COLUMN billing_cycle_snapshot TEXT;
ALTER TABLE subscriptions ADD COLUMN max_listings_snapshot INTEGER;
ALTER TABLE subscriptions ADD COLUMN features_snapshot JSONB NOT NULL DEFAULT '[]';
UPDATE subscriptions s SET
  plan_version_id=v.id,billing_cycle_snapshot=v.billing_cycle,
  max_listings_snapshot=v.max_listings,features_snapshot=v.features
FROM subscription_plan_versions v WHERE v.plan_id=s.plan_id;
ALTER TABLE subscriptions ALTER COLUMN plan_version_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN billing_cycle_snapshot SET NOT NULL;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_cycle_snapshot_check
  CHECK(billing_cycle_snapshot IN ('MONTHLY','YEARLY'));
CREATE INDEX subscriptions_version_idx ON subscriptions(plan_version_id);
