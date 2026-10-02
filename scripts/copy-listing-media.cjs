// Chép ảnh/video bucket "listing-media" từ Supabase CŨ sang Supabase MỚI.
// Cách dùng (PowerShell, trong thư mục backend):
//   $env:OLD_URL="https://brabreqaarmuowymfnkl.supabase.co"; $env:OLD_KEY="<secret key project cũ>"
//   $env:NEW_URL="https://tjncpwsnjfebiymftpnt.supabase.co"; $env:NEW_KEY="<secret key project mới>"
//   node ..\scripts\copy-listing-media.cjs
// Chỉ chép các file mà bảng listing_images/listing_videos (CSDL mới) đang tham chiếu. Không xóa gì.
const path = require('path');
const root = path.join(__dirname, '..', 'backend');
require(path.join(root, 'node_modules', 'dotenv')).config({ path: path.join(root, '.env'), quiet: true });
const { createClient } = require(path.join(root, 'node_modules', '@supabase/supabase-js'));
const { Client } = require(path.join(root, 'node_modules', 'pg'));
const { OLD_URL, OLD_KEY, NEW_URL, NEW_KEY } = process.env;
if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) { console.error('Thiếu OLD_URL / OLD_KEY / NEW_URL / NEW_KEY'); process.exit(1); }
for (const [k, v] of Object.entries({ OLD_KEY, NEW_KEY })) if (!/^[A-Za-z0-9._-]+$/.test(v)) { console.error(k + ' chưa đúng: bạn cần dán KHÓA THẬT (chuỗi sb_secret_... hoặc eyJ...), không phải chữ hướng dẫn trong dấu < >.'); process.exit(1); }
const opt = { auth: { persistSession: false, autoRefreshToken: false } };
const oldS = createClient(OLD_URL, OLD_KEY, opt), newS = createClient(NEW_URL, NEW_KEY, opt);
const BUCKET = 'listing-media';
(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  const keys = [];
  for (const t of ['listing_images', 'listing_videos'])
    keys.push(...(await db.query(`SELECT storage_key FROM ${t} WHERE storage_key NOT LIKE 'demo/%'`)).rows.map(r => r.storage_key));
  await db.end();
  const buckets = await newS.storage.listBuckets();
  if (!buckets.data?.some(b => b.name === BUCKET)) {
    const r = await newS.storage.createBucket(BUCKET, { public: false });
    console.log(r.error ? 'Không tạo được bucket: ' + r.error.message : 'Đã tạo bucket ' + BUCKET + ' (private)');
  }
  let ok = 0, skip = 0, miss = 0, fail = 0;
  for (const key of keys) {
    const exists = await newS.storage.from(BUCKET).createSignedUrl(key, 10);
    if (!exists.error) { skip++; continue; }
    const dl = await oldS.storage.from(BUCKET).download(key);
    if (dl.error) { miss++; console.log('KHÔNG CÓ ở project cũ:', key, '-', dl.error.message); continue; }
    const buf = Buffer.from(await dl.data.arrayBuffer());
    const up = await newS.storage.from(BUCKET).upload(key, buf, { contentType: dl.data.type || undefined, upsert: false });
    if (up.error) { fail++; console.log('LỖI tải lên:', key, '-', up.error.message); } else ok++;
  }
  console.log(`Xong. Tổng ${keys.length}: đã chép ${ok}, đã có sẵn ${skip}, không thấy ở project cũ ${miss}, lỗi ${fail}.`);
})().catch(e => { console.error(e.message); process.exit(1); });
