# Hướng dẫn đẩy Tất Tần Tật lên Hostinger (Cloud/Business Node.js, giữ Supabase)

Ứng dụng chạy **một** Node.js App: `server.js` (gốc dự án) khởi động Next.js (web) và tự chạy NestJS (backend) ở cổng nội bộ 3009; web chuyển tiếp `/api/v1/*` sang backend. Dữ liệu và ảnh ở Supabase.

## A. Chuẩn bị trên máy của bạn
1. **Đổi mật khẩu CSDL và tạo lại khóa Supabase** (Project Settings → Database → Reset password; API → secret key mới). Các khóa cũ coi như đã lộ.
2. Tạo `backend/.env` từ `backend/.env.production.example` (điền đủ giá trị thật). Tạo khóa: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (chạy 3 lần cho `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BANK_ACCOUNT_ENCRYPTION_KEY`). **Không đặt `DEV_OTP_CODE`.**
3. Tạo `web/.env.production` từ `web/.env.production.example` (đặt `NEXT_PUBLIC_SITE_URL`).
4. Build: `npm run build` ở thư mục gốc.
5. Kiểm tra: `node scripts/preflight-hostinger.cjs` — phải ra "SẴN SÀNG".

## B. Cấu hình trên hPanel → Node.js
- Node.js **20.x**, mode **Production**, Application root `/`, Startup file **server.js**.
- Đưa code lên bằng Git (nhánh `main`) hoặc tải ZIP. **Không** đưa `.env`, `firebase-service-account.json`, `node_modules`.
- Thêm các biến môi trường trong hPanel (hoặc tạo `backend/.env` trên máy chủ bằng File Manager) giống mục A.
- Trên Terminal Hostinger: `npm install` rồi `npm run build`, sau đó **Restart**.
- Bật **SSL (HTTPS)** cho tên miền và bật chuyển hướng http → https.

## C. Kiểm tra sau khi lên
1. `https://TENMIEN/api/v1/health` trả 200.
2. Trang chủ tải được, đăng ký / đăng nhập bằng email, đăng tin có ảnh, mở tin vừa đăng.
3. Trang `https://TENMIEN/adminttt` đăng nhập admin.
4. Gắn `health` vào UptimeRobot (5 phút/lần), đặt `ALERT_WEBHOOK_URL` để nhận báo lỗi.
5. PayOS: khai báo webhook `https://TENMIEN/api/v1/payments/webhook/payos`.

## D. Lưu ý quan trọng
- **Đăng nhập bằng OTP SĐT bị tắt ở production** (vì trước đây chỉ có mã thử nghiệm cố định). Người dùng đăng nhập bằng email/mật khẩu hoặc tài khoản mạng xã hội. Muốn bật lại cần nối dịch vụ SMS thật trước.
- Không chạy `seed:demo`, `clear-admin-demo-listings` hay các script nạp/xóa dữ liệu trên CSDL chạy thật nếu chưa sao lưu.
- Supabase gói Free không đảm bảo sao lưu: nâng gói Pro hoặc chạy `scripts/backup-db.sh` hằng ngày.
- Nếu Hostinger báo 503 / "did not call listen()": xem `docs/HOSTINGER-FIX-503.md`.
- Chuyển hẳn sang PostgreSQL trên VPS (bỏ Supabase) là việc riêng, cần viết lại phần lưu ảnh.
