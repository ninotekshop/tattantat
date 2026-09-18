
-- ============================================================
-- TẤT TẦN TẬT - PostgreSQL Database V1.0
-- Marketplace C2C: mua bán hàng hóa giữa người dùng
-- PostgreSQL 15+
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE','INACTIVE','SUSPENDED','BANNED','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER','ADMIN','SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM ('PHONE','EMAIL','IDENTITY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING','VERIFIED','REJECTED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('DRAFT','PENDING_REVIEW','ACTIVE','RESERVED','SOLD','EXPIRED','REJECTED','HIDDEN','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE product_condition AS ENUM ('NEW','LIKE_NEW','USED_GOOD','USED_FAIR','FOR_PARTS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('IMAGE','VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('TEXT','IMAGE','VIDEO','LOCATION','PRODUCT','ORDER','SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING','CONFIRMED','PREPARING','SHIPPING','DELIVERED','COMPLETED','CANCELLED','DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('COD','BANK_TRANSFER','VNPAY','MOMO','ZALOPAY','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('PENDING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','RETURNED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_target_type AS ENUM ('USER','PRODUCT','MESSAGE','REVIEW','ORDER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING','REVIEWING','RESOLVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_type AS ENUM ('FEATURED','BOOST','TOP_SEARCH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_status AS ENUM ('PENDING','ACTIVE','EXPIRED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attribute_type AS ENUM ('TEXT','NUMBER','BOOLEAN','SELECT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. COMMON TRIGGER
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. USERS / IDENTITY
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone               VARCHAR(20) UNIQUE,
    email               CITEXT UNIQUE,
    password_hash       TEXT,
    full_name           VARCHAR(150) NOT NULL,
    username            CITEXT UNIQUE,
    avatar_url          TEXT,
    date_of_birth       DATE,
    gender              SMALLINT CHECK (gender IN (0,1,2)),
    status              user_status NOT NULL DEFAULT 'ACTIVE',
    role                user_role NOT NULL DEFAULT 'USER',
    phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name        VARCHAR(150),
    bio                 TEXT,
    avatar_url          TEXT,
    cover_url           TEXT,
    province_id         BIGINT,
    district_id         BIGINT,
    ward_id             BIGINT,
    address             TEXT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    rating_avg          NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
    rating_count        INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    transaction_count   INTEGER NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
    response_rate       NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (response_rate BETWEEN 0 AND 100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name       VARCHAR(150) NOT NULL,
    receiver_phone      VARCHAR(20) NOT NULL,
    address_line        TEXT NOT NULL,
    province_id         BIGINT,
    district_id         BIGINT,
    ward_id             BIGINT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_default_address
ON user_addresses(user_id) WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS user_devices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform            VARCHAR(20) NOT NULL CHECK (platform IN ('ANDROID','IOS','WEB')),
    device_token        TEXT NOT NULL,
    app_version         VARCHAR(30),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, device_token)
);

CREATE TABLE IF NOT EXISTS user_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type   verification_type NOT NULL,
    document_type       VARCHAR(30),
    document_number_hash TEXT,
    front_image_url     TEXT,
    back_image_url      TEXT,
    selfie_image_url    TEXT,
    status              verification_status NOT NULL DEFAULT 'PENDING',
    verified_at         TIMESTAMPTZ,
    rejected_reason     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS user_follows (
    follower_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- ------------------------------------------------------------
-- 4. CATALOG
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id                  BIGSERIAL PRIMARY KEY,
    parent_id           BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(120) NOT NULL UNIQUE,
    description         TEXT,
    icon_url             TEXT,
    image_url            TEXT,
    sort_order           INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, name)
);

CREATE TABLE IF NOT EXISTS brands (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    slug                VARCHAR(120) NOT NULL UNIQUE,
    logo_url             TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attributes (
    id                  BIGSERIAL PRIMARY KEY,
    category_id         BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(120) NOT NULL,
    type                attribute_type NOT NULL,
    unit                VARCHAR(30),
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS attribute_options (
    id                  BIGSERIAL PRIMARY KEY,
    attribute_id        BIGINT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    label               VARCHAR(100) NOT NULL,
    value               VARCHAR(100) NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    UNIQUE(attribute_id, value)
);

-- ------------------------------------------------------------
-- 5. PRODUCTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id         BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id            BIGINT REFERENCES brands(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    slug                VARCHAR(250) NOT NULL UNIQUE,
    description         TEXT,
    price               NUMERIC(15,2) NOT NULL CHECK (price >= 0),
    original_price      NUMERIC(15,2) CHECK (original_price IS NULL OR original_price >= 0),
    condition           product_condition NOT NULL DEFAULT 'USED_GOOD',
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    quantity_available  INTEGER NOT NULL DEFAULT 1 CHECK (quantity_available >= 0 AND quantity_available <= quantity),
    province_id         BIGINT,
    district_id         BIGINT,
    ward_id             BIGINT,
    address             TEXT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    status              product_status NOT NULL DEFAULT 'DRAFT',
    view_count          BIGINT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    favorite_count      INTEGER NOT NULL DEFAULT 0 CHECK (favorite_count >= 0),
    message_count       INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    published_at        TIMESTAMPTZ,
    sold_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_images (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url                 TEXT NOT NULL,
    thumbnail_url       TEXT,
    type                media_type NOT NULL DEFAULT 'IMAGE',
    sort_order          INTEGER NOT NULL DEFAULT 0,
    width               INTEGER,
    height              INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_attributes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id        BIGINT NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
    value_text          TEXT,
    value_number        NUMERIC,
    value_boolean       BOOLEAN,
    option_id           BIGINT REFERENCES attribute_options(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, attribute_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS search_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword             VARCHAR(255) NOT NULL,
    category_id         BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. CHAT
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chats (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    last_message_id     UUID,
    last_message_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (buyer_id <> seller_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_chat_product_buyer_seller
ON chats(buyer_id, seller_id, product_id);

CREATE TABLE IF NOT EXISTS messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id             UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type        message_type NOT NULL DEFAULT 'TEXT',
    content             TEXT,
    attachment_url      TEXT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    referenced_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    referenced_order_id  UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    CHECK (
        content IS NOT NULL
        OR attachment_url IS NOT NULL
        OR message_type IN ('PRODUCT','ORDER','LOCATION','SYSTEM')
    )
);

ALTER TABLE chats
    ADD CONSTRAINT fk_chats_last_message
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 7. ORDERS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code          VARCHAR(30) NOT NULL UNIQUE,
    buyer_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    product_price       NUMERIC(15,2) NOT NULL CHECK (product_price >= 0),
    shipping_fee        NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount     NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount        NUMERIC(15,2) NOT NULL CHECK (total_amount >= 0),
    payment_method      payment_method,
    payment_status      payment_status NOT NULL DEFAULT 'PENDING',
    shipping_method     VARCHAR(30),
    shipping_status     shipment_status NOT NULL DEFAULT 'PENDING',
    order_status        order_status NOT NULL DEFAULT 'PENDING',
    shipping_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
    note                TEXT,
    confirmed_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (buyer_id <> seller_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_name        VARCHAR(200) NOT NULL,
    unit_price          NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    subtotal             NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status              order_status NOT NULL,
    changed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_status_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status              product_status NOT NULL,
    changed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    reason              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. PAYMENTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_code        VARCHAR(100) NOT NULL UNIQUE,
    provider            VARCHAR(30) NOT NULL,
    amount              NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency            VARCHAR(10) NOT NULL DEFAULT 'VND',
    status              payment_status NOT NULL DEFAULT 'PENDING',
    transaction_id      VARCHAR(150),
    provider_response   JSONB,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. SHIPPING
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shipments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    carrier             VARCHAR(50),
    tracking_code       VARCHAR(100),
    sender_name         VARCHAR(150),
    sender_phone        VARCHAR(20),
    receiver_name       VARCHAR(150),
    receiver_phone      VARCHAR(20),
    shipping_fee        NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    status              shipment_status NOT NULL DEFAULT 'PENDING',
    picked_up_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status              shipment_status NOT NULL,
    location            VARCHAR(255),
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 10. REVIEWS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    reviewer_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, reviewer_id),
    CHECK (reviewer_id <> reviewed_user_id)
);

CREATE TABLE IF NOT EXISTS review_images (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id           UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url            TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 11. TRUST & SAFETY
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    target_type         report_target_type NOT NULL,
    target_id           UUID NOT NULL,
    reason              VARCHAR(50) NOT NULL,
    description         TEXT,
    status              report_status NOT NULL DEFAULT 'PENDING',
    admin_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 12. NOTIFICATIONS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(50) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    content             TEXT NOT NULL,
    reference_type      VARCHAR(30),
    reference_id        UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at             TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 13. MONETIZATION
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promotions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type                promotion_type NOT NULL,
    start_at            TIMESTAMPTZ NOT NULL,
    end_at              TIMESTAMPTZ NOT NULL,
    budget              NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
    amount              NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    status              promotion_status NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS banners (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(200) NOT NULL,
    image_url            TEXT NOT NULL,
    link_type            VARCHAR(30),
    link_id              UUID,
    position             VARCHAR(50) NOT NULL,
    start_at             TIMESTAMPTZ,
    end_at               TIMESTAMPTZ,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sort_order           INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

-- ------------------------------------------------------------
-- 14. ADMIN
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role                VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN','MODERATOR','SUPPORT','FINANCE','SUPER_ADMIN')),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id            UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action              VARCHAR(100) NOT NULL,
    target_type         VARCHAR(50),
    target_id           UUID,
    old_data            JSONB,
    new_data            JSONB,
    ip_address           INET,
    user_agent           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 15. INDEXES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_active ON user_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_verifications_user_status ON user_verifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status_sort ON categories(status, sort_order);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(province_id, district_id, ward_id);
CREATE INDEX IF NOT EXISTS idx_products_lat_lon ON products(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_product_images_product_sort ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute ON product_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chats_buyer ON chats(buyer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_seller ON chats(seller_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_created ON order_status_history(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_product_history_product_created ON product_status_history(product_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment_created ON shipment_tracking(shipment_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotions_product_status ON promotions(product_id, status);
CREATE INDEX IF NOT EXISTS idx_promotions_active_window ON promotions(status, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_banners_position_status ON banners(position, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created ON admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);

-- ------------------------------------------------------------
-- 16. UPDATED_AT TRIGGERS
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_devices_updated_at ON user_devices;
CREATE TRIGGER trg_user_devices_updated_at BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_verifications_updated_at ON user_verifications;
CREATE TRIGGER trg_user_verifications_updated_at BEFORE UPDATE ON user_verifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_attributes_updated_at ON attributes;
CREATE TRIGGER trg_attributes_updated_at BEFORE UPDATE ON attributes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_chats_updated_at ON chats;
CREATE TRIGGER trg_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON shipments;
CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON promotions;
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated_at ON banners;
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 17. PRODUCT / ORDER HISTORY TRIGGERS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_product_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO product_status_history(product_id, status, reason)
        VALUES (NEW.id, NEW.status,
                CASE WHEN TG_OP = 'UPDATE' THEN 'Status changed automatically/application-side' ELSE 'Initial status' END);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_status_history ON products;
CREATE TRIGGER trg_product_status_history
AFTER INSERT OR UPDATE OF status ON products
FOR EACH ROW EXECUTE FUNCTION log_product_status_change();

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR OLD.order_status IS DISTINCT FROM NEW.order_status THEN
        INSERT INTO order_status_history(order_id, status, note)
        VALUES (NEW.id, NEW.order_status,
                CASE WHEN TG_OP = 'UPDATE' THEN 'Status changed automatically/application-side' ELSE 'Initial status' END);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;
CREATE TRIGGER trg_order_status_history
AFTER INSERT OR UPDATE OF order_status ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ------------------------------------------------------------
-- 18. REVIEW / RATING AGGREGATION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    target UUID;
BEGIN
    target := COALESCE(NEW.reviewed_user_id, OLD.reviewed_user_id);

    UPDATE user_profiles p
    SET rating_avg = COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM reviews r
            WHERE r.reviewed_user_id = target
        ), 0),
        rating_count = (
            SELECT COUNT(*) FROM reviews r WHERE r.reviewed_user_id = target
        ),
        updated_at = NOW()
    WHERE p.user_id = target;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_user_rating ON reviews;
CREATE TRIGGER trg_refresh_user_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_user_rating();

-- ------------------------------------------------------------
-- 19. SAFETY / BUSINESS CONSTRAINT HELPERS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_negative_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity_available < 0 OR NEW.quantity_available > NEW.quantity THEN
        RAISE EXCEPTION 'quantity_available must be between 0 and quantity';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_stock_check ON products;
CREATE TRIGGER trg_product_stock_check
BEFORE INSERT OR UPDATE OF quantity, quantity_available ON products
FOR EACH ROW EXECUTE FUNCTION prevent_negative_product_stock();

-- ------------------------------------------------------------
-- 20. SEED CATEGORIES
-- ------------------------------------------------------------

INSERT INTO categories(name, slug, sort_order)
VALUES
('Điện thoại', 'dien-thoai', 1),
('Laptop', 'laptop', 2),
('Đồ gia dụng', 'do-gia-dung', 3),
('Thời trang', 'thoi-trang', 4),
('Xe cộ', 'xe-co', 5),
('Bất động sản', 'bat-dong-san', 6),
('Đồ chơi', 'do-choi', 7),
('Thể thao', 'the-thao', 8),
('Sách & Văn phòng phẩm', 'sach-van-phong-pham', 9),
('Mẹ & Bé', 'me-va-be', 10),
('Đồ điện tử', 'do-dien-tu', 11),
('Khác', 'khac', 12)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories(parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.sort_order
FROM categories c
CROSS JOIN (VALUES
    ('iPhone','iphone',1),
    ('Samsung','samsung',2),
    ('Xiaomi','xiaomi',3),
    ('OPPO','oppo',4)
) AS v(name,slug,sort_order)
WHERE c.slug = 'dien-thoai'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories(parent_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.sort_order
FROM categories c
CROSS JOIN (VALUES
    ('MacBook','macbook',1),
    ('Dell','dell',2),
    ('HP','hp',3),
    ('Lenovo','lenovo',4),
    ('ASUS','asus',5)
) AS v(name,slug,sort_order)
WHERE c.slug = 'laptop'
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- 21. SEED COMMON BRANDS
-- ------------------------------------------------------------

INSERT INTO brands(name, slug)
VALUES
('Apple','apple'),
('Samsung','samsung'),
('Xiaomi','xiaomi'),
('OPPO','oppo'),
('Sony','sony'),
('Canon','canon'),
('Nikon','nikon'),
('Dell','dell'),
('HP','hp'),
('Lenovo','lenovo'),
('ASUS','asus'),
('Nike','nike'),
('Adidas','adidas'),
('Honda','honda'),
('Yamaha','yamaha')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================================
-- NOTES
-- ============================================================
-- 1. province_id/district_id/ward_id intentionally remain BIGINT
--    so the application can connect to a Vietnam administrative
--    location dataset later.
--
-- 2. Images/videos/documents belong in object storage (S3-compatible);
--    PostgreSQL stores URLs/metadata.
--
-- 3. Product search at scale should use OpenSearch/Elasticsearch.
--
-- 4. Redis should handle OTP, cache, rate limiting, presence and queues.
--
-- 5. For stock reservation/order creation, use a DB transaction and
--    SELECT ... FOR UPDATE on the product row to prevent overselling.
--
-- 6. Do not store plaintext passwords, OTPs or sensitive identity data.
-- ============================================================
