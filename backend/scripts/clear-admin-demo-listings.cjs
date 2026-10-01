// Gỡ toàn bộ tin đăng Demo của tài khoản Quản trị viên (mềm: đặt deleted_at, có thể khôi phục).
//   node scripts/clear-admin-demo-listings.cjs            -> chỉ xem trước (không sửa gì)
//   node scripts/clear-admin-demo-listings.cjs --apply    -> thực hiện
//   node scripts/clear-admin-demo-listings.cjs --restore  -> khôi phục các tin đã gỡ bằng script này
//   node scripts/clear-admin-demo-listings.cjs --purge            -> xem trước việc XÓA VĨNH VIỄN các tin đã gỡ (dữ liệu + ảnh/video)
//   node scripts/clear-admin-demo-listings.cjs --purge --confirm  -> xóa vĩnh viễn, KHÔNG khôi phục được
// Bỏ qua tin đang có đơn hàng chưa kết thúc để không làm hỏng giao dịch.
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const apply = process.argv.includes('--apply'), restore = process.argv.includes('--restore'), purge = process.argv.includes('--purge'), confirm = process.argv.includes('--confirm');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
const ADMIN = `(u.role::text IN ('ADMIN','SUPER_ADMIN') OR u.email IN ('admin@tattantat.vn','catalog-demo@example.invalid') OR u.email ILIKE '%@example.invalid')`;
const OPEN_ORDER = `EXISTS (SELECT 1 FROM orders o WHERE o.product_id=p.id AND o.order_status::text IN ('PENDING','CONFIRMED','PREPARING','SHIPPING','DELIVERED','DISPUTED'))`;
const MARK = 'admin-demo-clear';


// ---------- Xóa vĩnh viễn ----------
const PROTECTED = new Set(['orders', 'order_items', 'order_status_history', 'payments', 'refunds', 'ledger_transactions', 'ledger_entries', 'wallet_transactions', 'seller_wallets', 'disputes']);
async function refsOf(c, table) {
  return (await c.query(`SELECT cl.relname AS child, a.attname AS col FROM pg_constraint k JOIN pg_class cl ON cl.oid=k.conrelid JOIN pg_class pt ON pt.oid=k.confrelid JOIN pg_namespace n ON n.oid=cl.relnamespace JOIN pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=k.conkey[1] WHERE k.contype='f' AND pt.relname=$1 AND n.nspname='public' AND array_length(k.conkey,1)=1`, [table])).rows;
}
/** Xóa các dòng con tham chiếu tới ids (đệ quy), rồi xóa chính bảng. Trả về số dòng theo bảng. */
async function cascade(c, table, col, ids, log, depth = 0) {
  if (!ids.length) return;
  if (depth > 6) throw new Error('Quan hệ dữ liệu quá sâu, dừng để an toàn.');
  const rows = (await c.query(`SELECT id FROM "${table}" WHERE "${col}" = ANY($1::uuid[])`, [ids])).rows.map(r => r.id);
  if (!rows.length) return;
  if (PROTECTED.has(table)) throw new Error(`Bảng tài chính/đơn hàng "${table}" có dữ liệu tham chiếu tới tin cần xóa — dừng để bảo vệ dữ liệu.`);
  for (const ref of await refsOf(c, table)) await cascade(c, ref.child, ref.col, rows, log, depth + 1);
  const r = await c.query(`DELETE FROM "${table}" WHERE id = ANY($1::uuid[])`, [rows]);
  log[table] = (log[table] || 0) + r.rowCount;
}
async function runPurge(c) {
  const t = await c.query(`SELECT p.id, p.title, ${OPEN_ORDER} AS busy, EXISTS (SELECT 1 FROM orders o WHERE o.product_id=p.id) AS has_order FROM products p JOIN users u ON u.id=p.seller_id WHERE p.deleted_reason=$1 AND ${ADMIN}`, [MARK]);
  const keep = t.rows.filter(r => r.has_order), go = t.rows.filter(r => !r.has_order);
  console.log(`Tin đã gỡ bằng script này: ${t.rows.length}; sẽ xóa vĩnh viễn: ${go.length}; giữ lại (có đơn hàng): ${keep.length}`);
  keep.forEach(r => console.log('  · giữ:', r.title));
  const pids = go.map(r => r.id);
  const listings = (await c.query(`SELECT id FROM listings WHERE product_id = ANY($1::uuid[])`, [pids])).rows.map(r => r.id);
  const keys = [];
  for (const tb of ['listing_images', 'listing_videos']) {
    try { keys.push(...(await c.query(`SELECT storage_key FROM ${tb} WHERE listing_id = ANY($1::uuid[])`, [listings])).rows.map(r => r.storage_key)); } catch { /* bảng không tồn tại */ }
  }
  console.log(`  Tin (listings): ${listings.length}; tệp ảnh/video trong kho lưu trữ: ${keys.length}`);
  if (!confirm) { console.log('\n(Chưa xóa gì. Thêm --confirm để xóa vĩnh viễn — KHÔNG khôi phục được.)'); return; }
  const log = {};
  await c.query('BEGIN');
  try {
    // Xóa dữ liệu phụ thuộc trước, rồi tới listings và products.
    await cascade(c, 'listings', 'product_id', pids, log).catch(e => { throw e; });
    for (const ref of await refsOf(c, 'products')) if (ref.child !== 'listings') await cascade(c, ref.child, ref.col, pids, log);
    const del = await c.query(`DELETE FROM products WHERE id = ANY($1::uuid[])`, [pids]);
    log.products = del.rowCount;
    await c.query('COMMIT');
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
  console.log('\nĐã xóa vĩnh viễn trong cơ sở dữ liệu:', log);
  if (keys.length && process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    const bucket = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } }).storage.from('listing-media');
    let removed = 0;
    for (let i = 0; i < keys.length; i += 100) { const { error } = await bucket.remove(keys.slice(i, i + 100)); if (error) console.log('  ! Lỗi xóa tệp:', error.message); else removed += Math.min(100, keys.length - i); }
    console.log(`Đã xóa ${removed}/${keys.length} tệp khỏi kho lưu trữ.`);
  } else if (keys.length) console.log('Chưa xóa tệp trong kho lưu trữ (thiếu SUPABASE_URL / SUPABASE_SECRET_KEY).');
}

