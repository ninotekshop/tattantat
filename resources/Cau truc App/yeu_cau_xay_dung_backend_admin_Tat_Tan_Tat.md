# Yêu cầu xây dựng Backend/Admin cho ứng dụng Tất Tần Tật

## 1. Mục tiêu

Xây dựng hệ thống Backend/Admin tập trung để vận hành toàn bộ nền tảng
marketplace **Tất Tần Tật** theo mô hình mua bán C2C/B2C, dùng chung dữ
liệu cho:

-   Website Tất Tần Tật.
-   Ứng dụng Android/iOS.
-   Khu vực quản trị Backend/Admin.
-   Hệ thống người bán/người mua.
-   Hệ thống quảng cáo, thanh toán, đơn hàng và hỗ trợ.

Backend phải thiết kế theo hướng **API-first**, để Web và App sử dụng
chung một nguồn dữ liệu và cùng logic nghiệp vụ.

------------------------------------------------------------------------

## 2. Dashboard quản trị

Trang Tổng quan cần hiển thị:

### KPI chính

-   Tổng số tin đăng.
-   Tin đăng mới trong ngày/tháng.
-   Tin chờ duyệt.
-   Tin bị từ chối.
-   Tin vi phạm.
-   Tổng người dùng.
-   Người dùng mới.
-   Người bán đang hoạt động.
-   Người mua đang hoạt động.
-   Tổng đơn hàng.
-   Đơn hàng thành công.
-   Đơn đang xử lý.
-   Doanh thu.
-   Doanh thu ước tính từ nền tảng.
-   Doanh thu quảng cáo.
-   Số tiền giao dịch.

### Biểu đồ

-   Tin đăng theo ngày/tuần/tháng.
-   Người dùng mới.
-   Đơn hàng.
-   Doanh thu.
-   Tỷ lệ tin đăng theo danh mục.
-   Tỷ lệ người mua/người bán.
-   Hiệu quả quảng cáo.

### Hoạt động gần đây

-   Tin mới được đăng.
-   Tin vừa được duyệt.
-   Người dùng mới.
-   Đơn hàng mới.
-   Báo cáo vi phạm.
-   Thanh toán mới.
-   Người dùng bị khóa.
-   Hoạt động của Admin.

------------------------------------------------------------------------

# 3. Quản lý tin đăng

Đây là module trọng tâm của Admin.

## Chức năng

-   Danh sách tất cả tin đăng.
-   Tìm kiếm tin đăng.
-   Lọc theo danh mục.
-   Lọc theo người bán.
-   Lọc theo khu vực.
-   Lọc theo trạng thái.
-   Lọc theo thời gian.
-   Lọc tin nổi bật.
-   Lọc tin quảng cáo.
-   Xem chi tiết tin.
-   Chỉnh sửa tin.
-   Duyệt tin.
-   Từ chối tin.
-   Ẩn tin.
-   Khôi phục tin.
-   Xóa mềm.
-   Xóa vĩnh viễn theo quyền.
-   Đánh dấu tin nổi bật.
-   Đẩy tin.
-   Khóa tin.
-   Gắn nhãn vi phạm.
-   Xem lịch sử thay đổi.

## Trạng thái tin

-   `DRAFT`
-   `PENDING`
-   `APPROVED`
-   `REJECTED`
-   `HIDDEN`
-   `EXPIRED`
-   `SOLD`
-   `BLOCKED`
-   `DELETED`

## Moderation

Admin/Moderator có thể:

-   Xem nội dung.
-   Kiểm tra hình ảnh.
-   Kiểm tra giá.
-   Kiểm tra danh mục.
-   Kiểm tra thông tin liên hệ.
-   Kiểm tra nội dung vi phạm.
-   Gửi lý do từ chối.
-   Yêu cầu người bán chỉnh sửa.
-   Lưu lịch sử kiểm duyệt.

------------------------------------------------------------------------

# 4. Quản lý người dùng

## Người mua

-   Danh sách người mua.
-   Tìm kiếm.
-   Xem hồ sơ.
-   Lịch sử hoạt động.
-   Tin yêu thích.
-   Lịch sử mua.
-   Lịch sử liên hệ.
-   Trạng thái tài khoản.

## Người bán

-   Danh sách người bán.
-   Số tin đăng.
-   Tin đang hoạt động.
-   Tin đã bán.
-   Doanh thu.
-   Đánh giá.
-   Lịch sử vi phạm.
-   Trạng thái xác minh.

