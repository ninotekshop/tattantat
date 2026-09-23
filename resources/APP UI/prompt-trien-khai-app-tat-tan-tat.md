# PROMPT TRIỂN KHAI ỨNG DỤNG MOBILE TẤT TẦN TẬT

## Vai trò & mục tiêu
Bạn là Senior Mobile Architect + Senior Full-stack Engineer + UI/UX Engineer. Website **Tất Tần Tật** đã hoàn thiện và là hệ thống chính. Hãy audit codebase/API/database/auth/business logic của website trước, sau đó triển khai app **iOS + Android** theo giao diện ảnh tham chiếu.

**Quan trọng:** dùng **logo chính thức và brand assets đang dùng trên website**, không lấy logo minh họa trong mockup làm asset production nếu khác logo web. App phải là sản phẩm production dùng chung backend/database/API với website, không phải demo tĩnh.

## 1. Nguyên tắc bắt buộc
- Website là source of truth cho tài khoản, danh mục, tin đăng, ảnh, người bán, khu vực, yêu thích, tin nhắn, kiểm duyệt, trạng thái tin, quảng cáo và cấu hình.
- Không tạo database riêng cho app; không duplicate business logic nếu backend đã có.
- Kiểm tra API hiện tại trước khi tạo endpoint mới. Endpoint mới phải backward-compatible với web.
- Không hard-code danh mục, tỉnh/thành, banner, tin đăng, người bán, giá, API URL, secret hoặc OAuth credentials.
- Nội dung động phải lấy từ API/CMS/Admin/config.
- Nếu repo đã có mobile stack phù hợp thì tiếp tục dùng; nếu chưa có, chọn cross-platform stack phù hợp với hệ thống hiện tại và giải thích lựa chọn.

## 2. UI trang chủ theo ảnh tham chiếu
Bám sát bố cục:

```text
Header: Logo | Search nhanh | Yêu thích | Chuông + badge
Hero banner
Search chính | Khu vực | Tìm kiếm
Danh mục dạng grid
🔥 Sản phẩm nổi bật | Xem tất cả
Cards sản phẩm
Tin mới đăng | Xem tất cả
Cards tin mới
Bottom navigation:
Trang chủ | Quản lý tin | (+) Đăng tin | Liên hệ | Tài khoản
```

Phong cách: xanh thương hiệu + trắng + mint rất nhạt, sạch, hiện đại, bo góc mềm, shadow nhẹ, icon đồng nhất. Responsive cho phone/tablet và safe-area iOS/Android.

## 3. Logo & assets
Tìm asset chính thức trong source web: SVG/PNG/WebP, app icon, favicon, màu thương hiệu, typography, mascot, banner, category icons. Tái sử dụng file gốc chất lượng cao. Không screenshot/tự vẽ lại logo.

Chuẩn bị variants cho iOS App Icon, Android adaptive icon, splash và header.

## 4. Kiến trúc app
Tách rõ core/api/auth/config/storage/analytics/notifications và các feature: home, search, categories, listings, post, favorites, messages, notifications, profile, contact, settings. Tách UI, state, data/API và domain logic; không tạo component khổng lồ.

## 5. Splash & bootstrap
Splash logo chính thức → load remote config → restore session → load dữ liệu nền → Home. Không giữ splash lâu. Khi offline cho phép vào app với cache phù hợp và Retry.

## 6. Bottom Navigation
5 vị trí: **Trang chủ – Quản lý tin – Đăng tin – Liên hệ – Tài khoản**. Nút Đăng tin ở giữa dạng tròn, lớn hơn, icon `+`, xanh thương hiệu. Tab active/inactive rõ ràng. Không reset navigation stack không cần thiết.

## 7. Header
- Logo chính thức.
- Search nhanh: `Tìm sản phẩm, dịch vụ...` → Search Screen.
- Heart → Favorites; chưa login thì mở Auth.
- Bell → Notification Center; badge unread lấy từ API, không hard-code.

## 8. Hero Banner
Banner lấy từ API/CMS/Admin. Hỗ trợ image + deep link/URL/category/listing/campaign. Nếu nhiều banner: carousel/swipe/indicator/auto-slide hợp lý. Tối ưu kích thước ảnh và cache.

## 9. Search chính & Location
Search gồm keyword + location + category/filter nếu backend hỗ trợ. Location mặc định là lựa chọn gần nhất hoặc `Toàn quốc`; **không hard-code địa danh trong mockup**.

