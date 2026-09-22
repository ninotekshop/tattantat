# MASTER PROMPT --- TRIỂN KHAI TOÀN BỘ CHỨC NĂNG ADMIN TẤT TẦN TẬT

## Mục tiêu

Bạn là **Senior Full-stack Engineer + System Architect + Database
Engineer + Security Engineer**.

Hãy hoàn thiện **toàn bộ chức năng thực tế của trang Quản trị Tất Tần
Tật** dựa trên source code hiện tại.

-   Website: `www.tattantat.vn`
-   Admin: `/admin`
-   Giao diện Admin đã thiết kế xong.
-   **Không redesign giao diện nếu không cần thiết.**
-   Mục tiêu là biến toàn bộ Admin UI thành hệ thống quản trị thật, kết
    nối **Database + API + Authentication + Authorization + Business
    Logic + Audit + Validation + Testing**.

------------------------------------------------------------------------

# 1. Nguyên tắc triển khai

Trước khi code phải audit toàn bộ project để xác định:

-   Frontend framework
-   Backend framework
-   Database
-   ORM
-   Authentication
-   Authorization
-   API architecture
-   File/image storage
-   Notification/email
-   Payment
-   Logging
-   Admin APIs hiện có
-   User APIs hiện có
-   Database schema
-   Roles/permissions
-   Validation/middleware
-   Mock/demo data

Không tự đoán stack. Không thay framework/ORM/database/authentication
nếu không thật sự cần. Không tạo backend thứ hai song song.

------------------------------------------------------------------------

# 2. Loại bỏ mock data

Tìm và thay toàn bộ dữ liệu hard-code/demo trên Admin bằng dữ liệu thật.

Ví dụ các số hiện có như:

-   12.458 tin đăng
-   3.892 người dùng
-   1.245 đơn hàng
-   468.750.000đ doanh thu
-   18 tin chờ duyệt
-   5 báo cáo vi phạm
-   3 giao dịch lỗi
-   7 tài khoản cần xác minh

Tất cả KPI, badge, chart, notification, recent activity, revenue và
table phải lấy từ API/database thật.

------------------------------------------------------------------------

# 3. Admin Authentication & Authorization

Bảo vệ:

-   `/admin`
-   `/admin/*`
-   toàn bộ Admin API

User chưa đăng nhập → login.

User không có quyền → 403/redirect phù hợp.

Không chỉ kiểm tra permission ở frontend. Backend bắt buộc
authorization.

------------------------------------------------------------------------

# 4. RBAC

Kiểm tra role system hiện tại. Nếu có thì mở rộng; nếu chưa có thì triển
khai phù hợp kiến trúc.

Role đề xuất:

-   `SUPER_ADMIN`
-   `ADMIN`
-   `MODERATOR`
-   `SUPPORT`

Permission granular có thể gồm:

``` text
posts.view
posts.approve
posts.reject
posts.hide
posts.delete

users.view
users.update
users.suspend
users.verify

categories.manage

orders.view
orders.update

transactions.view

banners.manage
ads.manage

reports.view
reports.resolve

analytics.view

settings.manage
roles.manage
audit.view
```

Không hard-code permission rải rác trong component.

------------------------------------------------------------------------

# 5. Dashboard

Hoàn thiện Dashboard bằng dữ liệu thật:

-   Tổng tin đăng hoạt động
-   Người dùng mới
-   Đơn hàng hoàn thành
-   Doanh thu
-   Tin chờ duyệt
-   Báo cáo chưa xử lý
-   Giao dịch lỗi
-   Tài khoản cần xác minh

Hỗ trợ:

-   Hôm nay
-   7 ngày
-   30 ngày
-   Custom date range

Các % tăng/giảm phải tính từ current period và previous period, không
hard-code.

Xử lý `previousPeriod = 0` để không có Infinity/NaN.

------------------------------------------------------------------------

# 6. Dashboard Charts

Biểu đồ hoạt động dùng dữ liệu thật:

-   Tin đăng
-   Người dùng
-   Đơn hàng

Hỗ trợ 7 ngày, 30 ngày, 12 tháng và custom range.

Backend aggregate theo ngày/tháng thay vì gửi toàn bộ record về
frontend.

