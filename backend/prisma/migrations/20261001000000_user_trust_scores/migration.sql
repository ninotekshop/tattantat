-- Hệ thống Điểm uy tín thành viên (Trust Score)
-- Chỉ ảnh đại diện do người dùng tự cập nhật mới được tính điểm (không tính ảnh lấy từ Google/Facebook/Zalo/Apple).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  CHECK (referrer_user_id <> referred_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals (referrer_user_id, status);

CREATE TABLE IF NOT EXISTS user_trust_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL DEFAULT 0,
  stars SMALLINT NOT NULL DEFAULT 1,
  level TEXT NOT NULL DEFAULT 'Thành viên mới',
  breakdown JSONB NOT NULL DEFAULT '[]',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_trust_score_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_score SMALLINT,
  new_score SMALLINT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_logs_user ON user_trust_score_logs (user_id, created_at DESC);

-- Chỉ backend (service role) được ghi; client không truy cập trực tiếp.
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_score_logs ENABLE ROW LEVEL SECURITY;
