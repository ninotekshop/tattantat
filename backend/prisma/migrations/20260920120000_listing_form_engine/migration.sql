ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_listing_group BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_price_mode TEXT NOT NULL DEFAULT 'FIXED';
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_negotiable BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE listing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id BIGINT NOT NULL REFERENCES categories(id),
  version INTEGER NOT NULL CHECK(version>0), name VARCHAR(150) NOT NULL, active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}', created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(category_id,version)
);
CREATE UNIQUE INDEX listing_template_active ON listing_templates(category_id) WHERE active;
CREATE TABLE listing_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), template_id UUID NOT NULL REFERENCES listing_templates(id),
  key VARCHAR(64) NOT NULL, label VARCHAR(150) NOT NULL, type VARCHAR(30) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false, enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0, config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(template_id,key)
);
CREATE INDEX listing_fields_order ON listing_fields(template_id,sort_order);
CREATE TABLE listing_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), field_id UUID NOT NULL REFERENCES listing_fields(id),
  value VARCHAR(120) NOT NULL, label VARCHAR(150) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(field_id,value)
);
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), seller_id UUID NOT NULL REFERENCES users(id),
  category_id BIGINT NOT NULL REFERENCES categories(id), template_id UUID NOT NULL REFERENCES listing_templates(id),
  template_snapshot JSONB NOT NULL, data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0), client_key UUID NOT NULL,
  product_id UUID UNIQUE REFERENCES products(id), published_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ, UNIQUE(seller_id,client_key)
);
CREATE INDEX listings_seller_updated ON listings(seller_id,updated_at DESC);
CREATE TABLE listing_field_values (
  listing_id UUID NOT NULL REFERENCES listings(id), field_key VARCHAR(64) NOT NULL,
  value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(listing_id,field_key)
);
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), listing_id UUID NOT NULL REFERENCES listings(id),
  storage_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, byte_size INTEGER NOT NULL CHECK(byte_size>0 AND byte_size<=10485760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listing_images_listing ON listing_images(listing_id);
CREATE TABLE listing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), listing_id UUID NOT NULL REFERENCES listings(id),
  storage_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL, byte_size INTEGER NOT NULL CHECK(byte_size>0 AND byte_size<=52428800),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listing_videos_listing ON listing_videos(listing_id);
CREATE TABLE listing_publish_requests (
  seller_id UUID NOT NULL REFERENCES users(id), key UUID NOT NULL, listing_id UUID NOT NULL REFERENCES listings(id),
  revision INTEGER NOT NULL, product_id UUID NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(seller_id,key)
);
CREATE TABLE listing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, entity_id TEXT NOT NULL, detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listing_audit_entity ON listing_audit_logs(entity_id,created_at);
ALTER TABLE listing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_publish_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_audit_logs ENABLE ROW LEVEL SECURITY;
