ALTER TABLE content_reports
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_note VARCHAR(1000);

CREATE TABLE IF NOT EXISTS moderation_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES content_reports(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moderation_audit_logs_report_idx
  ON moderation_audit_logs(report_id, created_at DESC);