Donut chart "Tỷ lệ tin đăng theo danh mục" query theo category và trả
về:

``` text
categoryId
categoryName
count
percentage
```

Nếu quá nhiều category: Top N + Others.

------------------------------------------------------------------------

# 7. "Cần xử lý ngay"

Kết nối badge với dữ liệu thật:

-   Tin chờ duyệt
-   Báo cáo vi phạm
-   Giao dịch lỗi
-   Tài khoản cần xác minh

Click phải mở đúng module và filter:

``` text
/admin/posts?status=pending
/admin/reports?status=pending
/admin/transactions?status=failed
/admin/users?verification=pending
```

------------------------------------------------------------------------

# 8. Quản lý tin đăng

Hoàn thiện module `/admin/posts` hoặc route tương ứng:

-   List
-   Search
-   Filter
-   Sort
-   Server-side pagination
-   View detail
-   Approve
-   Reject
-   Hide
-   Restore
-   Delete nếu business rule cho phép
-   Bulk action phù hợp

Search theo ID, tiêu đề, người đăng, category và phone nếu role có
quyền.

Filter theo:

-   Status
-   Category
-   Location
-   Date
-   Seller
-   Verified
-   Featured

Có Reset Filters và ưu tiên đồng bộ filter với URL query params.

------------------------------------------------------------------------

# 9. Duyệt / từ chối tin

Approve cần cập nhật dữ liệu tương đương:

``` text
status = APPROVED
approvedBy
approvedAt
```

Sau thành công:

-   refresh/revalidate
-   toast
-   audit log
-   notification cho người đăng nếu hệ thống hỗ trợ

Reject phải có modal nhập lý do:

-   Nội dung không phù hợp
-   Sai danh mục
-   Sản phẩm bị cấm
-   Spam
-   Thông tin thiếu
-   Khác

Lưu `rejectedBy`, `rejectedAt`, `rejectionReason` hoặc field tương
đương.

Bulk destructive action phải có confirmation.

------------------------------------------------------------------------

# 10. Quản lý người dùng

Module `/admin/users`.

Hiển thị phù hợp với permission:

-   Avatar
-   Name
-   Email
-   Phone
-   Joined date
-   Number of posts
-   Orders
-   Verification
-   Status
-   Last activity nếu có

Search theo User ID, Name, Email, Phone.

Actions nếu business logic hỗ trợ:

-   View profile
-   View posts
-   Verify
-   Suspend / Unsuspend
-   Ban / Unban

Suspend/Ban bắt buộc lý do và audit log.

Nếu verification có:

``` text
PENDING
VERIFIED
REJECTED
```

thì Admin có Review/Approve/Reject.

Không expose tài liệu xác minh cho role không được phép.

------------------------------------------------------------------------

# 11. Quản lý danh mục

Module `/admin/categories`.

Danh mục hiện tại:

-   Nhà đất
-   Xe cộ
-   Đồ công nghệ
-   Việc làm
-   Thực phẩm
-   Tặng miễn phí
-   Đồ gia dụng
-   Thời trang
-   Nhạc cụ
-   Thú cưng
-   Sách & học tập
-   Dịch vụ
-   Hàng hóa khác

Nếu database đã quản lý category thì không hard-code danh sách trong
Admin.

Hỗ trợ:

-   Create
-   Edit
-   Enable/Disable
-   Sort
-   Archive
-   Delete chỉ khi an toàn
-   Subcategory nếu schema hỗ trợ

Fields tùy schema:

``` text
name
slug
icon
description
order
status
parentId
```

Cho upload/preview/replace icon; validate MIME, size, dimensions và dùng
storage hiện tại.

------------------------------------------------------------------------

# 12. Quản lý đơn hàng

Module `/admin/orders`.

Hỗ trợ:

-   Search mã đơn
-   Filter status/date/payment
-   View detail
-   Update status nếu business rules cho phép
-   Pagination

Order detail:

-   Order ID
-   Buyer
-   Seller
-   Products
-   Quantity
-   Price
-   Total
-   Payment
-   Timeline
-   Created time

Không tự phát minh state machine. Dùng status hiện tại và validate
transition.

------------------------------------------------------------------------

# 13. Quản lý Banner

Hoàn thiện module Banner:

-   Create
-   Edit
-   Archive/Delete phù hợp
-   Enable/Disable
-   Schedule
-   Priority
-   Placement

Fields có thể gồm:

``` text
title
image
mobileImage
targetUrl
position
startAt
endAt
status
priority
```

Validate upload JPEG/PNG/WebP, MIME, size, dimensions.

Có preview desktop/mobile.

Không cho executable giả dạng ảnh.

Hỗ trợ scheduling với timezone nhất quán.

------------------------------------------------------------------------

# 14. Quảng cáo

Module `/admin/ads`.

Nếu hệ thống có quảng cáo, quản lý:

-   Campaign
-   Advertiser
-   Placement
-   Creative
-   Target URL
-   Start/end date
-   Status

Nếu backend có tracking:

-   Impressions
-   Clicks
-   CTR

Không tạo fake analytics.

------------------------------------------------------------------------

# 15. Thanh toán & Giao dịch

Module `/admin/transactions`.

Hiển thị:

``` text
transactionId
orderId
user
amount
provider
status
createdAt
```

Search + Filter + Pagination.

Dùng payment status thật, ví dụ:

``` text
PENDING
SUCCESS
FAILED
REFUNDED
```

Không cho Admin tự chuyển FAILED → SUCCESS nếu payment provider chưa xác
nhận.

Không lưu/log:

-   CVV
-   full card number
-   secret key
-   access token

Webhook phải verify signature nếu provider hỗ trợ.

------------------------------------------------------------------------

# 16. Báo cáo vi phạm / Moderation

Module `/admin/reports`.

Report có thể liên quan:

-   Tin đăng
-   User
-   Spam
-   Fraud
-   Prohibited content
-   Khác

Workflow:

``` text
PENDING
REVIEWING
RESOLVED
DISMISSED
```

Admin có:

-   Review
-   Resolve
-   Dismiss
-   Internal note

Report detail:

-   Reporter
-   Target
-   Reason
-   Description
-   Created date
-   Related post
-   Seller
-   Previous reports nếu role được phép

Actions như Hide Post / Warn User / Suspend User chỉ khi có permission.

------------------------------------------------------------------------

# 17. Báo cáo & Thống kê

Module `/admin/analytics`.

Hỗ trợ date range và dữ liệu thật:

-   Posts
-   Users
-   Orders
-   Revenue
-   Categories
-   Transactions

Backend aggregate dữ liệu.

Không tải toàn database về frontend để tính.

Có thể thống kê:

### Posts

-   New
-   Approved
-   Rejected
-   Active
-   Sold/Closed
-   Category distribution

### Users

-   New users
-   Active users theo định nghĩa rõ ràng
-   Verified
-   Suspended

### Orders

-   Created
-   Completed
-   Cancelled
-   Revenue
-   Average order value nếu phù hợp

------------------------------------------------------------------------

# 18. Global Admin Search

Hoàn thiện ô tìm kiếm trên Topbar:

`Tìm kiếm tin đăng, người dùng, mã đơn hàng...`

Shortcut:

-   Ctrl + K
-   Cmd + K

Search tối thiểu:

-   Posts
-   Users
-   Orders

Nếu có:

-   Transactions
-   Categories

Kết quả grouped và giới hạn số record mỗi nhóm.

Search API phải tôn trọng permission.

------------------------------------------------------------------------

# 19. Notification Center

Hoàn thiện icon chuông.

Hiển thị dữ liệu thật:

-   Tin chờ duyệt
-   Report mới
-   Transaction error
-   User verification

Hỗ trợ nếu backend cho phép:

-   unread count
-   mark read
-   mark all read
-   click → target

Không hard-code badge notification.

------------------------------------------------------------------------

# 20. Audit Log

Mọi action quan trọng phải có audit:

``` text
POST_APPROVED
POST_REJECTED
POST_HIDDEN

USER_SUSPENDED
USER_VERIFIED

ORDER_UPDATED

CATEGORY_CREATED
BANNER_UPDATED
SETTINGS_CHANGED
```

Fields tương đương:

``` text
actorId
action
entityType
entityId
metadata
createdAt
```

Có thể lưu IP/userAgent nếu chính sách cho phép và có mục đích bảo mật
rõ ràng.

Không lưu secret.