## Quản lý tài khoản

-   Khóa tài khoản.
-   Mở khóa.
-   Cảnh báo.
-   Xác minh tài khoản.
-   Xác minh số điện thoại/email.
-   Xóa mềm.
-   Xem lịch sử đăng nhập.
-   Xem lịch sử thao tác.

------------------------------------------------------------------------

# 5. Quản lý danh mục

Hỗ trợ danh mục nhiều cấp.

Ví dụ:

-   Đồ công nghệ
    -   Điện thoại
    -   Laptop
    -   Máy tính bảng
    -   Máy ảnh
-   Xe cộ
    -   Ô tô
    -   Xe máy
    -   Xe đạp
-   Nhà đất
    -   Nhà
    -   Căn hộ
    -   Đất
    -   Mặt bằng
-   Đồ gia dụng
-   Thời trang
-   Thể thao & giải trí
-   Sách & học tập
-   Máy móc & công cụ
-   Đồ sưu tầm
-   Thú cưng
-   Hàng hóa khác
-   Dịch vụ

## Chức năng

-   Thêm danh mục.
-   Sửa.
-   Xóa mềm.
-   Kéo thả sắp xếp.
-   Bật/tắt danh mục.
-   Thiết lập icon 3D.
-   Thiết lập ảnh đại diện.
-   Thiết lập thuộc tính riêng cho từng danh mục.
-   Thiết lập bộ lọc riêng cho từng danh mục.

------------------------------------------------------------------------

# 6. Quản lý đơn hàng

-   Danh sách đơn hàng.
-   Chi tiết đơn.
-   Người mua.
-   Người bán.
-   Sản phẩm.
-   Giá.
-   Phí.
-   Thanh toán.
-   Vận chuyển.
-   Trạng thái.
-   Lịch sử trạng thái.

## Trạng thái

-   `PENDING`
-   `CONFIRMED`
-   `PROCESSING`
-   `SHIPPING`
-   `DELIVERED`
-   `COMPLETED`
-   `CANCELLED`
-   `REFUNDED`

------------------------------------------------------------------------

# 7. Thanh toán & giao dịch

Theo dõi:

-   Giao dịch.
-   Phương thức thanh toán.
-   Số tiền.
-   Phí nền tảng.
-   Phí quảng cáo.
-   Phí đẩy tin.
-   Phí tin nổi bật.
-   Hoàn tiền.
-   Trạng thái giao dịch.

## Tài chính

Dashboard tài chính cần thống kê:

-   Tổng GMV.
-   Doanh thu nền tảng.
-   Doanh thu quảng cáo.
-   Doanh thu dịch vụ.
-   Phí giao dịch.
-   Khoản hoàn tiền.
-   Công nợ.
-   Đối soát.

------------------------------------------------------------------------

# 8. Quản lý quảng cáo

Module dành cho việc kiếm tiền từ nền tảng.

## Các loại quảng cáo

-   Banner trang chủ.
-   Banner danh mục.
-   Banner sidebar.
-   Tin nổi bật.
-   Tin ưu tiên.
-   Đẩy tin.
-   Quảng cáo theo khu vực.
-   Quảng cáo theo danh mục.

## Chức năng

-   Tạo chiến dịch.
-   Chọn vị trí.
-   Chọn danh mục.
-   Chọn khu vực.
-   Thiết lập ngân sách.
-   Thiết lập thời gian.
-   Duyệt quảng cáo.
-   Tạm dừng.
-   Kết thúc.
-   Theo dõi lượt hiển thị.
-   Lượt click.
-   CTR.
-   Doanh thu.

------------------------------------------------------------------------

# 9. Quản lý đánh giá

-   Đánh giá người bán.
-   Đánh giá sản phẩm.
-   Đánh giá giao dịch.
-   Điểm sao.
-   Nội dung đánh giá.
-   Báo cáo đánh giá.
-   Ẩn đánh giá vi phạm.
-   Khôi phục đánh giá.
-   Lịch sử xử lý.

------------------------------------------------------------------------

# 10. Báo cáo & thống kê

## Báo cáo người dùng

-   Người dùng mới.
-   Người dùng hoạt động.
-   Người bán.
-   Người mua.
-   Tài khoản bị khóa.

