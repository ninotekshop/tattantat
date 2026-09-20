require('dotenv').config({ quiet: true });
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    const rule = await client.query(
      `INSERT INTO pricing_rules(code,kind,currency,status) VALUES('STANDARD_MARKETPLACE_FEE','PLATFORM_FEE','VND','ACTIVE')
       ON CONFLICT(code) DO UPDATE SET status='ACTIVE' RETURNING id`,
    );
    await client.query(
      `INSERT INTO pricing_versions(rule_id,rate_bps,fixed_amount,effective_from,reason)
       SELECT $1,0,0,NOW(),'BETA launch: 0% platform fee'
       WHERE NOT EXISTS (SELECT 1 FROM pricing_versions WHERE rule_id=$1)`,
      [rule.rows[0].id],
    );
    await client.query('COMMIT');
    console.log('PRICING_BETA_SEEDED');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { await client.end(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
