// Kiểm tra trước khi đẩy lên Hostinger:  node scripts/preflight-hostinger.cjs
// Chỉ đọc, không in giá trị bí mật. Thoát mã 1 nếu còn lỗi nghiêm trọng.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const res = { fail: [], warn: [], ok: [] };
const F = (m) => res.fail.push(m), W = (m) => res.warn.push(m), O = (m) => res.ok.push(m);
function parseEnv(file) {
  const out = {}; if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
  return out;
}
const be = parseEnv(path.join(root, 'backend', '.env'));
if (!be) F('Thiếu backend/.env (sao chép từ backend/.env.production.example).');
else {
  const need = ['DATABASE_URL', 'SUPABASE_SECRET_KEY', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'BANK_ACCOUNT_ENCRYPTION_KEY', 'PUBLIC_WEB_URL', 'CORS_ORIGINS'];
  for (const k of need) if (!be[k]) F(`backend/.env thiếu ${k}`);
  if (be.NODE_ENV !== 'production') F('backend/.env: NODE_ENV phải là production.');
  for (const k of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) if (be[k] && (be[k].length < 32 || /replace|changeme|secret$/i.test(be[k]))) F(`${k} quá ngắn/yếu (cần ≥ 32 ký tự ngẫu nhiên).`);
  if (be.JWT_ACCESS_SECRET && be.JWT_ACCESS_SECRET === be.JWT_REFRESH_SECRET) F('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET đang trùng nhau.');
  if (be.PUBLIC_WEB_URL && !/^https:\/\//.test(be.PUBLIC_WEB_URL)) F('PUBLIC_WEB_URL phải bắt đầu bằng https://');
  if (be.CORS_ORIGINS && /localhost|127\.0\.0\.1/.test(be.CORS_ORIGINS)) W('CORS_ORIGINS còn chứa localhost.');
  if (be.DEV_OTP_CODE) F('Đang đặt DEV_OTP_CODE — xóa dòng này trên máy chủ thật (mã OTP cố định rất nguy hiểm).');
  if (be.DATABASE_URL && /YOUR|PASSWORD|MATKHAU|USER:/.test(be.DATABASE_URL)) F('DATABASE_URL còn là giá trị mẫu.');
  if (be.DATABASE_URL && /:6543\//.test(be.DATABASE_URL)) W('DATABASE_URL dùng cổng 6543 (transaction pooler) — ứng dụng nên dùng Session pooler cổng 5432.');
  if ((be.PAYMENT_GATEWAY || 'mock') === 'mock') W('PAYMENT_GATEWAY=mock — thanh toán online chưa thật (đặt payos + khóa PayOS).');
  else for (const k of ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY']) if (!be[k]) F(`Thiếu ${k} cho PayOS.`);
  if (!be.SMTP_HOST || !be.SMTP_PASS) W('Chưa cấu hình email SMTP (không gửi được email thông báo).');
  if (!be.SMS_WEBHOOK_URL) W('Chưa cấu hình SMS_WEBHOOK_URL — không gửi được OTP xác minh SĐT.');
  if (!be.ALERT_WEBHOOK_URL) W('Chưa có ALERT_WEBHOOK_URL để nhận cảnh báo lỗi.');
  if (!be.ANTHROPIC_API_KEY) W('Chưa có ANTHROPIC_API_KEY (AI viết tin sẽ dùng bản mẫu).');
  if (res.fail.length === 0) O('backend/.env: các biến bắt buộc đã đủ.');
}
const web = parseEnv(path.join(root, 'web', '.env.production')) || parseEnv(path.join(root, 'web', '.env.local')) || {};
if (!web.NEXT_PUBLIC_SITE_URL) W('web: chưa đặt NEXT_PUBLIC_SITE_URL (ảnh chia sẻ, sitemap sẽ trỏ về localhost).');
else if (!/^https:\/\//.test(web.NEXT_PUBLIC_SITE_URL)) F('NEXT_PUBLIC_SITE_URL phải bắt đầu bằng https://');
if (fs.existsSync(path.join(root, 'backend', 'dist', 'main.js'))) O('backend/dist/main.js có sẵn.'); else F('Chưa build backend (cd backend && npm run build).');
if (fs.existsSync(path.join(root, 'web', '.next'))) O('web/.next có sẵn.'); else F('Chưa build web (cd web && npm run build).');
if (!fs.existsSync(path.join(root, 'server.js'))) F('Thiếu server.js ở thư mục gốc.');
try {
  const tracked = cp.execSync('git ls-files', { cwd: root, encoding: 'utf8', maxBuffer: 50e6 }).split('\n');
  const bad = tracked.filter((f) => /(^|\/)\.env($|\.local|\.production$)|firebase-service-account|\.jks$|\.keystore$/.test(f));
  if (bad.length) F('Tệp bí mật đang được git theo dõi: ' + bad.join(', ')); else O('Không có tệp bí mật nào nằm trong git.');
} catch { W('Không kiểm tra được git.'); }
const show = (t, a) => a.length && console.log(`\n${t}\n` + a.map((x) => '  - ' + x).join('\n'));
show('LỖI (phải sửa trước khi đẩy lên):', res.fail); show('CẢNH BÁO (nên xử lý):', res.warn); show('ĐẠT:', res.ok);
console.log(res.fail.length ? `\n=> CHƯA SẴN SÀNG (${res.fail.length} lỗi)` : '\n=> SẴN SÀNG đẩy lên Hostinger.');
process.exit(res.fail.length ? 1 : 0);