(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_reason TEXT`);
    if (purge) { await runPurge(c); return; }
    if (restore) {
      const r = await c.query(`UPDATE products SET deleted_at=NULL, status='HIDDEN', deleted_reason=NULL, updated_at=now() WHERE deleted_reason=$1 RETURNING id`, [MARK]);
      console.log(`Đã khôi phục ${r.rowCount} tin (ở trạng thái ẨN, hãy duyệt lại nếu cần).`); return;
    }
    const target = await c.query(`SELECT p.id, p.title, p.status::text AS status, u.email, ${OPEN_ORDER} AS busy FROM products p JOIN users u ON u.id=p.seller_id WHERE p.deleted_at IS NULL AND ${ADMIN} ORDER BY u.email, p.created_at`);
    const rows = target.rows, busy = rows.filter(r => r.busy), free = rows.filter(r => !r.busy);
    const by = {}; for (const r of free) by[r.email] = (by[r.email] || 0) + 1;
    console.log(`Tin đăng của tài khoản quản trị/demo: ${rows.length}`);
    for (const [e, n] of Object.entries(by)) console.log(`  - ${e}: ${n} tin sẽ gỡ`);
    if (busy.length) { console.log(`  ! Bỏ qua ${busy.length} tin đang có đơn hàng chưa kết thúc:`); busy.forEach(r => console.log('     ·', r.title)); }
    console.log('Ví dụ:', free.slice(0, 5).map(r => r.title).join(' | '));
    if (!apply) { console.log('\n(Chưa thay đổi gì. Chạy lại với --apply để gỡ.)'); return; }
    await c.query('BEGIN');
    const ids = free.map(r => r.id);
    const r = await c.query(`UPDATE products SET deleted_at=now(), status='DELETED', deleted_reason=$2, updated_at=now() WHERE id = ANY($1::uuid[]) RETURNING id`, [ids, MARK]);
    await c.query('COMMIT');
    console.log(`\nĐã gỡ ${r.rowCount} tin. Khôi phục: node scripts/clear-admin-demo-listings.cjs --restore`);
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); console.error('Lỗi:', e.message); process.exitCode = 1; }
  finally { c.release(); await pool.end(); }
})();
