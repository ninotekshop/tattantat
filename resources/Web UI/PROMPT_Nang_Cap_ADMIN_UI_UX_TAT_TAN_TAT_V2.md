# PROMPT --- Nâng cấp UI/UX Trang Quản trị Tất Tần Tật V2

## 1. Vai trò và mục tiêu

Bạn là **Senior Product Designer + Senior Frontend Engineer**. Hãy nâng
cấp giao diện trang quản trị `/admin` của nền tảng mua bán/rao vặt **Tất
Tần Tật** dựa trên source code hiện tại.

### Mục tiêu chính

-   Biến `/admin` thành một **Admin Console độc lập, hiện đại, chuyên
    nghiệp và dễ vận hành**.
-   Giữ nhận diện thương hiệu **Tất Tần Tật**, đặc biệt là tông xanh
    hiện tại.
-   Không redesign toàn bộ nếu không cần thiết.
-   Giữ lại các component/chức năng đang hoạt động tốt.
-   Ưu tiên **refinement UI/UX**, tính nhất quán và tốc độ thao tác của
    quản trị viên.
-   Không phá vỡ API, backend, routing, authentication, permission hoặc
    dữ liệu hiện có.
-   Tất cả số liệu hiển thị phải lấy từ dữ liệu/API thật nếu hệ thống đã
    có; **không hard-code số liệu giả vào production**.

------------------------------------------------------------------------

# 2. Nguyên tắc quan trọng

Trước khi sửa code:

1.  Phân tích cấu trúc project hiện tại.
2.  Xác định framework, routing, component library, CSS framework và
    chart library đang sử dụng.
3.  Tái sử dụng component hiện có nếu phù hợp.
4.  Không thay dependency chỉ để thay đổi giao diện.
5.  Không xóa chức năng hiện tại.
6.  Không thay đổi API contract nếu không thật sự cần.
7.  Không làm ảnh hưởng giao diện website dành cho người dùng.
8.  Các thay đổi trong prompt này ưu tiên cho route `/admin` và các
    route con.
9.  Nếu một tính năng backend chưa tồn tại, hãy thiết kế UI/component
    theo hướng sẵn sàng tích hợp nhưng không tạo dữ liệu giả gây hiểu
    nhầm.
10. Sau khi hoàn tất phải kiểm tra desktop, tablet và mobile.

------------------------------------------------------------------------

# 3. Tách giao diện Admin khỏi website người dùng

## Vấn đề hiện tại

Trang Admin đang đồng thời hiển thị:

-   Sidebar quản trị bên trái.
-   Navbar của website người dùng ở phía trên:
    -   Trang chủ
    -   Đăng tin
    -   Yêu thích
    -   Tin nhắn
    -   Tài khoản
-   Footer lớn của website người dùng.

Điều này khiến `/admin` có cảm giác như website chính được gắn thêm
sidebar thay vì một hệ thống quản trị độc lập.

## Yêu cầu

Tạo **Admin Layout riêng**.

### Bỏ khỏi `/admin`

Không hiển thị navbar frontend:

-   Trang chủ
-   Đăng tin
-   Yêu thích
-   Tin nhắn
-   Tài khoản

Không hiển thị footer frontend:

-   Mua bán
-   Hỗ trợ
-   Tất Tần Tật
-   Các link dành cho khách hàng

### Thay bằng

``` text
AdminSidebar + AdminTopbar + AdminContent
```

Admin Layout phải độc lập với Public Layout nhưng vẫn giữ nhận diện Tất
Tần Tật.

------------------------------------------------------------------------

# 4. Admin Topbar mới

Thiết kế topbar gọn, sticky và dành riêng cho Admin.

Bố cục desktop đề xuất:

``` text
[☰] [🔍 Tìm kiếm tin đăng, người dùng, đơn hàng...]       [🔔] [Avatar Admin ▼]
```

## Yêu cầu

-   `position: sticky` ở phía trên.
-   Chiều cao gọn khoảng 64--72px.
-   Background trắng hoặc rất sáng.
-   Border bottom nhẹ.
-   Không dùng shadow nặng.
-   Nút hamburger/collapse sidebar.
-   Global Search ở vị trí dễ truy cập.
-   Notification.
-   Avatar.
-   Tên tài khoản.
-   Role, ví dụ `Super Admin`.
-   Dropdown tài khoản.