## Báo cáo tin đăng

-   Tin mới.
-   Tin được duyệt.
-   Tin bị từ chối.
-   Tin đã bán.
-   Tin hết hạn.
-   Tin vi phạm.

## Báo cáo doanh thu

-   GMV.
-   Doanh thu nền tảng.
-   Doanh thu quảng cáo.
-   Phí dịch vụ.
-   Doanh thu theo danh mục.
-   Doanh thu theo khu vực.

## Xuất dữ liệu

Hỗ trợ:

-   CSV.
-   Excel.
-   PDF.

------------------------------------------------------------------------

# 11. Quản lý báo cáo vi phạm

Người dùng có thể báo cáo:

-   Lừa đảo.
-   Hàng giả.
-   Hàng cấm.
-   Nội dung sai sự thật.
-   Giá bất thường.
-   Spam.
-   Nội dung không phù hợp.
-   Vi phạm bản quyền.

Admin có thể:

-   Xem báo cáo.
-   Xem tin liên quan.
-   Xem người bán.
-   Xem lịch sử vi phạm.
-   Xử lý.
-   Cảnh cáo.
-   Ẩn tin.
-   Khóa tin.
-   Khóa tài khoản.
-   Ghi chú xử lý.

------------------------------------------------------------------------

# 12. Quản lý nội dung hệ thống

-   Banner trang chủ.
-   Banner quảng cáo.
-   Nội dung giới thiệu.
-   Chính sách.
-   Điều khoản sử dụng.
-   Chính sách bảo mật.
-   Nội dung hỗ trợ.
-   FAQ.
-   Thông báo hệ thống.

------------------------------------------------------------------------

# 13. Quản lý Admin & phân quyền

Hỗ trợ nhiều vai trò:

  Vai trò         Quyền chính
  --------------- ------------------------
  `SUPER_ADMIN`   Toàn quyền
  `ADMIN`         Quản trị hệ thống
  `MODERATOR`     Kiểm duyệt tin
  `SUPPORT`       Hỗ trợ người dùng
  `FINANCE`       Thanh toán & tài chính

## Phân quyền

Thiết kế RBAC:

-   View.
-   Create.
-   Update.
-   Delete.
-   Approve.
-   Reject.
-   Export.
-   Manage.

Mọi thao tác quan trọng phải được ghi vào **Audit Log**.

------------------------------------------------------------------------

# 14. Cài đặt hệ thống

## Thiết lập chung

-   Tên website.
-   Logo.
-   Favicon.
-   Hotline.
-   Email.
-   Địa chỉ.
-   Mạng xã hội.

## Thiết lập marketplace

-   Phí đăng tin.
-   Phí giao dịch.
-   Phí đẩy tin.
-   Phí tin nổi bật.
-   Thời gian tin tồn tại.
-   Quy định số lượng tin.
-   Chính sách người bán.

## Thiết lập thông báo

-   Email.
-   SMS/OTP.
-   Push Notification.
-   Thông báo trong App.
-   Thông báo trong Web.

------------------------------------------------------------------------

# 15. Chat & liên hệ

Backend cần hỗ trợ:

-   Chat người mua/người bán.
-   Tin nhắn.
-   Hình ảnh.
-   Trạng thái đã đọc.
-   Chặn người dùng.
-   Báo cáo cuộc trò chuyện.
-   Lưu lịch sử.
-   WebSocket cho realtime.

------------------------------------------------------------------------

# 16. Cơ sở dữ liệu

Kiến trúc V1 dự kiến khoảng **32 bảng**, bao gồm các nhóm chính:

### Người dùng & quản trị

-   users
-   user_profiles
-   admin_users
-   admin_roles/permissions
-   admin_logs

### Danh mục & sản phẩm

-   categories
-   category_attributes
-   products
-   product_images
-   product_attributes
-   product_status_histories

### Đơn hàng & giao dịch

-   orders
-   order_items
-   order_status_histories
-   payments
-   payment_transactions
-   shipments

### Đánh giá & báo cáo

-   reviews
-   reports
-   moderation_actions

### Quảng cáo

-   advertisements
-   ad_campaigns
-   ad_transactions
-   banners

### Hệ thống

-   notifications
-   conversations
-   messages
-   favorites
-   settings
-   audit_logs

Các bảng còn lại có thể dành cho lịch sử, mở rộng nghiệp vụ và các tính
năng marketplace nâng cao.

