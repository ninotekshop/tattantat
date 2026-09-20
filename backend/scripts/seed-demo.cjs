require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const demoUsers = [
  { email: 'admin@tattantat.vn', fullName: 'Quản trị viên Demo', role: 'ADMIN' },
  { email: 'user@tattantat.vn', fullName: 'Người dùng Demo', role: 'USER' },
];

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash('Demo@123', 12);
      const inserted = await client.query(
        `INSERT INTO users (email, full_name, password_hash, role, email_verified)
         VALUES ($1, $2, $3, $4::user_role, TRUE)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, full_name`,
        [user.email, user.fullName, passwordHash, user.role],
      );
      if (inserted.rows[0]) {
        await client.query(
          'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
          [inserted.rows[0].id, inserted.rows[0].full_name],
        );
        console.log(`CREATED=${user.email}`);
      } else {
        console.log(`EXISTS=${user.email}`);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(`SEED_FAILED=${error.code ?? 'unknown'}`);
  process.exitCode = 1;
});