Dropdown Admin có thể gồm:

-   Hồ sơ
-   Cài đặt tài khoản
-   Nhật ký hoạt động của tôi
-   Xem website
-   Đăng xuất

------------------------------------------------------------------------

# 5. Global Search / Command Palette

Giữ ý tưởng search hiện tại:

> Tìm kiếm tin đăng, người dùng, mã đơn hàng...

và nâng cấp thành **Global Admin Search**.

## Hỗ trợ tìm

-   Tin đăng
-   Người dùng
-   Mã đơn hàng
-   Giao dịch
-   Danh mục
-   Quảng cáo

Ví dụ:

-   Nhập mã `DH12546` → mở đơn hàng.
-   Nhập email/số điện thoại → tìm người dùng.
-   Nhập mã tin → mở tin đăng.

## Keyboard shortcut

Hỗ trợ:

``` text
Ctrl + K
```

hoặc:

``` text
⌘ + K
```

trên macOS.

Command Palette cần:

-   Search input.
-   Loading state.
-   Empty state.
-   Nhóm kết quả theo loại.
-   Keyboard navigation.
-   Enter để mở.
-   Esc để đóng.

Nếu backend search chưa hỗ trợ toàn bộ loại dữ liệu, chỉ kích hoạt những
loại hiện có và xây component theo hướng dễ mở rộng.

------------------------------------------------------------------------

# 6. Sidebar Admin

Giữ tông **xanh đậm** hiện tại nhưng tinh chỉnh.

## Desktop expanded

Chiều rộng khoảng:

``` text
240–250px
```

Không cần rộng như hiện tại nếu gây mất diện tích nội dung.

## Collapsed

Cho phép thu gọn còn khoảng:

``` text
72–80px
```

Khi collapsed:

-   Chỉ hiển thị icon.
-   Tooltip khi hover.
-   Logo có phiên bản compact nếu source hiện có.
-   Lưu trạng thái collapse nếu phù hợp.

## Nhóm menu

### TỔNG QUAN

-   Tổng quan

### QUẢN LÝ

-   Quản lý tin đăng
-   Quản lý người dùng
-   Quản lý danh mục
-   Quản lý đơn hàng

### TÀI CHÍNH

-   Thanh toán & Giao dịch
-   Quảng cáo

### PHÂN TÍCH

-   Báo cáo & Thống kê

### HỆ THỐNG

-   Cài đặt hệ thống
-   Nhật ký hoạt động

Cuối sidebar:

``` text
↗ Xem website
```

Mở frontend Tất Tần Tật.

## Active state

Menu hiện tại phải nổi bật nhưng không quá chói.

Sử dụng:

-   Background xanh sáng hơn.
-   Icon + text trắng.
-   Border/radius đồng nhất.

## Badge

Badge chỉ nên thể hiện dữ liệu có ý nghĩa hành động.

Ví dụ thay vì:

``` text
Quản lý tin đăng    124  18
```

hãy ưu tiên:

``` text
Tin đăng       18
```

với tooltip/label:

``` text
18 tin chờ duyệt
```

Không hiển thị nhiều badge khó hiểu.

------------------------------------------------------------------------

# 7. Dashboard Header

Thiết kế:

``` text
Tổng quan
Theo dõi hoạt động và các công việc cần xử lý của Tất Tần Tật.
```

Bên phải:

``` text
[Hôm nay] [7 ngày] [30 ngày] [Tùy chọn 📅]
```

hoặc date-range picker phù hợp với component library hiện tại.

## Yêu cầu

Date filter phải điều khiển nhất quán:

-   KPI.
-   Biểu đồ.
-   Thống kê liên quan.

Không để date picker đứng tách biệt khiến người dùng không biết nó áp
dụng cho dữ liệu nào.

------------------------------------------------------------------------

# 8. KPI Cards

Giữ các KPI hữu ích nhưng chuẩn hóa.

Ví dụ:

### Tin đăng mới