Tạo `/admin/activity` hoặc route phù hợp với filter
Admin/Action/Entity/Date + pagination.

------------------------------------------------------------------------

# 21. Admin Profile

Hoàn thiện avatar dropdown:

-   Hồ sơ
-   Đổi mật khẩu
-   Bảo mật
-   Xem website
-   Đăng xuất

------------------------------------------------------------------------

# 22. Settings

Module `/admin/settings`.

Có thể chia:

-   GENERAL
-   POSTS
-   USERS
-   ORDERS
-   NOTIFICATIONS
-   SECURITY

Chỉ triển khai setting có business logic thật.

Không hiển thị secret như JWT secret, database password, API secret
trong UI.

------------------------------------------------------------------------

# 23. Upload Security

Tất cả upload:

-   Category icon
-   Banner
-   Post image
-   Avatar

phải validate:

-   MIME
-   Extension
-   File size
-   Dimension khi cần

Tạo filename an toàn.

Không dùng trực tiếp filename do client gửi.

------------------------------------------------------------------------

# 24. Pagination / Sorting / Filtering

Không tải hàng nghìn record một lần.

Dùng server-side pagination hoặc cursor theo convention project.

Sorting phải whitelist field.

Filter/query params phải validate.

Không đưa client input trực tiếp vào raw SQL.

------------------------------------------------------------------------

# 25. Database Transaction & Concurrency

Operation nhiều bước quan trọng phải dùng transaction nếu stack hỗ trợ.

Ví dụ:

Approve Post → update state → audit record → related DB update

Nếu lỗi thì rollback phù hợp.

External notification không nên giữ DB transaction mở trong lúc gọi
service ngoài.

Ngăn hai Admin cùng cập nhật một record bằng atomic update, optimistic
locking/version hoặc cơ chế phù hợp stack.

------------------------------------------------------------------------

# 26. Error Handling

Chuẩn hóa API error theo convention hiện tại.

Không expose SQL error, stack trace hoặc filesystem production.

Frontend phải xử lý:

-   401
-   403
-   404
-   409
-   422
-   500

Ví dụ:

`403: Bạn không có quyền thực hiện thao tác này.`

`409: Dữ liệu đã được quản trị viên khác cập nhật. Vui lòng tải lại.`

------------------------------------------------------------------------

# 27. Loading / Toast / Confirmation

Mọi action phải:

-   Có loading
-   Disable button khi request
-   Ngăn double submit
-   Có success/error toast

Destructive actions như Delete/Ban/Suspend/Hide/Cancel phải có
confirmation dialog và hiển thị đúng tên/ID đối tượng.

------------------------------------------------------------------------

# 28. Security

Kiểm tra và hoàn thiện:

-   Cookie/session security
-   CSRF nếu cookie-based auth
-   HttpOnly
-   Secure
-   SameSite
-   Rate limit cho login/search/sensitive actions
-   Backend authorization
-   Input validation
-   Upload validation
-   Secret protection

Không disable security để code nhanh.

------------------------------------------------------------------------

# 29. Database Index & Performance

Audit query thực tế trước khi thêm index.

Cân nhắc index phù hợp:

``` text
posts.status
posts.createdAt
posts.categoryId
posts.userId

users.email
users.phone
users.createdAt

orders.status
orders.createdAt

transactions.status
reports.status
```

Không tạo index trùng.

Dashboard cần tối ưu bằng aggregate query, parallel independent queries,
cache ngắn hạn hoặc pre-aggregation khi thực sự cần.

------------------------------------------------------------------------

# 30. Responsive & Accessibility

Giữ UI Admin hiện tại.

Tất cả chức năng phải hoạt động trên desktop/tablet/mobile.

Accessibility:

-   aria-label
-   keyboard focus
-   modal focus trap
-   Esc close
-   Ctrl/Cmd + K cho Global Search
-   touch target hợp lý

------------------------------------------------------------------------

# 31. Route Structure

Ưu tiên route hiện tại.

Nếu thiếu, có thể dùng cấu trúc tương đương:

``` text
/admin
/admin/posts
/admin/users
/admin/categories
/admin/orders
/admin/banners
/admin/transactions
/admin/ads
/admin/reports
/admin/analytics
/admin/activity
/admin/settings
```

