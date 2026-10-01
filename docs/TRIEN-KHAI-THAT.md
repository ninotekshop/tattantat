# Triển khai Tất Tần Tật chạy thật — danh sách kiểm tra

## 1. Việc bắt buộc trước khi mở cho khách
1. **Đổi mật khẩu cơ sở dữ liệu và khóa Supabase.** Các phiên bản mã cũ từng lưu sẵn chuỗi kết nối và khóa trong mã nguồn; dù đã gỡ, hãy coi chúng là đã lộ:
   Supabase → Project Settings → Database → *Reset database password*; API → tạo lại *secret key*. Cập nhật `backend/.env`.
2. **Không đưa `backend/.env` và `firebase-service-account.json` lên git** (đã có trong `.gitignore`, kiểm tra lại bằng `git status`).
3. Đặt `NODE_ENV=production`, `PUBLIC_WEB_URL=https://<tên miền>`, `CORS_ORIGINS=https://<tên miền>` (backend) và `NEXT_PUBLIC_SITE_URL=https://<tên miền>` (web).
4. Thanh toán online: `PAYMENT_GATEWAY=payos` + `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`; khai báo webhook PayOS: `https://<tên miền>/api/v1/payments/webhook/payos`. Khi `NODE_ENV=production` mà chưa đặt `PAYMENT_GATEWAY`, thanh toán online tự tắt (an toàn).
5. SMS OTP: `SMS_WEBHOOK_URL` (+ `SMS_WEBHOOK_TOKEN`). Chưa cấu hình thì OTP chỉ hiện ở môi trường thử nghiệm, **production sẽ không gửi được mã** nên chưa xác minh SĐT được.
6. Email thông báo: `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`.
7. AI viết tin: `ANTHROPIC_API_KEY` (không có thì dùng bản mẫu).
8. Cài gói ảnh: `cd backend && npm install` (gói `sharp` nén/xoay ảnh, xóa GPS).
9. Tạo tài khoản admin và kiểm tra trang `/adminttt` (đăng nhập, quyền).

## 2. Giám sát
- `GET /api/v1/health` → 200 khi DB thông; gắn vào UptimeRobot/BetterStack, kiểm tra mỗi 1–5 phút.
- Lỗi 5xx được ghi log; đặt `ALERT_WEBHOOK_URL` (Slack/Discord webhook) để nhận cảnh báo tức thì (mỗi lỗi giống nhau báo tối đa 1 lần / 5 phút).
- Xem trang admin: *Thanh toán đảm bảo → Đối soát* mỗi ngày; mục nào "Nghiêm trọng" cần xử lý ngay.

## 3. Sao lưu
- Supabase gói Pro trở lên có sao lưu hằng ngày và PITR; gói Free **không đảm bảo** sao lưu — nếu chạy thật hãy nâng gói hoặc chạy `scripts/backup-db.sh` hằng ngày (cron/Task Scheduler) và chép ra nơi khác.
- Ảnh (bucket `product-images`, `listing-media`) và giấy tờ định danh (bucket riêng `identity-docs`) nằm ở Supabase Storage: bật sao lưu hoặc đồng bộ định kỳ.
- Thử khôi phục ít nhất 1 lần trước khi mở bán.

## 4. Tác vụ nền (chạy tự động trong backend, có khóa chống chạy trùng)
| Tác vụ | Chu kỳ | Tắt bằng |
|---|---|---|
| Nhắc tin chờ duyệt tồn đọng | theo cài đặt kiểm duyệt | tắt trong trang admin |
| Nhắc gói sắp hết hạn | 1 giờ | `BILLING_EXPIRY_REMINDER=false` |
| Escrow: hủy đơn quá hạn thanh toán, tự xác nhận nhận hàng, tự hoàn tiền | 5 phút | `ESCROW_JOBS=false` |
| Thông báo tìm kiếm đã lưu | 15 phút | `SAVED_SEARCH_JOB=false` |
Nếu chạy nhiều bản backend cùng lúc vẫn an toàn (dùng advisory lock).

## 5. Vận hành hoàn tiền
Đơn đã trả online mà bị hủy sẽ vào *Thanh toán đảm bảo → Cần hoàn tiền*. Admin chuyển tiền lại cho người mua qua cổng/ngân hàng rồi bấm "Đã hoàn" và ghi mã giao dịch.

## 6. Pháp lý (cần luật sư/kế toán xác nhận)
Đăng ký website TMĐT với Bộ Công Thương (nếu có chức năng đặt hàng), điều khoản dịch vụ, chính sách bảo mật (dữ liệu CCCD là dữ liệu cá nhân nhạy cảm — Nghị định 13/2023/NĐ-CP), chính sách hoàn tiền/khiếu nại, hợp đồng với đơn vị cổng thanh toán.