`12.458` `↑ 12% so với kỳ trước`

### Người dùng mới

`3.892` `↑ 18% so với kỳ trước`

### Đơn hàng hoàn thành

`1.245` `↑ 24% so với kỳ trước`

### Doanh thu ước tính

`468.750.000đ` `↑ 32% so với kỳ trước`

## Lưu ý về semantic

Không dùng tên KPI gây hiểu nhầm.

Ví dụ nếu `12.458` là tổng tích lũy thì dùng:

``` text
Tổng tin đang hoạt động
```

Nếu là dữ liệu phát sinh trong kỳ thì dùng:

``` text
Tin đăng mới
```

## Interaction

Nếu có route phù hợp, KPI card có thể click để drill-down vào dữ liệu
chi tiết đã filter.

## Visual

-   Card trắng.
-   Border xám rất nhẹ.
-   Radius 14--16px.
-   Shadow rất nhẹ hoặc không shadow.
-   Icon nhỏ ở góc.
-   Không sử dụng màu trang trí quá nhiều nếu màu không mang semantic.

------------------------------------------------------------------------

# 9. Thêm khu vực "Cần xử lý"

Đây là khu vực ưu tiên cao của Dashboard.

Đặt ngay dưới KPI hoặc ở vị trí nổi bật phía trên biểu đồ.

Ví dụ:

``` text
CẦN XỬ LÝ

[18 Tin chờ duyệt]
[5 Báo cáo vi phạm]
[3 Giao dịch lỗi]
[7 Tài khoản cần xác minh]
```

## Yêu cầu

-   Chỉ hiển thị loại dữ liệu backend thực sự hỗ trợ.
-   Mỗi card/chip phải click được.
-   Click mở trang tương ứng với filter đã áp dụng.
-   Dùng màu semantic vừa phải:
    -   Warning → cam/vàng.
    -   Error → đỏ.
    -   Information → xanh dương.
-   Không biến thành các banner màu quá lớn.

Mục tiêu:

> Khi Admin mở Dashboard phải biết ngay "Có việc gì cần xử lý?".

------------------------------------------------------------------------

# 10. Charts / Analytics

## Biểu đồ hoạt động

Giữ:

``` text
Biểu đồ hoạt động
```

nhưng cho phép chuyển:

``` text
7 ngày | 30 ngày | 12 tháng
```

Series có thể gồm:

-   Tin đăng
-   Người dùng
-   Đơn hàng

## Interaction

-   Hover tooltip.
-   Legend bật/tắt series nếu chart library hỗ trợ.
-   Responsive.
-   Loading skeleton.
-   Empty state nếu không có dữ liệu.
-   Không làm chart quá nhiều màu.

## Category Chart

Giữ donut chart:

``` text
Tỷ lệ tin đăng theo danh mục
```

Bổ sung legend rõ ràng:

``` text
Đồ công nghệ     32%
Xe cộ             21%
Nhà đất           18%
Khác              29%
```

Nếu danh mục quá nhiều:

-   Hiển thị Top N.
-   Gộp phần còn lại thành `Khác`.
-   Có tooltip xem chi tiết.

------------------------------------------------------------------------

# 11. Nâng cấp "Tin đăng mới nhất"

Biến khu vực này thành một công cụ quản trị nhanh.

## Cột đề xuất

``` text
Hình ảnh
Tiêu đề
Giá
Danh mục
Người đăng
Khu vực
Ngày đăng
Trạng thái
Thao tác
```

Có thể ẩn bớt cột trên màn hình nhỏ.

## Trạng thái

Ví dụ:

-   Chờ duyệt
-   Đã duyệt
-   Đã ẩn
-   Bị từ chối
-   Hết hạn

Dùng badge semantic thống nhất.

## Quick actions

Với tin chờ duyệt, hỗ trợ:

``` text
[Duyệt] [⋯]
```

Menu `⋯`:

-   Xem chi tiết
-   Duyệt
-   Từ chối
-   Ẩn tin
-   Xóa
-   Xem người bán

Chỉ hiển thị action người dùng hiện tại có permission thực hiện.

## Action nguy hiểm

Các action như:

-   Xóa
-   Khóa
-   Từ chối