Không đổi URL đang hoạt động nếu không cần.

------------------------------------------------------------------------

# 32. API Structure

Ưu tiên API convention hiện tại.

Cấu trúc tham khảo:

``` text
GET    /api/admin/dashboard

GET    /api/admin/posts
GET    /api/admin/posts/:id
PATCH  /api/admin/posts/:id
POST   /api/admin/posts/:id/approve
POST   /api/admin/posts/:id/reject

GET    /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/users/:id/suspend
POST   /api/admin/users/:id/unsuspend

GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id

GET    /api/admin/orders

GET    /api/admin/banners
POST   /api/admin/banners

GET    /api/admin/transactions
GET    /api/admin/reports
GET    /api/admin/analytics
GET    /api/admin/activity
GET    /api/admin/search
```

Đây chỉ là tham khảo. Nếu project có convention khác thì dùng convention
hiện tại.

Trước khi tạo API mới phải search project để tránh duplicate.

------------------------------------------------------------------------

# 33. Architecture & Validation

Nếu project đang dùng:

Controller → Service → Repository/ORM

thì giữ cấu trúc đó.

Không nhét toàn bộ business logic vào React component/API controller.

Dùng validation library hiện tại.

Backend là nguồn xác thực cuối cùng.

------------------------------------------------------------------------

# 34. Testing

Viết test theo testing stack hiện tại.

Ưu tiên:

-   Admin authentication
-   Authorization
-   Approve/Reject post
-   Suspend user
-   Order update
-   Banner CRUD
-   Reports
-   Transaction permission
-   Settings permission

Bắt buộc test role:

-   User thường không vào Admin
-   Moderator không xem finance nếu không có permission
-   Admin không quản lý role nếu không được cấp quyền
-   Super Admin có đầy đủ quyền

Security test:

-   Invalid ID
-   Unauthorized API
-   Invalid upload
-   Oversized upload
-   Invalid MIME
-   Double submit
-   Malformed query
-   Forbidden action

Audit test:

Approve Post → Audit Log created.

Suspend User → Audit Log created.

------------------------------------------------------------------------

# 35. Build & Migration

Sau implementation chạy scripts thực tế của project:

-   lint
-   typecheck
-   test
-   build

Kiểm tra `package.json`/config trước, không tự đoán command.

Nếu cần schema change:

-   Tạo migration đúng ORM/database hiện tại
-   Không reset production DB
-   Không drop production table
-   Không xóa dữ liệu thật
-   Đánh giá backward compatibility
-   Có strategy cho existing rows khi thêm non-null field

Seed chỉ dùng development/test và không tự chạy production.

------------------------------------------------------------------------

# 36. Data Privacy & Logging

Admin chỉ xem dữ liệu cần thiết.

Không expose:

-   password hash
-   session token
-   reset token
-   payment secret

Logging nên có:

-   requestId
-   route
-   status
-   error code

Không log password/token/payment secret.

------------------------------------------------------------------------

# 37. Thứ tự triển khai

## PHASE 0 --- AUDIT

-   Architecture
-   Database
-   APIs
-   Auth
-   Admin code
-   Mock data
-   Security

Tạo báo cáo trước khi sửa.

## PHASE 1 --- FOUNDATION

-   Authentication
-   Authorization
-   RBAC
-   Admin API helpers
-   Validation
-   Audit log
-   Error handling

## PHASE 2 --- DASHBOARD

-   KPI
-   Date range
-   Need Action
-   Charts
-   Category stats
-   Recent activity
-   Loại bỏ mock data

## PHASE 3 --- POSTS

-   List
-   Search
-   Filter
-   Approve
-   Reject
-   Hide
-   Bulk actions

## PHASE 4 --- USERS

-   List
-   Search
-   Detail
-   Verify
-   Suspend/Ban nếu business rule hỗ trợ

## PHASE 5 --- CATEGORIES

-   CRUD
-   Sort
-   Icon
-   Enable/Disable

## PHASE 6 --- ORDERS

-   List
-   Search
-   Detail
-   Status
-   Timeline

## PHASE 7 --- BANNERS / ADS

-   Banner CRUD
-   Upload
-   Schedule
-   Advertisement management

## PHASE 8 --- FINANCE