------------------------------------------------------------------------

# 17. Yêu cầu kỹ thuật Backend

## Database

Sử dụng:

**PostgreSQL**

Yêu cầu:

-   Primary Key.
-   Foreign Key.
-   Unique Constraint.
-   Check Constraint.
-   Index.
-   Transaction.
-   Soft Delete.
-   Timestamp.
-   Status History.
-   Audit Log.

## Cache

Sử dụng:

**Redis**

Mục đích:

-   Cache danh mục.
-   Cache sản phẩm.
-   Session.
-   Rate limiting.
-   OTP.
-   Queue.
-   Realtime data.

## Search

Có thể tích hợp:

**OpenSearch/Elasticsearch**

Phục vụ:

-   Tìm kiếm sản phẩm.
-   Tìm kiếm người dùng.
-   Tìm kiếm tin đăng.
-   Bộ lọc nâng cao.
-   Full-text search.

## File Storage

Ảnh sản phẩm và tài liệu không nên lưu trực tiếp trong database.

Sử dụng Object Storage/CDN.

Ví dụ:

-   S3-compatible storage.
-   Cloud Object Storage.
-   CDN.

------------------------------------------------------------------------

# 18. API

Backend xây dựng REST API thống nhất cho Web và App.

Nhóm API:

``` text
/auth
/users
/categories
/products
/listings
/orders
/payments
/shipments
/reviews
/reports
/advertisements
/banners
/notifications
/chat
/admin
/settings
/statistics
```

API cần có:

-   Authentication.
-   Authorization.
-   JWT/session.
-   Refresh token.
-   Rate limiting.
-   Validation.
-   Pagination.
-   Sorting.
-   Filtering.
-   Search.
-   Error handling.
-   API versioning.

Ví dụ:

``` text
/api/v1/auth
/api/v1/products
/api/v1/categories
/api/v1/orders
/api/v1/admin/dashboard
```

------------------------------------------------------------------------

# 19. Đồng bộ Web và App

Web và App phải sử dụng chung:

-   Database.
-   API.
-   Authentication.
-   User account.
-   Product/listing data.
-   Category data.
-   Order data.
-   Chat.
-   Notification.
-   Payment.
-   Advertisement.

Không xây dựng database riêng cho App.

Khi sản phẩm được đăng trên App thì Web phải nhìn thấy ngay thông qua
API.

Khi Admin duyệt hoặc khóa tin trên Backend thì trạng thái phải được cập
nhật trên Web và App.

------------------------------------------------------------------------

# 20. Bảo mật

Yêu cầu tối thiểu:

-   HTTPS.
-   Password hashing.
-   JWT/refresh token.
-   RBAC.
-   Input validation.
-   SQL injection protection.
-   XSS protection.
-   CSRF protection.
-   Rate limiting.
-   Login protection.
-   OTP protection.
-   Audit Log.
-   Backup database.
-   Soft delete.
-   Phân quyền API.

Các API quản trị phải được bảo vệ riêng.

------------------------------------------------------------------------

# 21. Hiệu năng

Hệ thống phải được thiết kế để có thể mở rộng khi lượng người dùng tăng.

Cần hỗ trợ:

-   Database indexing.
-   Redis cache.
-   CDN.
-   Image optimization.
-   Lazy loading.
-   Pagination.
-   Background jobs.
-   Queue.
-   Database connection pooling.

Không trả về toàn bộ dữ liệu trong một API request.

------------------------------------------------------------------------

# 22. Kiến trúc đề xuất

``` text
                    ┌─────────────────┐
                    │   Web Frontend  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   REST API      │
                    │   Backend       │
                    └───────┬─────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
    ┌─────▼─────┐     ┌────▼────┐       ┌────▼─────┐
    │ PostgreSQL│     │  Redis  │       │ Search   │
    └───────────┘     └─────────┘       └──────────┘
          │
    ┌─────▼──────────┐
    │ Object Storage │
    └────────────────┘

                    ┌─────────────────┐
                    │ Android / iOS   │
                    └────────┬────────┘
                             │
                             └── dùng chung REST API
```

------------------------------------------------------------------------

# 23. Nguyên tắc UI Admin

Giao diện Backend nên giữ phong cách hiện đại, chuyên nghiệp và đồng bộ
với thương hiệu **Tất Tần Tật**.