phải có confirmation dialog nếu phù hợp.

Không thực hiện destructive action chỉ bằng một click ngoài ý muốn.

------------------------------------------------------------------------

# 12. Nâng cấp "Đơn hàng gần đây"

Các cột đề xuất:

``` text
Mã đơn
Khách hàng
Sản phẩm
Ngày đặt
Tổng tiền
Thanh toán
Trạng thái
Thao tác
```

## Status system

Chuẩn hóa:

-   Chờ xử lý → Warning.
-   Đang xử lý → Processing.
-   Đã giao → Information.
-   Hoàn thành → Success.
-   Đã hủy → Danger.

Nếu hệ thống hiện tại có status khác, map visual style vào status thật
thay vì đổi business logic.

Cho phép click mã đơn để mở chi tiết.

------------------------------------------------------------------------

# 13. Bỏ các card chức năng trùng lặp cuối Dashboard

Các card dạng:

-   Bán hàng hiệu quả hơn
-   Quản lý người dùng
-   Báo cáo & Thống kê
-   Cài đặt hệ thống

đang trùng chức năng với sidebar.

Hãy bỏ hoặc thay bằng nội dung hữu ích hơn.

------------------------------------------------------------------------

# 14. Activity Log / Hoạt động gần đây

Thay khu vực card cuối trang bằng:

``` text
Hoạt động gần đây
```

Ví dụ UI:

``` text
15:42  Admin duyệt tin #TTT10245
15:38  Có người dùng mới đăng ký
15:31  Tin #TTT10241 nhận báo cáo
15:22  Đơn hàng #DH12546 hoàn thành
15:10  Người dùng cập nhật tin đăng
```

Có link:

``` text
Xem nhật ký →
```

## Yêu cầu

-   Sử dụng dữ liệu audit/activity thật nếu backend có.
-   Nếu chưa có backend Activity Log, không hard-code dữ liệu giả vào
    production.
-   Có thể tạo empty state hoặc placeholder component sẵn sàng tích hợp.

------------------------------------------------------------------------

# 15. Quick Actions

Ở Dashboard Header có thể thêm:

``` text
+ Tạo mới ▼
```

Menu:

-   Tạo tin đăng
-   Tạo danh mục
-   Tạo người dùng
-   Tạo quảng cáo

Chỉ hiển thị những action:

1.  Hệ thống hỗ trợ.
2.  Admin hiện tại có permission.

------------------------------------------------------------------------

# 16. Footer Admin

Bỏ footer lớn của frontend khỏi toàn bộ `/admin`.

Nếu cần footer, chỉ sử dụng dạng tối giản:

``` text
© 2026 Tất Tần Tật · Admin v1.0 · Trạng thái hệ thống
```

Hoặc không cần footer nếu Admin sử dụng SPA layout full-height.

------------------------------------------------------------------------

# 17. Design System

Giữ màu xanh nhận diện hiện tại của Tất Tần Tật.

## Semantic color

Sử dụng nhất quán:

-   Primary Green → thương hiệu / primary action.
-   Success Green → thành công.
-   Warning Orange/Yellow → chờ xử lý/cảnh báo.
-   Danger Red → lỗi/xóa/từ chối.
-   Info Blue → thông tin.
-   Processing Purple/Blue → đang xử lý.
-   Neutral Gray → text phụ, border, disabled.

Không dùng màu chỉ để trang trí KPI nếu màu đó khiến người dùng hiểu
nhầm trạng thái.

## Background

Admin content:

``` text
#F5F7F7
```

hoặc neutral tương đương đang có trong design system.

## Card

-   Background trắng.
-   Border khoảng `#E8ECEF`.
-   Radius: `14–16px`.
-   Shadow rất nhẹ.

## Container

Radius:

``` text
16–20px
```

## Button

Radius:

``` text
10–12px
```

## Chip / Badge

``` text
999px
```

------------------------------------------------------------------------

# 18. Typography

Ưu tiên font hiện tại nếu đã phù hợp.

Nếu project chưa có typography system rõ ràng, có thể sử dụng:

-   Inter
-   Be Vietnam Pro

