// Chuyển dữ liệu + ảnh từ dự án Supabase CŨ sang dự án MỚI.
// Cấu hình: backend/.env.migrate (xem .env.migrate.example).
//
//   node scripts/migrate-supabase.cjs check              Kiểm tra kết nối, công cụ, số liệu hai bên (không sửa gì)
//   node scripts/migrate-supabase.cjs db        --apply   Sao chép cơ sở dữ liệu (schema public) sang dự án mới
//   node scripts/migrate-supabase.cjs storage   --apply   Sao chép toàn bộ bucket + tệp ảnh/video sang dự án mới
//   node scripts/migrate-supabase.cjs rewrite   --apply   Đổi địa chỉ dự án cũ -> mới trong dữ liệu (nếu có URL tuyệt đối)
//   node scripts/migrate-supabase.cjs verify              So sánh số dòng từng bảng và số tệp từng bucket
// Không có --apply = chỉ xem trước. Dự án CŨ chỉ được ĐỌC, không bị sửa.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const envFile = path.join(__dirname, '..', '.env.migrate');
if (!fs.existsSync(envFile)) { console.error('Thiếu backend/.env.migrate (sao chép từ .env.migrate.example).'); process.exit(1); }
const E = {};
for (const l of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m) E[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
for (const k of ['OLD_DATABASE_URL', 'OLD_SUPABASE_URL', 'OLD_SUPABASE_SECRET_KEY', 'NEW_DATABASE_URL', 'NEW_SUPABASE_URL', 'NEW_SUPABASE_SECRET_KEY']) if (!E[k] || /MATKHAU|MA_DU_AN|REGION/.test(E[k])) { console.error(`backend/.env.migrate: chưa điền ${k}.`); process.exit(1); }
if (E.OLD_DATABASE_URL === E.NEW_DATABASE_URL) { console.error('OLD và NEW đang trùng nhau — dừng để tránh ghi đè.'); process.exit(1); }

const cmd = process.argv[2], apply = process.argv.includes('--apply'), force = process.argv.includes('--force');
const mkPool = (u) => new Pool({ connectionString: u, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000, max: 2 });
const oldSb = createClient(E.OLD_SUPABASE_URL, E.OLD_SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const newSb = createClient(E.NEW_SUPABASE_URL, E.NEW_SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const host = (u) => new URL(u).host;
const log = (...a) => console.log(...a);

// Tìm pg_dump/pg_restore: PATH, biến PG_BIN_DIR (trong .env.migrate), rồi các thư mục cài đặt phổ biến trên Windows.
const EXE = {};
function candidateDirs() {
  const dirs = [];
  if (E.PG_BIN_DIR) dirs.push(E.PG_BIN_DIR);
  for (const base of ['C:\\Program Files\\PostgreSQL', 'C:\\Program Files (x86)\\PostgreSQL']) {
    try { for (const v of fs.readdirSync(base).sort((a, b) => parseFloat(b) - parseFloat(a))) dirs.push(path.join(base, v, 'bin')); } catch { /* không có */ }
  }
  dirs.push('C:\\msys64\\ucrt64\\bin', 'C:\\msys64\\mingw64\\bin', 'C:\\msys64\\usr\\bin', '/ucrt64/bin', '/usr/bin');
  return dirs;
}
function tool(name) {
  const tries = [name, ...candidateDirs().flatMap(d => [path.join(d, name), path.join(d, name + '.exe')])];
  for (const t of tries) {
    const r = cp.spawnSync(t, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) { EXE[name] = t; return r.stdout.trim() + (t === name ? '' : `  [${t}]`); }
  }
  return null;
}

async function tableCounts(pool) {
  const t = (await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1`)).rows.map(r => r.tablename);
  const out = {};
  for (const n of t) out[n] = Number((await pool.query(`SELECT count(*) AS c FROM "public"."${n}"`)).rows[0].c);
  return out;
}

async function listAll(sb, bucket, prefix = '') {
  const files = [];
  const walk = async (p) => {
    for (let off = 0; ; off += 1000) {
      const { data, error } = await sb.storage.from(bucket).list(p, { limit: 1000, offset: off, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(`list ${bucket}/${p}: ${error.message}`);
      if (!data || !data.length) break;
      for (const it of data) {
        const full = p ? `${p}/${it.name}` : it.name;
        if (it.id === null || (!it.metadata && !it.id)) await walk(full); else files.push({ path: full, size: it.metadata && it.metadata.size, mime: it.metadata && it.metadata.mimetype });
      }
      if (data.length < 1000) break;
    }
  };
  await walk(prefix);
  return files;
}

async function check() {
  const o = mkPool(E.OLD_DATABASE_URL), n = mkPool(E.NEW_DATABASE_URL);
  try {
    log('Dự án cũ :', host(E.OLD_SUPABASE_URL), '| Dự án mới:', host(E.NEW_SUPABASE_URL));
    const ov = (await o.query('SHOW server_version')).rows[0].server_version, nv = (await n.query('SHOW server_version')).rows[0].server_version;
    log(`PostgreSQL: cũ ${ov}, mới ${nv}`);
    const oc = await tableCounts(o), nc = await tableCounts(n);
    log(`Bảng public: cũ ${Object.keys(oc).length}, mới ${Object.keys(nc).length}`);
    const rowsOld = Object.values(oc).reduce((a, b) => a + b, 0), rowsNew = Object.values(nc).reduce((a, b) => a + b, 0);
    log(`Tổng số dòng: cũ ${rowsOld}, mới ${rowsNew}${rowsNew ? '  (!) dự án mới đã có dữ liệu' : ''}`);
    const ext = (await o.query(`SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql')`)).rows.map(r => r.extname);
    log('Extension dự án cũ đang dùng:', ext.join(', ') || '(không)');
    const bs = (await oldSb.storage.listBuckets()).data || [];
    for (const b of bs) { const f = await listAll(oldSb, b.name); log(`Bucket cũ "${b.name}" (${b.public ? 'công khai' : 'riêng tư'}): ${f.length} tệp, ${(f.reduce((a, x) => a + (x.size || 0), 0) / 1048576).toFixed(1)} MB`); }
    const nb = (await newSb.storage.listBuckets()).data || [];
    log('Bucket dự án mới:', nb.map(b => b.name).join(', ') || '(chưa có)');
    for (const t of ['pg_dump', 'pg_restore']) { const v = tool(t); log(`${t}: ${v || 'KHÔNG CÓ — cài PostgreSQL client tools (bản >= ' + ov.split('.')[0] + ')'}`); }
  } finally { await o.end(); await n.end(); }
}

async function db() {
  const dv = tool('pg_dump'), rv = tool('pg_restore');
  if (!dv || !rv) { console.error('Cần pg_dump và pg_restore trong PATH (cài PostgreSQL, chỉ cần "Command Line Tools"). Nếu đã cài mà vẫn báo thiếu, thêm dòng PG_BIN_DIR=<thư mục chứa pg_dump.exe> vào backend/.env.migrate.'); process.exit(1); }
  const o = mkPool(E.OLD_DATABASE_URL), n = mkPool(E.NEW_DATABASE_URL);
  const dir = path.join(__dirname, '..', 'migrate-dump'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'public.dump');
  try {
    const exts = (await o.query(`SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql')`)).rows.map(r => r.extname);
    const nc = await tableCounts(n); const existing = Object.values(nc).reduce((a, b) => a + b, 0);
    log('Extension cần có ở dự án mới:', exts.join(', ') || '(không)');
    log(`Dự án mới hiện có ${Object.keys(nc).length} bảng, ${existing} dòng.`);
    if (!apply) { log('\n(Xem trước) Sẽ: tạo extension -> pg_dump schema public từ dự án cũ -> pg_restore vào dự án mới. Thêm --apply để thực hiện.'); return; }
    if (existing > 0 && !force) { console.error('Dự án mới đã có dữ liệu. Thêm --force nếu chắc chắn muốn ghi đè (các bảng trùng tên sẽ bị xóa và nạp lại).'); process.exit(1); }
    for (const x of exts) { try { await n.query(`CREATE EXTENSION IF NOT EXISTS "${x}"`); log('  extension OK:', x); } catch (e) { log(`  ! extension ${x}: ${e.message}`); } }
    log('\n[1/2] Đang xuất dữ liệu từ dự án cũ…');
    let r = cp.spawnSync(EXE.pg_dump || 'pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--schema=public', '--file', file, E.OLD_DATABASE_URL], { stdio: 'inherit' });
    if (r.status !== 0) { console.error('pg_dump lỗi. Nếu báo "version mismatch": cài pg_dump có phiên bản >= PostgreSQL của dự án cũ.'); process.exit(1); }
    log(`  Đã lưu ${(fs.statSync(file).size / 1048576).toFixed(1)} MB tại ${file}`);
    log('[2/2] Đang nạp vào dự án mới…');
    // Bỏ lệnh "CREATE SCHEMA public" (dự án mới đã có sẵn schema public) bằng danh sách mục lục.
    const listFile = path.join(dir, 'restore.list');
    const lst = cp.spawnSync(EXE.pg_restore || 'pg_restore', ['-l', file], { encoding: 'utf8', maxBuffer: 50e6 });
    if (lst.status !== 0) { console.error('Không đọc được mục lục của tệp xuất:', lst.stderr); process.exit(1); }
    fs.writeFileSync(listFile, lst.stdout.split(/\r?\n/).map(l => (/\sSCHEMA - public(\s|$)/.test(l) ? ';' + l : l)).join('\n'));
    r = cp.spawnSync(EXE.pg_restore || 'pg_restore', ['--no-owner', '--no-privileges', ...(existing > 0 ? ['--clean', '--if-exists'] : []), '--exit-on-error', '--use-list', listFile, '--dbname', E.NEW_DATABASE_URL, file], { stdio: 'inherit' });
    if (r.status !== 0) { console.error('pg_restore lỗi — xem thông báo phía trên. Dự án cũ không bị ảnh hưởng, có thể chạy lại với --force.'); process.exit(1); }
    log('\nXong phần cơ sở dữ liệu. Chạy "verify" để so sánh số dòng.');
  } finally { await o.end(); await n.end(); }
}

async function storage() {
  const buckets = (await oldSb.storage.listBuckets()).data || [];
  if (!buckets.length) { log('Dự án cũ không có bucket nào.'); return; }
  for (const b of buckets) {
    const files = await listAll(oldSb, b.name);
    log(`\nBucket "${b.name}" (${b.public ? 'công khai' : 'riêng tư'}): ${files.length} tệp`);
    if (!apply) continue;
    const have = ((await newSb.storage.listBuckets()).data || []).find(x => x.name === b.name);
    if (!have) {
      const { error } = await newSb.storage.createBucket(b.name, { public: !!b.public, fileSizeLimit: b.file_size_limit || undefined, allowedMimeTypes: b.allowed_mime_types || undefined });
      if (error) { console.error('  ! Không tạo được bucket:', error.message); continue; }
      log('  Đã tạo bucket mới.');
    }
    const existing = new Set((await listAll(newSb, b.name)).map(f => f.path));
    let done = 0, skipped = 0, failed = 0;
    for (const f of files) {
      if (existing.has(f.path)) { skipped++; continue; }
      try {
        const { data, error } = await oldSb.storage.from(b.name).download(f.path);
        if (error) throw new Error(error.message);
        const buf = Buffer.from(await data.arrayBuffer());
        const up = await newSb.storage.from(b.name).upload(f.path, buf, { contentType: f.mime || data.type || 'application/octet-stream', upsert: true });
        if (up.error) throw new Error(up.error.message);
        done++; if (done % 25 === 0) log(`  … ${done}/${files.length - skipped}`);
      } catch (e) { failed++; console.error(`  ! ${f.path}: ${e.message}`); }
    }
    log(`  Chép mới ${done}, đã có sẵn ${skipped}, lỗi ${failed}.`);
  }
  if (!apply) log('\n(Xem trước) Thêm --apply để sao chép. Có thể chạy lại nhiều lần — tệp đã có sẽ được bỏ qua.');
}

async function rewrite() {
  const oldH = host(E.OLD_SUPABASE_URL), newH = host(E.NEW_SUPABASE_URL), oldRef = oldH.split('.')[0], newRef = newH.split('.')[0];
  const n = mkPool(E.NEW_DATABASE_URL);
  try {
    const cols = (await n.query(`SELECT c.table_name, c.column_name, c.data_type FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE' WHERE c.table_schema='public' AND c.data_type IN ('text','character varying','jsonb','json')`)).rows;
    let total = 0;
    for (const c of cols) {
      const T = `"public"."${c.table_name}"`, C = `"${c.column_name}"`, txt = /json/.test(c.data_type) ? `${C}::text` : C;
      const cnt = Number((await n.query(`SELECT count(*) AS c FROM ${T} WHERE ${txt} LIKE $1`, [`%${oldRef}%`])).rows[0].c);
      if (!cnt) continue;
      total += cnt; log(`  ${c.table_name}.${c.column_name}: ${cnt} dòng chứa "${oldRef}"`);
      if (apply) {
        const expr = `replace(replace(${txt}, '${oldH}', '${newH}'), '${oldRef}', '${newRef}')`;
        const set = /json/.test(c.data_type) ? `${expr}::${c.data_type}` : expr;
        await n.query(`UPDATE ${T} SET ${C} = ${set} WHERE ${txt} LIKE $1`, [`%${oldRef}%`]);
      }
    }
    log(total ? (apply ? `\nĐã cập nhật ${total} giá trị.` : `\n(Xem trước) ${total} giá trị sẽ được đổi. Thêm --apply để thực hiện.`) : 'Không có dữ liệu nào chứa địa chỉ dự án cũ — không cần đổi.');
  } finally { await n.end(); }
}

async function verify() {
  const o = mkPool(E.OLD_DATABASE_URL), n = mkPool(E.NEW_DATABASE_URL);
  let bad = 0;
  try {
    const oc = await tableCounts(o), nc = await tableCounts(n);
    for (const t of Object.keys(oc)) { if (oc[t] !== (nc[t] ?? -1)) { bad++; log(`  ✗ bảng ${t}: cũ ${oc[t]} / mới ${nc[t] ?? 'thiếu'}`); } }
    log(bad ? `Có ${bad} bảng lệch số dòng.` : `✓ ${Object.keys(oc).length} bảng khớp số dòng.`);
    for (const b of (await oldSb.storage.listBuckets()).data || []) {
      const a = (await listAll(oldSb, b.name)).length, c = (await listAll(newSb, b.name).catch(() => [])).length;
      if (a !== c) { bad++; log(`  ✗ bucket ${b.name}: cũ ${a} tệp / mới ${c}`); } else log(`  ✓ bucket ${b.name}: ${a} tệp`);
    }
  } finally { await o.end(); await n.end(); }
  log(bad ? '\n=> CHƯA KHỚP' : '\n=> KHỚP — có thể đổi backend/.env sang dự án mới.'); process.exit(bad ? 1 : 0);
}

({ check, db, storage, rewrite, verify }[cmd] || (() => { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 11).join('\n')); process.exit(1); }))().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
