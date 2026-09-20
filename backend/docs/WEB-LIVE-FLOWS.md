# Web: luồng kết nối backend và điều kiện phát hành

Cập nhật: 20/09/2026. Đây là một đợt hoàn thiện Web + API, **không phải chứng nhận sẵn sàng production của toàn bộ nền tảng**. Không build APK, không bật cổng thanh toán, không chạy migration hoặc seed trong đợt này.

## Đã triển khai

- `/account`: hồ sơ thật, sửa tên có kiểm tra đầu vào, tin đăng/ẩn/hiện, mở bản nháp để sửa, yêu thích, 50 thông báo gần nhất/đánh dấu đã đọc và bỏ chặn người dùng.
- `/messages`: hội thoại theo tài khoản, mở từ tin đăng, gửi/đọc lịch sử; cập nhật mỗi 5 giây khi tab đang hiển thị. Đây là polling, chưa phải WebSocket.
- `/products/:id`: chat, yêu thích, báo cáo và chặn người bán; chủ tin được dẫn đến trình sửa tin động.
- `/checkout/:id`: lấy báo giá từ backend, xác nhận giao nhận tự thỏa thuận/COD. Không quảng cáo phí vận chuyển hiện tại là báo giá của hãng giao hàng.
- `/orders`: tách đơn mua/bán, xem giá chốt, các bước xử lý theo vai trò, xác nhận trước thay đổi trạng thái hoặc ghi nhận đã thu COD.
- Yêu cầu Web bị từ chối do access token hết hạn được refresh một lần, gộp các lần refresh đồng thời. Không tự lặp lại mutation khi timeout/lỗi mạng. Logout/đổi tài khoản giữa lúc refresh không khôi phục tài khoản cũ.
- Đăng nhập quay lại trang đang thao tác, chặn URL chuyển hướng ra ngoài website.
- API yêu thích được sửa lỗi thiếu `@Injectable()` gây 500; giữ đúng kiểu giá/liên hệ và lọc người dùng bị chặn.
- Chat kiểm tra thành viên, giới hạn đầu vào/tần suất; lưu tin nhắn và con trỏ hội thoại cùng transaction. Lỗi push sau commit không báo gửi tin thất bại.
- Thực thi rate limit vốn chỉ được khai báo trên auth; bổ sung kiểm tra DTO hồ sơ/đơn hàng, từ chối phí do client tự gửi.

## Hợp đồng xác nhận giá

`GET /pricing/order-preview` trả thêm `quoteFingerprint`: SHA-256 của snapshot giá đã serialize thành chuỗi VND nguyên. Client gửi lại fingerprint, productId, quantity, note; không gửi các khoản phí hoặc seller payout.

`POST /orders` yêu cầu `Idempotency-Key` như trước. Nếu fingerprint khác báo giá mới tại thời điểm tạo đơn, trả 409 và rollback cả claim idempotency. Một key đã thành công luôn trả lại đơn cũ, không tính lại giá hay tạo thêm đơn. Request Web thử lại sau lỗi mạng giữ nguyên cả key và body.

Fingerprint chưa bắt buộc với Android/legacy để không phá tương thích. Cần nâng cấp màn hình xác nhận giá Android trước khi bắt buộc toàn bộ client. Fingerprint là cơ chế nhận biết thay đổi, không phải cam kết giữ giá hoặc token thanh toán.

## Kiểm chứng

Chạy từ từng thư mục tương ứng:

```powershell
# backend
npm run build
npm test -- --runInBand
node scripts/test-member-flows-db.cjs --dev
node scripts/test-member-flows-http.cjs --dev

# web
npm run test:ui
npm run build
```

HTTP test mặc định gọi localhost:3000, có thể đặt `MEMBER_TEST_PORT` cho API kiểm thử riêng. Script chỉ dùng tài khoản demo DEV; không ghi nội dung hoặc giao dịch. Không in token/secret.

PostgreSQL integration test tạo user/tin/đơn/hội thoại tạm **trong một transaction luôn rollback**, với savepoint cho mỗi transaction của service. Kiểm tra quyền đọc chat, chặn liên hệ/mua hàng, yêu thích, giá thay đổi, đặt trùng, giữ chỗ sản phẩm, quyền chuyển trạng thái, ledger COD cân bằng về 0 và chỉ ghi ví một lần. Firebase được thay bằng stub; không có push gửi ra ngoài. Đây là kiểm tra tuần tự trên PostgreSQL, không thay thế thử tải/concurrency nhiều kết nối.