nhưng **không thêm font/dependency mới nếu không cần thiết**.

Phân cấp rõ:

-   Page title.
-   Section title.
-   KPI value.
-   Table heading.
-   Body.
-   Metadata.
-   Caption.

Không dùng quá nhiều font weight.

------------------------------------------------------------------------

# 19. Spacing

Sử dụng spacing system thống nhất:

``` text
4 / 8 / 12 / 16 / 24 / 32 / 48px
```

Giảm các vùng whitespace không cần thiết nhưng không làm dashboard quá
chật.

Mục tiêu desktop:

-   Header gọn.
-   KPI nhìn thấy ngay.
-   "Cần xử lý" dễ thấy.
-   Biểu đồ và dữ liệu quan trọng xuất hiện sớm.

------------------------------------------------------------------------

# 20. Tables

Tạo style chung cho toàn bộ Admin Table.

## Header

-   Background neutral rất nhẹ.
-   Font medium/semibold.
-   Không quá đậm.

## Row

-   Hover state.
-   Border bottom nhẹ.
-   Chiều cao đủ thao tác.
-   Không nhồi quá nhiều thông tin.

## Hỗ trợ

Khi phù hợp:

-   Search.
-   Filter.
-   Sort.
-   Pagination.
-   Bulk selection.
-   Bulk actions.
-   Column visibility.
-   Empty state.
-   Loading state.

Không bắt buộc đưa tất cả chức năng vào mọi bảng; chỉ dùng nơi hợp lý.

------------------------------------------------------------------------

# 21. Filters

Các trang quản lý dữ liệu nên có filter bar thống nhất.

Ví dụ Quản lý tin đăng:

``` text
[🔍 Tìm tin...] [Trạng thái ▼] [Danh mục ▼] [Khu vực ▼] [Ngày đăng ▼] [Đặt lại]
```

Filter phải:

-   Dễ hiểu.
-   Có trạng thái đang áp dụng.
-   Có nút reset.
-   Có thể đồng bộ query params nếu kiến trúc project phù hợp để hỗ trợ
    bookmark/back-forward.

------------------------------------------------------------------------

# 22. Quản lý tin đăng

Ngoài Dashboard, cải thiện trang danh sách tin đăng theo cùng design
system.

Ưu tiên:

-   Duyệt nhanh.
-   Multi-select.
-   Bulk approve nếu business rule cho phép.
-   Bulk hide.
-   Filter chờ duyệt.
-   Preview ảnh.
-   Xem người đăng.
-   Xem báo cáo liên quan.
-   Lịch sử thay đổi trạng thái nếu backend có.

Không thêm bulk destructive action thiếu confirmation.

------------------------------------------------------------------------

# 23. Quản lý người dùng

Danh sách nên ưu tiên:

-   Avatar.
-   Họ tên.
-   Email/số điện thoại.
-   Ngày tham gia.
-   Số tin.
-   Trạng thái.
-   Xác minh.
-   Thao tác.

Action có thể gồm nếu backend hỗ trợ:

-   Xem hồ sơ.
-   Xem tin đăng.
-   Khóa/mở khóa.
-   Xác minh.
-   Xem lịch sử hoạt động.

Mọi action phải tuân theo permission hiện tại.

------------------------------------------------------------------------

# 24. Quản lý đơn hàng

Ưu tiên:

-   Search theo mã đơn.
-   Filter trạng thái.
-   Filter ngày.
-   Filter thanh toán.
-   Chi tiết đơn.
-   Timeline trạng thái nếu backend có.
-   Thông tin người mua/người bán.
-   Tổng tiền rõ ràng.

Không thay đổi logic trạng thái đơn hàng hiện có.

------------------------------------------------------------------------

# 25. Thanh toán & Giao dịch

Nếu module hiện có, chuẩn hóa UI:

-   Mã giao dịch.
-   Đơn hàng liên quan.
-   Người dùng.
-   Số tiền.
-   Phương thức.
-   Thời gian.
-   Trạng thái.

Trạng thái lỗi cần nổi bật vừa đủ và có khả năng filter nhanh.

Không hiển thị dữ liệu tài chính nhạy cảm vượt quá permission.

------------------------------------------------------------------------

