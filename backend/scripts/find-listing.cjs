// Tìm tin đăng theo từ khóa trong tiêu đề, kể cả tin đã bị gỡ; có thể khôi phục tin gỡ mềm.
//   node scripts/find-listing.cjs dolphin datbike            -> chỉ tìm và hiển thị
//   node scripts/find-listing.cjs dolphin datbike --restore  -> khôi phục (trạng thái ẨN) các tin tìm thấy đã bị gỡ mềm
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const args = process.argv.slice(2), restore = args.includes('--restore'), words = args.filter(a => !a.startsWith('--'));
if (!words.length) { console.log('Nhập từ khóa, ví dụ: node scripts/find-listing.cjs dolphin datbike'); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_by UUID`); await c.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_by_role TEXT`);
    const r = await c.query(`SELECT p.id, p.title, p.status::text AS status, p.deleted_at, p.deleted_reason, p.deleted_by_role, (SELECT full_name FROM users d WHERE d.id=p.deleted_by) AS deleted_by_name, u.email, u.full_name, p.created_at
      FROM products p LEFT JOIN users u ON u.id=p.seller_id
      WHERE ${words.map((_, i) => `p.title ILIKE $${i + 1}`).join(' OR ')} ORDER BY p.created_at DESC`, words.map(w => `%${w}%`));
    if (!r.rows.length) { console.log('Không còn tin nào khớp trong cơ sở dữ liệu (có thể đã bị xóa vĩnh viễn).'); return; }
    for (const x of r.rows) console.log(`- ${x.title}\n    id: ${x.id}\n    trạng thái: ${x.status}${x.deleted_at ? ' | ĐÃ GỠ lúc ' + x.deleted_at.toISOString() + ' (' + (x.deleted_reason || 'không rõ lý do') + ')' + (x.deleted_by_role ? ' | do ' + (x.deleted_by_role === 'ADMIN' ? 'quản trị viên' : 'người đăng') + (x.deleted_by_name ? ' ' + x.deleted_by_name : '') : '') : ''}\n    người đăng: ${x.full_name || ''} <${x.email || ''}>`);
    if (restore) {
      const ids = r.rows.filter(x => x.deleted_at).map(x => x.id);
      if (!ids.length) { console.log('\nKhông có tin nào đang ở trạng thái đã gỡ để khôi phục.'); return; }
      const u = await c.query(`UPDATE products SET deleted_at=NULL, status='HIDDEN', deleted_reason=NULL, updated_at=now() WHERE id = ANY($1::uuid[]) RETURNING title`, [ids]);
      console.log(`\nĐã khôi phục ${u.rowCount} tin (ở trạng thái ẨN — vào Quản trị > Quản lý tin đăng để bấm "Hiện lại"):`);
      u.rows.forEach(x => console.log('  ·', x.title));
    }
  } finally { c.release(); await pool.end(); }
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
