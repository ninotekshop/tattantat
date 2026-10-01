// Chẩn đoán ảnh của tin đăng: node scripts/check-listing-media.cjs dolphin datbike
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const words = process.argv.slice(2).filter(a => !a.startsWith('--'));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
(async () => {
  const c = await pool.connect();
  try {
    const ps = (await c.query(`SELECT id,title,seller_id,status::text AS status FROM products WHERE ${words.map((_, i) => `title ILIKE $${i + 1}`).join(' OR ')}`, words.map(w => `%${w}%`))).rows;
    for (const p of ps) {
      console.log(`\n=== ${p.title} (${p.id}) [${p.status}]`);
      const imgs = (await c.query(`SELECT url,sort_order FROM product_images WHERE product_id=$1 ORDER BY sort_order`, [p.id])).rows;
      console.log(`product_images: ${imgs.length}`); imgs.forEach(i => console.log('  ', i.sort_order, i.url));
      const ls = (await c.query(`SELECT id,status::text AS status FROM listings WHERE product_id=$1`, [p.id])).rows;
      console.log(`listings còn tồn tại: ${ls.length}`, ls.map(l => l.id + ' ' + l.status).join(', '));
      const oldIds = [...new Set(imgs.map(i => (i.url.match(/listings\/([0-9a-f-]{36})\/media\//) || [])[1]).filter(Boolean))];
      for (const lid of ls.map(l => l.id).concat(oldIds.filter(x => !ls.find(l => l.id === x)))) {
        const rows = (await c.query(`SELECT id,storage_key FROM listing_images WHERE listing_id=$1`, [lid])).rows;
        console.log(`listing ${lid}: listing_images=${rows.length}`);
        const prefix = `${p.seller_id}/${lid}`;
        const { data, error } = await sb.storage.from('listing-media').list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });
        console.log(`  kho lưu trữ ${prefix}: ${error ? 'LỖI ' + error.message : (data || []).length + ' tệp'}`);
        (data || []).forEach(f => console.log('    ', f.name, f.created_at));
      }
    }
    if (!ps.length) console.log('Không tìm thấy tin.');
  } finally { c.release(); await pool.end(); }
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