# 26. Quảng cáo

Trang quảng cáo nên có:

-   Campaign/ad name.
-   Vị trí hiển thị.
-   Ngày bắt đầu/kết thúc.
-   Trạng thái.
-   Impression/click nếu backend có.
-   Thao tác.

Tránh thiết kế giống banner marketing trong Admin; ưu tiên dạng
management table/card rõ dữ liệu.

------------------------------------------------------------------------

# 27. Báo cáo & Thống kê

Thiết kế theo nguyên tắc:

``` text
Filter → KPI → Chart → Table/Breakdown
```

Có date range thống nhất.

Không tạo quá nhiều chart chỉ để trang trông đẹp.

Mỗi chart phải trả lời một câu hỏi quản trị cụ thể.

------------------------------------------------------------------------

# 28. Cài đặt hệ thống

Chia settings thành nhóm rõ ràng, ví dụ:

-   Chung.
-   Tin đăng.
-   Người dùng.
-   Đơn hàng.
-   Thanh toán.
-   Thông báo.
-   Bảo mật.
-   Phân quyền.

Nếu hệ thống chưa có setting tương ứng thì không tự tạo business logic
mới.

Với thay đổi quan trọng:

-   Có Save.
-   Loading state.
-   Success/error feedback.
-   Confirmation khi cần.

------------------------------------------------------------------------

# 29. Permission / Role-based UI

Admin UI phải tôn trọng authorization hiện có.

Ví dụ:

-   Super Admin.
-   Admin.
-   Moderator.
-   Support.

Không chỉ ẩn button ở frontend rồi xem đó là bảo mật.

Backend vẫn phải kiểm tra permission theo kiến trúc hiện tại.

Frontend chỉ hiển thị action phù hợp để UX rõ ràng hơn.

------------------------------------------------------------------------

# 30. Notification

Notification bell cần:

-   Badge số chưa đọc.
-   Dropdown/popover.
-   Mark as read nếu backend hỗ trợ.
-   Link tới nội dung liên quan.

Các notification quan trọng có thể gồm:

-   Tin chờ duyệt.
-   Báo cáo vi phạm.
-   Giao dịch lỗi.
-   Sự kiện hệ thống.

Không tạo notification giả nếu backend chưa có.

------------------------------------------------------------------------

# 31. Loading / Empty / Error States

Tất cả module quan trọng cần trạng thái rõ ràng.

### Loading

Dùng skeleton thay vì layout nhảy mạnh.

### Empty

Ví dụ:

``` text
Chưa có tin đăng nào cần duyệt.
```

### Error

Hiển thị:

-   Thông báo dễ hiểu.
-   Retry khi phù hợp.
-   Không expose stack trace hoặc thông tin kỹ thuật nhạy cảm.

------------------------------------------------------------------------

# 32. Toast / Feedback

Sau action:

-   Duyệt tin.
-   Cập nhật.
-   Xóa.
-   Khóa.
-   Thay đổi trạng thái.

phải có feedback.

Ví dụ:

``` text
✓ Đã duyệt tin đăng thành công.
```

Error:

``` text
Không thể cập nhật. Vui lòng thử lại.
```

Không hiển thị nhiều toast trùng lặp.

------------------------------------------------------------------------

# 33. Confirmation Dialog

Bắt buộc cân nhắc confirmation cho:

-   Xóa.
-   Khóa tài khoản.
-   Từ chối tin.
-   Hủy đơn.
-   Các destructive action khác.

Dialog cần nói rõ:

-   Đối tượng.
-   Hành động.
-   Hậu quả.

Primary destructive button dùng danger color.

------------------------------------------------------------------------

# 34. Responsive Admin

## Desktop ≥ 1280px

-   Sidebar expanded 240--250px.
-   Có thể collapse.
-   KPI 4 cột.
-   Chart 2 cột.
-   Tables đầy đủ.

## Tablet 768--1279px

-   Sidebar có thể collapsed/drawer.
-   KPI 2 cột.
-   Chart xuống dòng nếu thiếu không gian.
-   Table cho phép horizontal scroll hợp lý.

## Mobile \< 768px

Admin vẫn phải sử dụng được:

