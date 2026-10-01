// Chép bộ quy tắc tin đăng dùng chung từ backend sang app (giữ validation giống hệt máy chủ).
const fs = require('fs'); const path = require('path');
const src = path.join(__dirname, '..', '..', 'backend', 'src', 'listings', 'listing-domain.ts');
const dst = path.join(__dirname, '..', 'src', 'lib', 'listing-domain.ts');
fs.writeFileSync(dst, '// TỰ ĐỘNG CHÉP từ backend/src/listings/listing-domain.ts — chạy `npm run sync-domain` để cập nhật.\n' + fs.readFileSync(src, 'utf8'));
console.log('Đã đồng bộ', dst);
