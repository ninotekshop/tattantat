# KỊCH BẢN KIỂM THỬ TỪNG BƯỚC – Tất Tần Tật

Mục tiêu: chạy thử toàn bộ tính năng mới trên môi trường thật. Đánh dấu [x] khi đạt. Nếu lỗi, ghi lại: **bước số, màn hình, thông báo lỗi, ảnh chụp** rồi gửi lại cho Claude.

## 0. Chuẩn bị (làm 1 lần)

1. Mở terminal ở `backend/`: `npm install` (cài `sharp` xử lý ảnh).
2. Trong `backend/.env` đặt tối thiểu:
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (đã xoay khóa mới)
   - `PAYMENT_GATEWAY=mock` (thử thanh toán giả lập, chưa cần PayOS)
   - `PUBLIC_WEB_URL=http://localhost:3001`
   - Không cần SMTP/SMS/ANTHROPIC_API_KEY để thử: hệ thống dùng chế độ giả lập (OTP hiện thẳng trên màn hình, AI viết bản nháp mẫu).
3. Khởi động lại backend (`npm run start:dev`) → tự tạo bảng mới. Kiểm tra log không có lỗi đỏ.
4. Khởi động web (`npm run dev` trong `web/`, cổng 3001).
5. Chuẩn bị 3 tài khoản: **Người bán (A)**, **Người mua (B)**, **Admin** (vào `/adminttt`). Nên dùng 2 trình duyệt/cửa sổ ẩn danh khác nhau.
6. Kiểm tra nhanh:
   - [ ] `http://localhost:3009/api/v1/health` trả ok
   - [ ] `http://localhost:3001/robots.txt` và `/sitemap.xml` hiển thị
   - [ ] `/manifest.webmanifest` có tên và icon

## 1. Đăng ký & xác minh danh tính (A)

1. Đăng ký tài khoản A, đăng nhập. [ ]
2. Vào Tài khoản → **Xác minh** (`/xac-minh`).
3. Nhập SĐT → "Gửi mã". Chế độ giả lập sẽ hiện mã `devCode` → nhập mã → xác nhận. Kỳ vọng: SĐT hiện "Đã xác minh". [ ]
4. Nhập mã OTP sai 5 lần → kỳ vọng: bị khóa tạm. [ ]
5. Tải ảnh CCCD mặt trước + sau + nhập số CCCD → gửi. Kỳ vọng: trạng thái "Chờ duyệt". [ ]
6. Admin: `/adminttt` → **Xác minh danh tính** → xem ảnh (link ký tạm) → Duyệt. [ ]
7. A tải lại trang: có huy hiệu "Đã xác minh". Kiểm tra CCCD không hiện số đầy đủ (chỉ 4 số cuối). [ ]

## 2. Đăng tin (A)

1. Đăng tin mới, chọn danh mục, bấm **AI viết giúp**. Kỳ vọng: điền tiêu đề/mô tả nháp; không chứa SĐT/link. [ ]
2. Tải ảnh (thử 1 ảnh ngang lớn > 3000px, ảnh chụp điện thoại có xoay). Kỳ vọng: ảnh hiển thị đúng chiều, tải nhanh. [ ]
3. Gửi đăng. Kỳ vọng: tin được duyệt hoặc vào hàng chờ duyệt theo chính sách. [ ]
4. Đăng lại tin cùng tiêu đề ngay. Kỳ vọng: bị đánh dấu trùng lặp/chờ duyệt. [ ]
5. Tài khoản A mới, chưa xác minh: đăng nhiều tin liên tiếp → kỳ vọng chạm giới hạn tài khoản mới (mặc định 5). [ ]
6. Nếu chưa được duyệt: Admin duyệt tin trong hàng chờ. [ ]

## 3. Tìm kiếm & tin đã lưu (B)

1. Trang chủ: gõ từ khóa có dấu/không dấu (vd "dien thoai"). Kỳ vọng: ra cả hai. [ ]
2. Lọc giá, tình trạng, khu vực, "người bán đã xác minh"; sắp xếp giá tăng/giảm; "Xem thêm". [ ]
3. Bấm **Lưu tìm kiếm** → vào Tài khoản → tab "Tìm kiếm đã lưu" thấy mục vừa lưu. [ ]
4. A đăng một tin mới khớp từ khóa. Admin: **Chạy tác vụ tự động ngay** (hoặc đợi ≤15 phút). Kỳ vọng: B nhận thông báo "tin mới phù hợp". [ ]
5. Mở `/bat-dong-san` và `/o-to`: dùng bộ lọc đặc thù (số phòng, diện tích, hãng xe, năm, số km…). Mở chi tiết tin: thấy công cụ phù hợp (tính khoản vay / so sánh giá thị trường). [ ]
6. Chi tiết sản phẩm: không còn nội dung bịa (bảo hành, địa điểm giả). [ ]

## 4. Chat & chống lừa đảo (B ↔ A)