Location selector dạng bottom sheet: tìm tỉnh/thành, Toàn quốc, gần đây, danh sách tỉnh/thành/quận huyện theo dữ liệu web. Không xin GPS lúc mở app; chỉ xin permission khi user chủ động dùng `Gần tôi`.

## 10. Danh mục
Hiển thị grid như mockup. Lấy category ID/name/slug/icon/parent-child/order/status từ backend. Không hard-code danh mục mẫu nếu taxonomy production khác. Tap → Category Listing; có subcategory nếu backend có.

## 11. Sản phẩm nổi bật & Tin mới đăng
Hai section có `Xem tất cả`.

Card hỗ trợ: cover, badge, favorite, title, giá, giá cũ/discount nếu có, thương lượng, location, avatar/tên người bán, thời gian đăng. Không render field không có dữ liệu. Tap → Listing Detail. Favorite dùng optimistic UI nếu phù hợp và rollback khi lỗi.

Tin mới chỉ lấy tin published/đã duyệt/không ẩn-xóa. Dùng pagination/infinite scroll.

## 12. Listing Detail
Đồng bộ web: album swipe, indicator, tiêu đề, giá, thương lượng, location, thời gian, mô tả, thuộc tính theo category, seller, verification, report, favorite, share, tin tương tự.

**Áp dụng đúng quy tắc riêng tư của web:** nếu người mua không được xem số điện thoại/địa chỉ giao dịch của người bán và phải liên hệ qua Tất Tần Tật, app cũng tuyệt đối không được làm lộ dữ liệu đó. Server DTO/authorization phải loại bỏ field không được phép, không chỉ ẩn ở UI.

## 13. Đăng tin
Nút trung tâm: chưa login → Auth; đã login → flow:

```text
Chọn danh mục → Danh mục con → Thông tin cơ bản
→ Thuộc tính động → Giá → Khu vực → Ảnh
→ Mô tả → Xem trước → Gửi duyệt
```

Nếu web có dynamic form schema thì app dùng chung schema, không tạo logic form riêng.

Upload ảnh: camera/library, multi-select, reorder, delete, cover, resize/compress/orientation, progress/retry/cancel. Backend validate MIME, size, count, signature và security.

## 14. Kiểm duyệt & Quản lý tin
Submit → trạng thái chờ duyệt, không tự publish nếu web đang moderation.

Map status backend thực tế, ví dụ DRAFT/PENDING_REVIEW/PUBLISHED/REJECTED/HIDDEN/SOLD/EXPIRED. Tin bị từ chối phải hiển thị lý do và cho sửa/gửi lại.

Tab Quản lý tin có filter theo trạng thái và action phù hợp: xem, sửa, ẩn, đăng lại, đánh dấu đã bán/hoàn thành, xóa. Action nguy hiểm cần confirmation.

## 15. Search / Results / Filters
Search Screen: input, recent searches, autocomplete, category, location, filter, sort. Suggestions lấy API; recent có thể lưu local.

Results dùng pagination/cursor. Sort phải do backend thực hiện trên toàn dataset. Filter bottom sheet: category/subcategory, price, location, category attributes, thời gian và filter web hiện có; có `Đặt lại` và `Áp dụng`.

## 16. Favorites
Đồng bộ cùng tài khoản website. Add/remove/pagination/empty state. Chưa login → Auth.

## 17. Authentication
Dùng chung auth/account backend website. Hỗ trợ theo hệ thống đã triển khai: Email/password, Google, Facebook, Apple, Phone OTP, Forgot password, Email verification.

Social login dùng SDK/OAuth chính thức. Token/session lưu trong secure storage (iOS Keychain / Android secure storage/Keystore abstraction). Không lưu password/token trong storage không an toàn.

## 18. Tài khoản
Chưa login: logo + Đăng nhập/Đăng ký.

Đã login: avatar, tên, verification status và menu Hồ sơ, Tin đăng, Yêu thích, Tin nhắn, Thông báo, Cài đặt, Trợ giúp, Điều khoản, Chính sách bảo mật, Đăng xuất.

Profile chỉ cho sửa field backend cho phép; không cho client sửa role/moderation/admin state.

## 19. Tin nhắn / Liên hệ
Conversation gắn buyer + seller + listing. Chat screen có listing preview, avatar, tên, messages, timestamp, unread/send state. Dùng realtime hiện có (WebSocket/SSE/service); nếu chưa có thì thiết kế phù hợp, tránh polling dày.