-   Sidebar chuyển thành drawer.
-   Topbar gọn.
-   Search có thể mở modal.
-   KPI 1--2 cột.
-   Table chuyển responsive view hoặc horizontal scroll.
-   Action menu dễ chạm.
-   Touch target tối thiểu khoảng 44×44px.

Không để sidebar cố định chiếm gần hết màn hình mobile.

------------------------------------------------------------------------

# 35. Accessibility

-   Contrast text/background tốt.
-   Keyboard navigation.
-   Focus state rõ.
-   Icon-only button phải có `aria-label`.
-   Form input có label.
-   Modal trap focus phù hợp.
-   Không dùng màu làm tín hiệu duy nhất.
-   Touch target mobile đủ lớn.

------------------------------------------------------------------------

# 36. Performance

-   Lazy load module/chart nặng nếu phù hợp.
-   Không request lại cùng dữ liệu không cần thiết.
-   Debounce global search.
-   Tối ưu ảnh thumbnail.
-   Skeleton trong thời gian tải.
-   Tránh re-render không cần thiết.
-   Không thêm animation nặng.

------------------------------------------------------------------------

# 37. Security UX

Không hiển thị trong UI/log:

-   Password.
-   Token.
-   API key.
-   Secret.
-   Dữ liệu nhạy cảm không cần thiết.

Destructive actions phải tuân theo authorization hiện tại.

Không dựa vào việc "ẩn button" như một cơ chế bảo mật.

------------------------------------------------------------------------

# 38. Bố cục Dashboard V2 mong muốn

