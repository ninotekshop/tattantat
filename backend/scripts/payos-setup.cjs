// Đăng ký URL webhook cho PayOS. Chạy: node scripts/payos-setup.cjs   (trong thư mục backend)
// Cần PUBLIC_WEB_URL là địa chỉ HTTPS công khai (không dùng localhost).
const fs = require('fs'), path = require('path');
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
(async () => {
  const { PAYOS_CLIENT_ID: id, PAYOS_API_KEY: key, PUBLIC_WEB_URL: web } = process.env;
  if (!id || !key) return console.error('Thiếu PAYOS_CLIENT_ID / PAYOS_API_KEY trong .env');
  if (!web || !/^https:\/\//.test(web)) return console.error('PUBLIC_WEB_URL phải là địa chỉ https công khai, hiện là: ' + web);
  const url = web.replace(/\/$/, '') + '/api/v1/payments/webhook/payos';
  const res = await fetch('https://api-merchant.payos.vn/confirm-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-client-id': id, 'x-api-key': key }, body: JSON.stringify({ webhookUrl: url }) });
  console.log(res.status, await res.text()); console.log('Webhook:', url);
})();
