require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const hash = await bcrypt.hash('Demo@123', 10);
  const res = await pool.query(
    "UPDATE users SET role = 'SUPER_ADMIN', password_hash = $1 WHERE email = 'admin@tattantat.vn' RETURNING id, email, role",
    [hash]
  );
  console.log('Fixed admin user:', res.rows[0]);

  // Ensure banners columns exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE DEFAULT gen_random_uuid()::text,
      title VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      position VARCHAR(100) NOT NULL,
      target_url TEXT NOT NULL DEFAULT '/',
      expiry_date VARCHAR(50) NOT NULL DEFAULT '2026-12-31',
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_url TEXT DEFAULT '/';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(50) DEFAULT '2026-12-31';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
  `);

  const countBanners = await pool.query('SELECT count(*)::int FROM banners');
  if (countBanners.rows[0].count === 0) {
    await pool.query(`
      INSERT INTO banners (title, image_url, position, target_url, expiry_date, status)
      VALUES
        ('Banner Quảng cáo Trang chủ', '/assets/banner_right.png', 'Hero Banner (Trang chủ)', '/sell', '2026-12-31', 'ACTIVE'),
        ('Banner Khuyến mãi Trái', '/assets/banner_left.png', 'Floating Left Banner (Mép ngoài trái)', '/sell', '2026-12-31', 'ACTIVE'),
        ('Banner Khuyến mãi Phải', '/assets/banner_right.png', 'Floating Right Banner (Mép ngoài phải)', '/sell', '2026-12-31', 'ACTIVE')
    `);
    console.log('Seeded 3 initial active banners into banners table');
  }

  await pool.end();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
