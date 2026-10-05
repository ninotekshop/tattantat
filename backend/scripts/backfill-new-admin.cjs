// Cập nhật cột products.address của tin đang có sang dạng "Tên cũ (Tên mới mới)" theo bảng đối chiếu 2025.
// Chạy thử (không ghi):  node scripts/backfill-new-admin.cjs
// Ghi thật:             node scripts/backfill-new-admin.cjs --apply
// Cần biến môi trường DATABASE_URL (đã có trong .env của backend).
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch {}
const fs = require('fs');
const { Pool } = require('pg');
const M = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'web', 'public', 'data', 'vn-merge-map.json'), 'utf8'));
const W = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'web', 'lib', 'vn-admin-data.ts'), 'utf8').match(/VN_ADMIN: VnAdminRow\[\] = (\[.*\]);/s)[1]);
const core = s => s.trim().toLowerCase().replace(/^(tp\.|thành phố|tỉnh)\s+/, '');
const withNew = (o, n) => (!n || core(n) === core(o) ? o : `${o} (${n} mới)`);
const provByName = new Map(), distByName = new Map();
for (const [pc, , pn, ds] of W) { provByName.set(pn, pc); for (const [dc, dn] of ds) distByName.set(pn + '|' + dn, dc); }
const wardsByDistrict = new Map(Object.entries(M.w));

function convert(address) {
  if (!address || / mới\)/.test(address)) return null; // đã chuyển rồi
  const parts = address.split(',').map(s => s.trim()).filter(Boolean);
  const pi = parts.findIndex(p => provByName.has(p));
  if (pi < 0) return null;
  const prov = parts[pi], pc = provByName.get(prov);
  const out = parts.slice();
  out[pi] = withNew(prov, M.p[pc]?.[1]);
  // phường/xã nằm ngay trước huyện, huyện ngay trước tỉnh
  const di = pi - 1;
  if (di >= 0) {
    const dc = distByName.get(prov + '|' + parts[di]);
    if (dc && di - 1 >= 0) {
      const w = wardsByDistrict.get(dc)?.[parts[di - 1]];
      if (w) out[di - 1] = withNew(parts[di - 1], w[1]);
    }
  }
  const s = out.join(', ');
  return s === address ? null : s;
}

(async () => {
  const apply = process.argv.includes('--apply');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  const { rows } = await pool.query(`SELECT id, address FROM products WHERE address IS NOT NULL AND deleted_at IS NULL`);
  let changed = 0, skipped = 0; const samples = [], unmatched = [];
  for (const r of rows) {
    const next = convert(r.address);
    if (!next) { if (!/ mới\)/.test(r.address)) unmatched.push(r.address); skipped++; continue; }
    changed++; if (samples.length < 8) samples.push(`${r.address}\n   -> ${next}`);
    if (apply) await pool.query('UPDATE products SET address=$2 WHERE id=$1', [r.id, next]);
  }
  console.log(`${apply ? 'ĐÃ GHI' : 'CHẠY THỬ'}: ${changed} tin đổi, ${skipped} tin giữ nguyên / không khớp (tổng ${rows.length}).`);
  samples.forEach(s => console.log('•', s));
  if (unmatched.length) console.log('Không khớp (tối đa 10):', unmatched.slice(0, 10));
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
