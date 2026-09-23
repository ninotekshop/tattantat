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
  await pool.end();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