``` text
┌───────────────┬────────────────────────────────────────────────────┐
│               │ ☰  🔍 Tìm kiếm...                  🔔  Admin ▼   │
│ TẤT TẦN TẬT   ├────────────────────────────────────────────────────┤
│               │                                                    │
│ TỔNG QUAN     │ Tổng quan                  7 ngày | 30 ngày | 📅  │
│ • Dashboard   │                                                    │
│               │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ QUẢN LÝ       │ │ Tin  │ │ User │ │ Đơn  │ │Doanh │              │
│ • Tin đăng    │ └──────┘ └──────┘ └──────┘ └──────┘              │
│ • Người dùng  │                                                    │
│ • Danh mục    │ CẦN XỬ LÝ                                         │
│ • Đơn hàng    │ [18 Chờ duyệt] [5 Báo cáo] [3 Giao dịch lỗi]     │
│               │                                                    │
│ TÀI CHÍNH     │ ┌──────────────────────────┬─────────────────────┐ │
│ • Giao dịch   │ │ Biểu đồ hoạt động       │ Theo danh mục       │ │
│ • Quảng cáo   │ │                          │                     │ │
│               │ └──────────────────────────┴─────────────────────┘ │
│ PHÂN TÍCH     │                                                    │
│ • Báo cáo     │ Tin đăng mới              Đơn hàng gần đây        │
│               │                                                    │
│ HỆ THỐNG      │ Hoạt động gần đây                                  │
│ • Cài đặt     │                                                    │
│ • Nhật ký     │                                                    │
│               │                                                    │
│ ↗ Xem website │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 39. Thứ tự ưu tiên triển khai

Thực hiện theo thứ tự:

## P0 --- Quan trọng nhất

1.  Tách Public Layout khỏi Admin Layout.
2.  Bỏ navbar frontend khỏi `/admin`.
3.  Bỏ footer frontend khỏi `/admin`.
4.  Tạo Admin Topbar.
5.  Tối ưu/collapse Sidebar.
6.  Responsive layout cơ bản.

## P1 --- Dashboard UX

7.  Chuẩn hóa KPI.
8.  Thêm "Cần xử lý".
9.  Nâng cấp charts.
10. Nâng cấp Tin đăng mới.
11. Nâng cấp Đơn hàng gần đây.
12. Thay card cuối bằng Activity Log.

## P2 --- Productivity

13. Global Search / Ctrl+K.
14. Quick Actions.
15. Filter system.
16. Table system.
17. Toast / Dialog / Loading / Empty / Error states.

## P3 --- Polish

18. Responsive chi tiết.
19. Accessibility.
20. Performance.
21. Visual consistency.
22. Micro-interactions nhẹ.

------------------------------------------------------------------------

# 40. Yêu cầu kiểm thử sau khi sửa

Kiểm tra ít nhất:

### Layout

-   Desktop 1920px.
-   Desktop 1440px.
-   Laptop 1366px.
-   Tablet.
-   Mobile.

### Navigation

-   Sidebar expanded.
-   Sidebar collapsed.
-   Active route.
-   Nested route nếu có.
-   Xem website.

### Dashboard

-   Date filter.
-   KPI.
-   Charts.
-   "Cần xử lý".
-   Recent posts.
-   Recent orders.
-   Activity log.

### Data state

-   Loading.
-   Empty.
-   Error.
-   Long text.
-   Large numbers.
-   Nhiều badge.
-   Ảnh lỗi/missing image.

### Actions

-   Approve.
-   Reject.
-   Delete.
-   Lock/unlock.
-   Status update.
-   Confirmation dialog.
-   Toast.

### Permission

Kiểm tra ít nhất một role không có toàn quyền nếu hệ thống hỗ trợ.

------------------------------------------------------------------------

# 41. Yêu cầu về code

-   Giữ coding convention hiện tại.
-   Không refactor toàn project nếu không cần.
-   Component hóa hợp lý.
-   Tránh component quá lớn.
-   Tái sử dụng:
    -   Card.
    -   Badge.
    -   Table.
    -   Filter.
    -   Modal.
    -   Dropdown.
    -   Skeleton.
    -   EmptyState.
-   Không duplicate CSS.
-   Không hard-code màu rải rác nếu project có theme/token.
-   Không hard-code URL nếu project có route helper/config.
-   Không hard-code permission.
-   Không hard-code dữ liệu demo trong production.
-   Không để console error/warning mới.
-   Không làm TypeScript/lint/build bị lỗi nếu project sử dụng các công
    cụ này.

------------------------------------------------------------------------

# 42. Kết quả cuối cùng mong muốn

Sau khi hoàn thành, `/admin` của **Tất Tần Tật** phải tạo cảm giác là
một **Admin Console riêng biệt**, không phải frontend website được gắn
thêm sidebar.

Admin cần có:

-   Sidebar chuyên nghiệp.
-   Topbar riêng.
-   Global Search.
-   Dashboard tập trung vào dữ liệu và công việc cần xử lý.
-   KPI rõ nghĩa.
-   "Cần xử lý" nổi bật.
-   Chart hữu ích.
-   Tin đăng có thể duyệt nhanh.
-   Đơn hàng dễ theo dõi.
-   Activity Log.
-   Status/badge thống nhất.
-   Table/filter thống nhất.
-   Responsive.
-   Accessibility tốt.
-   Loading/error/empty state đầy đủ.
-   Permission-aware.
-   Không phá vỡ backend/API hiện tại.

Phong cách tổng thể:

**Modern Admin Console + Clean + Efficient + Trustworthy + Tất Tần Tật
Brand**

------------------------------------------------------------------------

# 43. Cách thực hiện

Không chỉ tạo mockup.

Hãy **chỉnh sửa trực tiếp source code hiện tại** theo từng bước an toàn.

Trước khi code:

1.  Khảo sát project.
2.  Liệt kê ngắn các file/component dự kiến cần sửa.
3.  Xác định những phần có thể tái sử dụng.
4.  Sau đó triển khai theo P0 → P1 → P2 → P3.

Sau khi code:

1.  Chạy build/typecheck/lint/test phù hợp với project.
2.  Sửa các lỗi phát sinh do thay đổi.
3.  Kiểm tra responsive.
4.  Kiểm tra console.
5.  Tóm tắt file đã thay đổi.
6.  Tóm tắt chức năng đã hoàn thành.
7.  Nêu rõ chức năng nào chưa thể triển khai vì backend/API chưa hỗ trợ.
8.  Không tuyên bố hoàn thành một chức năng nếu mới chỉ tạo UI giả lập.

**Ưu tiên bảo toàn chức năng hiện tại trước, sau đó mới tối ưu UI/UX.**