## Sidebar

Các nhóm chính:

1.  Tổng quan
2.  Quản lý tin đăng
3.  Quản lý người dùng
4.  Quản lý danh mục
5.  Quản lý đơn hàng
6.  Thanh toán & Giao dịch
7.  Quảng cáo
8.  Báo cáo & Thống kê
9.  Cài đặt hệ thống

## Header

-   Search.
-   Thông báo.
-   Admin profile.
-   Vai trò.
-   Đăng xuất.

## Nội dung

-   KPI Cards.
-   Charts.
-   Tables.
-   Filters.
-   Modal.
-   Drawer.
-   Status badges.
-   Pagination.
-   Bulk actions.

------------------------------------------------------------------------

# 24. Quy trình vận hành tin đăng

``` text
Người bán
   ↓
Tạo tin
   ↓
PENDING
   ↓
Admin/Moderator kiểm duyệt
   ↓
┌───────────────┐
│               │
APPROVED      REJECTED
│               │
↓               ↓
Hiển thị        Người bán chỉnh sửa
Web/App         ↓
                Gửi duyệt lại
```

------------------------------------------------------------------------

# 25. Quy trình đơn hàng

``` text
Người mua
   ↓
Đặt hàng
   ↓
PENDING
   ↓
Người bán xác nhận
   ↓
PROCESSING
   ↓
SHIPPING
   ↓
DELIVERED
   ↓
COMPLETED
```

Có thể phát sinh:

``` text
CANCELLED
REFUNDED
```

------------------------------------------------------------------------

# 26. Yêu cầu mở rộng

Kiến trúc cần để sẵn khả năng mở rộng:

-   AI kiểm duyệt tin.
-   AI phát hiện spam.
-   AI phát hiện giá bất thường.
-   Gợi ý sản phẩm.
-   Tìm kiếm thông minh.
-   Recommendation Engine.
-   Phân tích hành vi.
-   Loyalty.
-   Voucher.
-   Membership.
-   Subscription.
-   Seller verification.
-   KYC.
-   Logistics integration.
-   Payment gateway integration.

Các tính năng này không bắt buộc triển khai toàn bộ ở V1 nhưng
database/API nên có khả năng mở rộng.

------------------------------------------------------------------------

# 27. Tiêu chí nghiệm thu

Backend được xem là đạt khi:

-   Admin đăng nhập được.
-   Phân quyền hoạt động chính xác.
-   Dashboard hiển thị dữ liệu.
-   CRUD tin đăng hoạt động.
-   Duyệt/từ chối tin hoạt động.
-   CRUD người dùng hoạt động.
-   CRUD danh mục hoạt động.
-   Quản lý đơn hàng hoạt động.
-   Thanh toán ghi nhận được.
-   Quảng cáo quản lý được.
-   Báo cáo vi phạm xử lý được.
-   Thống kê hoạt động.
-   Audit Log hoạt động.
-   Web và App dùng chung API.
-   API có validation và phân quyền.
-   Database có index/FK/constraint.
-   Có backup và logging.
-   Có khả năng mở rộng khi lượng dữ liệu tăng.

------------------------------------------------------------------------

# 28. Thứ tự triển khai đề xuất

## Giai đoạn 1 --- Core

-   Authentication.
-   Users.
-   Categories.
-   Listings/Products.
-   Images.
-   Moderation.
-   Admin Dashboard.

## Giai đoạn 2 --- Marketplace

-   Orders.
-   Payments.
-   Reviews.
-   Favorites.
-   Notifications.
-   Chat.

## Giai đoạn 3 --- Monetization

-   Featured listings.
-   Boost listing.
-   Advertisements.
-   Campaigns.
-   Transaction fees.
-   Financial reports.

## Giai đoạn 4 --- Advanced

-   Search engine.
-   Recommendation.
-   AI moderation.
-   Analytics.
-   KYC.
-   Logistics/payment integrations.

------------------------------------------------------------------------

# 29. Mục tiêu cuối cùng

Backend phải trở thành **trung tâm dữ liệu và vận hành duy nhất của Tất
Tần Tật**, bảo đảm:

**Một tài khoản → một dữ liệu → dùng chung Web + Android + iOS +
Admin.**

Mọi thay đổi quan trọng trên Backend phải được phản ánh đồng bộ trên
toàn bộ hệ thống.