-   Transactions
-   Payment status
-   Filters
-   Failed transaction handling

## PHASE 9 --- MODERATION

-   Reports
-   Violation handling
-   Audit

## PHASE 10 --- ANALYTICS

-   Reports
-   Charts
-   Date range
-   Aggregation

## PHASE 11 --- SYSTEM

-   Settings
-   Activity Log
-   Notifications
-   Global Search
-   Admin Profile

## PHASE 12 --- HARDENING

-   Security
-   Performance
-   Database index
-   Responsive
-   Accessibility
-   Tests
-   Build

------------------------------------------------------------------------

# 38. Sau mỗi Phase

Sau mỗi phase:

1.  Build
2.  Test
3.  Kiểm tra lỗi
4.  Kiểm tra API
5.  Kiểm tra permission
6.  Kiểm tra database
7.  Tóm tắt file đã sửa
8.  Tóm tắt migration nếu có
9.  Tóm tắt API mới
10. Liệt kê việc còn lại

Không tiếp tục xây hàng loạt chức năng trên foundation đang lỗi.

------------------------------------------------------------------------

# 39. Không được làm

Không:

-   Redesign Admin
-   Xóa UI hiện tại
-   Hard-code Dashboard
-   Fake API
-   Fake analytics
-   Fake transaction
-   Fake notification
-   Fake report
-   Duplicate backend
-   Bypass authorization
-   Disable security
-   Expose secrets
-   Reset database
-   Xóa production data
-   Tự đổi framework
-   Tự đổi ORM
-   Tự đổi database
-   Tự thay authentication nếu không cần

------------------------------------------------------------------------

# 40. Definition of Done

Một module chỉ hoàn thành khi có đầy đủ:

``` text
UI
+ API
+ Database
+ Validation
+ Authorization
+ Loading
+ Error handling
+ Success feedback
+ Audit nếu cần
+ Test
```

Không đánh dấu hoàn thành chỉ vì button đã click được.

------------------------------------------------------------------------

# 41. Kết quả cuối cùng

Admin Tất Tần Tật phải trở thành hệ thống quản trị marketplace thực tế:

``` text
ADMIN
│
├── Dashboard
│   ├── KPI
│   ├── Charts
│   ├── Cần xử lý
│   └── Activity
│
├── Tin đăng
│   ├── Duyệt
│   ├── Từ chối
│   ├── Ẩn
│   └── Báo cáo
│
├── Người dùng
│   ├── Xác minh
│   ├── Suspend
│   └── Quản lý
│
├── Danh mục
├── Đơn hàng
├── Banner
├── Quảng cáo
├── Thanh toán & Giao dịch
├── Báo cáo & Thống kê
├── Activity Log
├── Notification
├── Global Search
└── Cài đặt hệ thống
```

Toàn bộ dữ liệu phải đến từ hệ thống thật.

------------------------------------------------------------------------

# 42. Bắt đầu thực hiện

Bắt đầu bằng **PHASE 0 --- AUDIT**.

**KHÔNG code ngay trước khi audit.**

Đầu tiên:

1.  Scan cấu trúc project.
2.  Xác định frontend/backend.
3.  Xác định database + ORM.
4.  Xác định authentication.
5.  Xác định schema.
6.  Liệt kê API hiện có.
7.  Xác định Admin routes.
8.  Xác định mock data.
9.  Xác định chức năng đã có backend.
10. Xác định chức năng chỉ có UI.
11. Xác định security risks.
12. Xác định migration cần thiết.

Sau đó tạo báo cáo:

# ADMIN IMPLEMENTATION PLAN

## ĐÃ HOẠT ĐỘNG

Các chức năng đã có backend/API thật.

## CẦN KẾT NỐI

Backend đã có nhưng UI chưa kết nối.

## CẦN XÂY DỰNG

Chưa có backend/business logic.

## CẦN MIGRATION

Các thay đổi database cần thiết.

## RỦI RO

Các vấn đề security/data compatibility.

Sau khi audit xong mới bắt đầu **PHASE 1**.

Mục tiêu xuyên suốt:

**Bảo toàn hệ thống hiện tại → kết nối dữ liệu thật → hoàn thiện
business logic → bảo mật → kiểm thử → tối ưu.**