Tab `Liên hệ` phải map theo nghiệp vụ web thực tế. Nếu là Messaging thì hiển thị hội thoại; nếu web tách hỗ trợ, có thể gồm Tin nhắn giao dịch, Hỗ trợ Tất Tần Tật, Báo cáo, FAQ. Không tự đổi business meaning.

## 20. Push & Notification Center
Push cho: tin được duyệt/từ chối/sắp hết hạn, tin nhắn mới, phản hồi, thay đổi tài khoản quan trọng, thông báo hệ thống. Tích hợp APNs/FCM hoặc notification stack hiện có.

Notification Center: unread badge, mark read/all, pagination, deep link đúng màn hình. Quản lý device token lifecycle. Không đưa nội dung nhạy cảm lên lock screen nếu user không cho phép.

## 21. Deep Links & Share
Universal Links iOS + App Links Android theo canonical URL thật của `tattantat.vn`. App đã cài → đúng màn hình; chưa cài → website. Share Listing dùng native share sheet với title + canonical URL.

## 22. Quảng cáo
Hỗ trợ banner/logo/sponsored card/campaign link từ backend/Admin. Không hard-code quảng cáo trong binary. Track impression/click theo chính sách bảo mật; phân biệt nội dung quảng cáo khi cần.

## 23. Report & Safety
Report tin/user: lừa đảo, hàng cấm, spam, sai danh mục, nội dung không phù hợp, lý do khác. Gửi moderation backend, chống spam report.

Server phải bảo vệ seller private info và authorization; không dựa vào frontend hide field.

## 24. Loading / Empty / Error / Offline
Mọi màn hình có skeleton/loading, empty, error, retry, offline khi phù hợp. Không màn hình trắng. Cache hợp lý home/categories/banner/recent listing/images; tránh cache stale private chat/account/moderation state nếu không có invalidation.

## 25. Performance
Startup nhanh, list scroll mượt, lazy image, thumbnails đúng kích thước, pagination, request dedup, cache hợp lý, tránh re-render toàn màn hình. Không tải ảnh full-res vào card nhỏ.

## 26. Responsive & Accessibility
Hỗ trợ phone nhỏ/lớn/tablet; tablet có thể tăng cột/split view. Safe Area cho notch/Dynamic Island/system bars.

Touch target phù hợp, screen reader labels, contrast, font scaling, form errors accessible. Kiến trúc theme sẵn sàng dark mode dù phase đầu chưa bắt buộc.

## 27. Security & Privacy
Bắt buộc HTTPS, secure token storage, backend authorization, rate-limit, validation, upload security, không log password/OTP/token, không hard-code secret, không nhúng admin secret.

Permission chỉ xin khi cần: Camera, Photos, Notifications, Location. Không xin hàng loạt ngay lần đầu mở app. Đồng bộ với Chính sách bảo mật Tất Tần Tật.

## 28. iOS
Chuẩn bị bundle identifier, icons, splash, URL schemes nếu cần, Universal Links, Sign in with Apple theo yêu cầu áp dụng, Push Notifications, privacy descriptions/manifest, signing/release config. Không commit certificate/private key.

## 29. Android
Chuẩn bị applicationId, adaptive icon, splash, App Links, FCM, permissions, release signing, R8/ProGuard nếu phù hợp và target SDK theo yêu cầu Play Store tại thời điểm build. Không commit keystore/password.

## 30. API Client & Environments
API layer tập trung: base URL theo environment, auth interceptor, refresh/session handling, timeout, normalized errors, controlled retry, cancellation.

Environments: development / staging / production. Production URL phải lấy theo backend thực tế sau audit, không tự bịa API path.

## 31. State / Pagination / Images / Formatters
Phân biệt server state, local UI state, auth state, persistent preferences. Không đưa mọi thứ vào global store.

Search/category/featured/latest/favorites/messages/notifications đều dùng pagination/cursor backend.

Images có placeholder/error/cache/thumbnail/aspect ratio ổn định.

Tiền tệ dùng formatter thống nhất, ví dụ `28.990.000đ`; trạng thái fixed/negotiable/free/contact map backend. Timestamp server chuẩn và format locale Việt Nam (`3 phút trước`, `2 giờ trước`...).

## 32. Analytics & Crash Reporting
Nếu hệ thống có analytics, track app_open, home_view, search, category_view, listing_view, favorite_add/remove, post_start/submit, message_start, ad_impression/click, login/register success, notification_open.

Không gửi password, OTP, token, nội dung chat hoặc PII không cần thiết. Crash logs cũng phải loại secret/token/PII.

