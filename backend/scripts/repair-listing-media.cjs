// Dựng lại đường dẫn ảnh cho tin bị mất bản ghi listing gốc nhưng tệp ảnh còn trong kho.
//   node scripts/repair-listing-media.cjs dolphin datbike           -> xem trước
//   node scripts/repair-listing-media.cjs dolphin datbike --apply   -> thực hiện
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const apply = process.argv.includes('--apply'), words = process.argv.slice(2).filter(a => !a.startsWith('--'));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS storage_key TEXT`);
    const ps = (await c.query(`SELECT id,title,seller_id FROM products WHERE ${words.map((_, i) => `title ILIKE $${i + 1}`).join(' OR ')}`, words.map(w => `%${w}%`))).rows;
    for (const p of ps) {
      const imgs = (await c.query(`SELECT url,sort_order FROM product_images WHERE product_id=$1 ORDER BY sort_order`, [p.id])).rows;
      const lid = imgs.map(i => (i.url.match(/listings\/([0-9a-f-]{36})\/media\//) || [])[1]).find(Boolean);
      if (!lid) { console.log(`- ${p.title}: ảnh không theo dạng cũ, bỏ qua.`); continue; }
      const prefix = `${p.seller_id}/${lid}`;
      const { data, error } = await sb.storage.from('listing-media').list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });
      if (error) { console.log(`- ${p.title}: lỗi kho lưu trữ ${error.message}`); continue; }
      const files = (data || []).filter(f => f.name);
      console.log(`- ${p.title}: ${imgs.length} ảnh trong DB, ${files.length} tệp trong kho`);
      if (files.length < imgs.length) { console.log('  ! Thiếu tệp, không sửa.'); continue; }
      if (!apply) { imgs.forEach((im, i) => console.log(`   ảnh ${i + 1} -> ${files[i].name}`)); continue; }
      await c.query('BEGIN');
      for (let i = 0; i < imgs.length; i++) {
        await c.query(`UPDATE product_images SET url=$3, storage_key=$4 WHERE product_id=$1 AND sort_order=$2`, [p.id, imgs[i].sort_order, `/api/v1/listings/product-media/${p.id}/${imgs[i].sort_order}`, `${prefix}/${files[i].name}`]);
      }
      await c.query('COMMIT');
      console.log('  Đã sửa.');
    }
    if (!apply) console.log('\n(Chưa sửa gì. Thêm --apply để thực hiện.)');
  } finally { c.release(); await pool.end(); }
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
