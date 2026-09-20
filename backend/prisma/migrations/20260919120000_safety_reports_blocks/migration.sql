CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(blocker_id, blocked_id),
  CHECK(blocker_id <> blocked_id)
);
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  reason VARCHAR(80) NOT NULL,
  details VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REVIEWING','RESOLVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(reported_user_id IS NOT NULL OR product_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status,created_at DESC);
