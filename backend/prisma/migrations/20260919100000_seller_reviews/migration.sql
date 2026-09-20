CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_reviews_seller_created_idx
  ON seller_reviews(seller_id, created_at DESC);