Kết quả tự động đợt này: 75 backend unit tests, 21 Web tests; build cả hai thành công. PostgreSQL rollback integration và HTTP acceptance đều đã qua với backend mới chạy tạm ở cổng 3002. Chạy lại hai integration scripts sau khi cập nhật backend.

## Nạp bản mới ở localhost

Tiến trình `next start` và `node dist/main` đang chạy không tự nạp code/build mới. Cần dừng đúng terminal chạy backend/Web bằng Ctrl+C rồi chạy lại:

```powershell
# Terminal backend, C:\Projects\TatTanTat\backend
npm run start:prod

# Terminal web, C:\Projects\TatTanTat\web
npm run start
```

`start:prod` ở đây là tên lệnh chạy bản đã build, **không phải yêu cầu đổi NODE_ENV hoặc bật production payments**. Giữ cấu hình DEV hiện tại.

Trong phiên triển khai, Browser xác nhận cổng 3001 vẫn trả trang tài khoản mẫu cũ. Môi trường chặn khởi chạy Web kiểm thử bổ sung; vì vậy chưa xác nhận trực quan/đầu-cuối trên trình duyệt với bản Web mới. Không đánh dấu việc này là đã kiểm tra thành công. Sau restart cần thử đăng nhập, sửa/lưu lại tên, yêu thích, hội thoại giữa hai tài khoản demo, thông báo, mở tin sửa, và COD với **tin thử riêng**, không dùng đơn khách hàng thật.

## Chưa đủ điều kiện mở production

Các mục sau là công việc còn lại, không được che bằng dữ liệu giả:

1. **Phiên đăng nhập:** backend refresh còn stateless, logout chưa thu hồi refresh token; cần session lưu DB, hash token, rotation/reuse detection và kiểm tra tài khoản bị khóa trên access requests. Web hiện lưu token ở localStorage; cần chốt HttpOnly cookie/BFF, CSRF/CSP trước phát hành công khai.
2. **Đăng ký/OTP:** OTP production chưa có nhà cung cấp. Cần transaction đăng ký, expiry/attempt limit, resend và bắt buộc xác minh phù hợp; hiện login chưa ràng buộc xác minh số điện thoại. Không dùng OTP DEV để mở production.
3. **Thanh toán/vận chuyển:** chưa có checkout online, webhook chữ ký, đối soát tiền thực, địa chỉ nhận hàng có cấu trúc, báo giá/tạo/hủy vận đơn, webhook hãng vận chuyển. COD hiện là người bán tự xác nhận đã thu tiền; chưa phải bằng chứng thu hộ từ đối tác.
4. **Độ tin cậy thông báo:** cần transactional outbox, retry và giám sát lỗi provider. Web chưa đăng ký Web Push; thông báo trong app hiện đọc từ API.
5. **Android:** chưa thay đổi/build APK trong đợt này. Cần refresh session đồng bộ, nâng cấp fingerprint báo giá và kiểm thử thiết bị thật cho các luồng mới.
6. **Web còn lại:** đánh giá/hoàn tiền/ví-rút tiền, mua Đẩy tin/VIP/gói shop/quảng cáo và dashboard quản trị tài chính chưa được nối ở các trang mới này; backend có module nhưng vẫn cần kiểm tra đầu-cuối. Tin legacy không có form động được dẫn về quản lý, chưa có trình sửa legacy trên Web.
7. **Vận hành:** phân trang danh sách/lịch sử chat, kiểm thử nhiều tab/mất mạng/đồng thời, backup/restore DB, HTTPS/domain, monitoring, quản lý secret và cấu hình log, giới hạn upload/quét media/retention, xóa tài khoản và chính sách riêng tư.
8. **Bảo vệ database:** kết nối hiện dùng TLS nhưng chưa xác minh CA (`rejectUnauthorized: false`); cần CA phù hợp của dịch vụ và bật xác minh khi phát hành.

Khi tích hợp đối tác, cần tên nhà cung cấp, tài khoản merchant/carrier đã được duyệt, domain callback và thông tin sandbox. Secret chỉ điền vào biến môi trường/secret manager tại máy triển khai; không dán private key hay production token vào chat.
