// Gửi thử 1 email để kiểm tra SMTP. Chạy trong thư mục backend:  node scripts/mail-test.cjs email-nhan@example.com
const fs = require('fs'), path = require('path');
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const nodemailer = require('nodemailer');
(async () => {
  const to = process.argv[2]; const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, MAIL_FROM: from } = process.env; const port = Number(process.env.SMTP_PORT || 587);
  if (!to) return console.error('Cách dùng: node scripts/mail-test.cjs email-nhan@example.com');
  if (!host || !from) return console.error('Thiếu SMTP_HOST / MAIL_FROM trong .env');
  const tx = nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass } : undefined });
  try { await tx.verify(); console.log('Kết nối SMTP OK'); const r = await tx.sendMail({ from, to, subject: 'Thử email Tất Tần Tật', text: 'Nếu bạn nhận được email này thì SMTP đã hoạt động.' }); console.log('Đã gửi:', r.messageId); }
  catch (e) { console.error('Lỗi SMTP:', e.message); }
})();