## 33. Admin Compatibility & Remote Config
Thay đổi từ Admin web phải phản ánh lên app: category/icon/banner/moderation/user status/ads/config mà không cần release app mới.

Nếu phù hợp dùng config service hiện có hoặc `/app-config` cho maintenance, min/latest version, banners, feature flags, contact info, policy URLs. Không tạo endpoint mới nếu đã có cơ chế tương đương.

## 34. Chính sách & Hỗ trợ
App truy cập canonical content từ web: Điều khoản sử dụng, Chính sách bảo mật, Quy chế hoạt động, Hướng dẫn an toàn.

Thông tin hỗ trợ chính thức:
- Email: `hotro@tattantat.vn`
- Website: `https://www.tattantat.vn`
- Hotline: `090 199 2349`

## 35. Testing
Unit: formatter, validators, mapper, auth/listing state, pagination.

Integration: login/register, home, search, favorite, post, upload, messaging.

E2E critical flows:

```text
Open → Home → Search → Listing → Login → Favorite
```

```text
Login → Post → Upload → Submit → Pending review → Manage listing
```

```text
Buyer → Listing → Contact → Conversation → Message
```

Test slow/offline, 401/403/429/500, expired token, empty data, bad image và upload fail.

## 36. Acceptance Criteria
Chỉ coi hoàn thành khi:
1. Build iOS/Android thành công (trong phạm vi môi trường build cho phép).
2. Logo/brand chính thức giống web.
3. Home bám sát mockup.
4. Banner/categories/listings là dữ liệu backend.
5. Search/filter/location hoạt động.
6. Listing Detail đầy đủ.
7. Favorites đồng bộ web.
8. Auth dùng chung account web.
9. Post Listing dùng schema/business logic web.
10. Upload + moderation + Manage Listings hoạt động.
11. Messaging/contact hoạt động.
12. Không lộ seller private info.
13. Notification Center/push được tích hợp hoặc cấu hình sẵn đúng credentials.
14. Deep link hoạt động.
15. Ads từ backend/Admin.
16. Loading/error/empty/offline đầy đủ.
17. Secure storage đúng.
18. Không hard-code secret/database riêng.
19. Không phá website/API hiện tại.
20. Responsive/accessibility cơ bản đạt.
21. Critical tests pass.
22. Release build không có lỗi nghiêm trọng.

## 37. Quy trình bắt buộc cho Coding Agent
**Bước 1 – Audit:** báo cáo stack web/backend/database/ORM/auth/API/storage/realtime/notifications/admin/assets và mobile code hiện có.

**Bước 2 – Mapping:** tạo bảng `Chức năng app | API/web hiện có | Reuse? | Cần bổ sung`.

**Bước 3 – Architecture:** đề xuất kiến trúc mobile phù hợp repository.

**Bước 4 – Implementation:** Foundation → Auth → Navigation → Home → Search → Listing Detail → Favorites → Post Listing → Manage Listings → Messaging → Notifications → Profile → Ads → Deep Links → Production hardening.

**Bước 5 – Test:** lint, typecheck, unit/integration, Android build, iOS build nếu môi trường hỗ trợ. Không báo pass nếu chưa chạy.

**Bước 6 – Review:** tự review security, privacy, duplicate logic, race conditions, error handling, offline, UI consistency, performance rồi sửa lỗi phát hiện.

## 38. Bàn giao
Cung cấp:
- Architecture/framework và lý do.
- Danh sách file tạo/sửa.
- API reuse + API mới.
- Database migration nếu có.
- `.env.example` không secret.
- External setup: Apple/Google/Facebook/APNs/FCM/App Links/Universal Links.
- Hướng dẫn Android APK/AAB release.
- Hướng dẫn iOS Archive/TestFlight/App Store.
- Kết quả test/build thực tế.
- Danh sách phần đã hoàn thành, cần credentials, cần developer console, cần signing/certificate, cần production verification.

## Yêu cầu cuối cùng
Hãy triển khai **app production thực tế**, không tạo demo độc lập. Giao diện Home bám sát ảnh tham chiếu nhưng logo phải từ website, nội dung từ backend, category theo database, location theo hệ thống, sản phẩm/badge/quảng cáo là dữ liệu thật.

Nếu mockup khác business logic website, **ưu tiên business logic và dữ liệu website**, sau đó điều chỉnh UI để giữ trải nghiệm gần nhất với thiết kế.

Không tự bịa API, credentials, dữ liệu production hoặc trạng thái tích hợp. Sau khi hoàn thành phải chạy build/test, tự review critical flows và báo chính xác những gì thực sự hoạt động.