1. B nhắn A: "xin số tài khoản chuyển khoản trước" → kỳ vọng: cảnh báo an toàn cho cả hai phía. [ ]
2. Gửi số điện thoại, link lạ, "gửi mã OTP" → mỗi loại hiện cảnh báo tương ứng. [ ]
3. Dùng câu trả lời nhanh (quick replies) của người bán. [ ]
4. Admin: **Rủi ro** → thấy tin nhắn bị gắn cờ và điểm rủi ro. [ ]

## 5. Đặt hàng + thanh toán được bảo vệ (B mua, A bán)

1. B mở tin của A → Mua → chọn **Thanh toán online (được bảo vệ)** → đặt. Kỳ vọng: chuyển tới `/thanh-toan/mock`. [ ]
2. Bấm "Thanh toán thành công" (giả lập). Kỳ vọng: về `/thanh-toan/ket-qua` báo đã thanh toán; đơn ở "Đã thanh toán – tiền được giữ". [ ]
3. Bấm lại thanh toán/tải lại kết quả → không bị trừ hai lần (idempotent). [ ]
4. A (Đơn bán): xác nhận → đang giao → đã giao. Kỳ vọng: A **không** có nút "Hoàn tất" với đơn online. [ ]
5. B (Đơn mua): bấm **Đã nhận hàng**. Kỳ vọng: đơn hoàn tất; ví A được cộng (trừ phí); sổ cái có bút toán. [ ]
6. Đơn COD: chạy 1 đơn COD, A hoàn tất bình thường, tiền ghi nhận đúng. [ ]

### 5b. Huỷ sau khi đã thanh toán
1. Đặt đơn online mới, thanh toán giả lập, rồi A huỷ đơn. Kỳ vọng: đơn CANCELLED, thanh toán "Đang xử lý hoàn tiền". [ ]
2. Admin: **Thanh toán đảm bảo → Cần hoàn tiền** thấy nhiệm vụ → hoàn thủ công ngoài hệ thống → bấm "Đã hoàn". Kỳ vọng: trạng thái sang REFUNDED, B nhận thông báo. [ ]

### 5c. Tác vụ tự động
1. Tạo đơn online nhưng không thanh toán → Admin "Chạy tác vụ tự động ngay" (đổi hạn trong cài đặt escrow xuống 1 phút để thử) → đơn hết hạn. [ ]
2. Đơn đã giao B không xác nhận → sau hạn tự xác nhận (thử bằng cài đặt hạn ngắn). Sau khi thử, **trả cài đặt về mặc định** (30 phút / 3 ngày / 5 ngày). [ ]

## 6. Khiếu nại

1. Với đơn đã giao, B bấm **Khiếu nại**, nêu lý do + ảnh. Kỳ vọng: tiền giữ lại, không tự xác nhận. [ ]
2. Admin: **Xử lý khiếu nại** → chọn hoàn tiền cho B hoặc trả cho A. Kỳ vọng: cả hai nhận thông báo; số dư/hoàn tiền đúng. [ ]

## 7. Đánh giá

1. Sau đơn hoàn tất, B đánh giá 1–5 sao + nhận xét. [ ]
2. Thử đánh giá lần 2 cùng đơn → bị chặn. Người không mua không đánh giá được. [ ]
3. Admin: **Duyệt đánh giá** → duyệt/ẩn. Điểm trung bình trên hồ sơ A cập nhật. [ ]

## 8. Thống kê & thông báo

1. A vào `/thong-ke`: lượt xem, liên hệ, đơn, doanh thu theo 7/30/90 ngày khớp với dữ liệu vừa tạo. [ ]
2. Tự xem tin của mình nhiều lần → không tăng lượt xem. [ ]
3. Tài khoản → tab **Thông báo**: tắt/bật từng nhóm (đơn hàng, tin nhắn…) × (đẩy/email). Kỳ vọng: lưu được, tải lại vẫn giữ. [ ]
4. (Tuỳ chọn, khi đã cấu hình SMTP) Đặt hàng → kiểm tra email; tối đa 10 email/giờ/người. [ ]

## 9. Kiểm tra pháp lý & an toàn

- [ ] `/terms`, `/privacy`, `/dispute-resolution` có mục thanh toán được bảo vệ, thời hạn khớp cài đặt escrow.
- [ ] Gọi API từ nguồn lạ (production) bị CORS chặn; header bảo mật có mặt.
- [ ] Gây lỗi 5xx cố ý (nếu đặt `ALERT_WEBHOOK_URL`) → nhận cảnh báo.

## 10. Trước khi chạy thật (production)

1. Đăng ký PayOS, đặt `PAYMENT_GATEWAY=payos`, `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`, trỏ webhook tới `/api/v1/payments/webhook/payos`, thử 1 giao dịch nhỏ thật.
2. Cấu hình SMS (`SMS_WEBHOOK_URL`), SMTP, `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `NEXT_PUBLIC_SITE_URL`.
3. Bảo đảm đã xoay mật khẩu DB/khóa Supabase; chạy `scripts/backup-db.sh` thử.
4. Nhờ luật sư rà soát điều khoản/chính sách.

## Mẫu báo lỗi gửi lại
```
Bước: 5.2
Màn hình: /thanh-toan/mock
Tài khoản: B
Kết quả thực tế: ...
Kỳ vọng: ...
Log backend (nếu có): ...
```
