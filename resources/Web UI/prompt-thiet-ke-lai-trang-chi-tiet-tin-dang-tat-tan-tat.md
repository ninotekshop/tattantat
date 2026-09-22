# PROMPT TRIỂN KHAI --- THIẾT KẾ LẠI TRANG CHI TIẾT TIN ĐĂNG TẤT TẦN TẬT

## 1. Vai trò

Bạn là Senior Product Designer + Senior Frontend Engineer. Hãy thiết kế
và triển khai lại **trang Chi tiết tin đăng** cho website **Tất Tần Tật
(tattantat.vn)** dựa trên giao diện hiện tại, nhưng nâng cấp theo hướng
hiện đại, thân thiện, dễ đọc, rõ thứ bậc thông tin và tối ưu chuyển đổi.

Không thay đổi nhận diện thương hiệu hiện có. Giữ phong cách: - Màu
thương hiệu chính: xanh lá Tất Tần Tật. - Nền sáng, sạch, hiện đại. - Bo
góc mềm, shadow nhẹ. - Font dễ đọc, khoảng trắng hợp lý. - Responsive
tốt trên Desktop / Tablet / Mobile. - Đồng bộ Header, icon, button và
typography với trang chủ hiện tại.

------------------------------------------------------------------------

## 2. Mục tiêu UX

Trang chi tiết phải giúp người mua nhanh chóng: 1. Xem ảnh sản phẩm rõ
ràng. 2. Nắm được tên tin, giá, vị trí, tình trạng và thông tin quan
trọng. 3. Đọc mô tả không bị rối. 4. Tương tác với tin: yêu thích, chia
sẻ, báo cáo. 5. Liên hệ/giao dịch qua hệ thống Tất Tần Tật. 6. Khám phá
**Tin đang HOT** và **Tin liên quan** mà không làm mất tập trung khỏi
tin chính.

> Lưu ý nghiệp vụ: không hiển thị trực tiếp số điện thoại, địa chỉ giao
> dịch hoặc thông tin cá nhân nhạy cảm của người bán. Các hành động liên
> hệ/giao dịch phải đi qua hệ thống Tất Tần Tật.

------------------------------------------------------------------------

## 3. Bố cục Desktop

### 3.1. Container

-   `max-width`: khoảng 1180--1240px.
-   Căn giữa màn hình.
-   Khoảng cách hai bên tối thiểu 20--24px.
-   Breadcrumb ở đầu trang: `Trang chủ / Danh mục / Tên tin`
-   Có nút `← Quay lại` nhưng trình bày gọn, không chiếm nhiều diện
    tích.

### 3.2. Grid chính

Thiết kế theo bố cục: - **Cột nội dung chính:** khoảng 70--75%. -
**Sidebar Tin đang HOT:** khoảng 25--30%. - Gap: 24px.

Trong cột chính, khu vực đầu trang chia thành: - Album ảnh sản phẩm. -
Khối thông tin tin đăng.

------------------------------------------------------------------------

## 4. Album ảnh sản phẩm

### 4.1. Gallery mặc định

Thiết kế gallery hiện đại: - 01 ảnh chính kích thước lớn. - Các ảnh phụ
dạng thumbnail bên dưới hoặc bên cạnh. - Ảnh bo góc 12--16px. -
`object-fit: cover`. - Có badge hiển thị tổng số ảnh, ví dụ: `1 / 8`. -
Hover ảnh chính hiển thị icon kính lúp và text `Xem ảnh`. - Nếu có nhiều
ảnh, thumbnail đang chọn phải có border xanh thương hiệu. - Có nút
previous / next khi phù hợp. - Không reload trang khi chuyển ảnh.

### 4.2. Popup xem ảnh --- Lightbox không tạo cửa sổ mới

Khi click ảnh: - Mở **modal/lightbox toàn màn hình ngay trên trang**,
tuyệt đối không mở tab/window mới. - Background overlay tối khoảng
90--95%. - Ảnh căn giữa, ưu tiên hiển thị lớn nhưng không vỡ tỷ lệ. - Có
animation mở/đóng nhẹ.

Thanh công cụ: - `–` Zoom out. - `+` Zoom in. - Reset zoom / `100%`. -
Fullscreen nếu trình duyệt hỗ trợ. - Nút đóng `×`. - Previous / Next. -
Counter: `3 / 10`.

Yêu cầu tương tác: - Zoom bằng nút `+ / –`. - Zoom bằng mouse wheel trên
desktop. - Pinch-to-zoom trên mobile nếu thư viện hỗ trợ. - Khi zoom \>
100%, cho phép kéo/pan ảnh. - Double click/tap để zoom nhanh. - Phím
`Esc` đóng lightbox. - Phím `←` / `→` chuyển ảnh. - Không để background
phía sau scroll khi lightbox đang mở. - Giữ chất lượng ảnh tốt, không
stretch. - Có thể dùng thư viện ổn định như PhotoSwipe / Yet Another
React Lightbox hoặc giải pháp tương đương phù hợp stack hiện tại.

------------------------------------------------------------------------

## 5. Khối thông tin chính của tin đăng

Trình bày dạng card sạch, rõ ràng.

Thứ tự ưu tiên: - Badge tình trạng: `Đã qua sử dụng`, `Mới`, ... - Tiêu
đề tin. - Giá --- font lớn, màu xanh thương hiệu. - Giá thương lượng nếu
có. - Vị trí dạng icon + text. - Thời gian đăng: `Đăng 2 giờ trước`. -
Lượt xem. - Mã tin.

Thêm hàng action: - ♡ `Yêu thích`. - `Chia sẻ`. - `Báo cáo tin`.

Các action phải có tooltip và trạng thái hover/focus rõ ràng.

------------------------------------------------------------------------

## 6. Card người bán

Tạo card riêng ngay dưới thông tin tin đăng: - Avatar/logo. - Tên người
bán/shop. - Badge xác minh nếu có. - Thời gian tham gia. - Số tin đang
đăng. - Điểm/đánh giá nếu hệ thống có dữ liệu thật.

CTA chính: - `Nhắn tin với người bán`. - `Mua ngay` / `Đặt mua` nếu
luồng giao dịch hỗ trợ.

Không hiển thị: - Số điện thoại cá nhân. - Email cá nhân. - Địa chỉ giao
dịch chi tiết. - Các dữ liệu có thể khiến người mua/người bán bỏ qua hệ
thống.

Có thể hiển thị khu vực ở mức phù hợp như phường/xã, quận/huyện,
tỉnh/thành nếu chính sách cho phép.

------------------------------------------------------------------------

## 7. Mô tả tin đăng

Thiết kế section `Mô tả` thành card riêng: - Heading rõ ràng. - Font
body khoảng 15--16px. - `line-height` 1.6--1.75. - Giữ xuống dòng của
người đăng. - Không để đoạn văn quá rộng gây khó đọc. - Link được
sanitize và xử lý an toàn. - Nếu mô tả dài, hiển thị khoảng 6--10 dòng
rồi có `Xem thêm / Thu gọn`. - Nếu có thông số sản phẩm, tách thành
bảng/key-value trước phần mô tả.

Ví dụ: \| Thuộc tính \| Giá trị \| \|---\|---\| \| Tình trạng \| Đã qua
sử dụng \| \| Danh mục \| Máy tính để bàn \| \| Khu vực \| Quy Nhơn \|
\| Bảo hành \| 3 tháng \|

Chỉ hiển thị trường có dữ liệu.

------------------------------------------------------------------------

## 8. An toàn giao dịch

Thêm card nhỏ `Mua bán an toàn` với icon: - Ưu tiên nhắn tin và giao
dịch qua Tất Tần Tật. - Không chuyển tiền khi chưa xác minh thông tin
cần thiết. - Có nút `Báo cáo tin` khi phát hiện dấu hiệu bất thường.

Nội dung ngắn gọn, không lấn át phần chính.

------------------------------------------------------------------------

## 9. Sidebar --- TIN ĐANG HOT

Bên phải desktop tạo card sticky:

### Tiêu đề

`🔥 Tin đang HOT`

### Mỗi tin gồm

-   Thumbnail tỷ lệ khoảng 4:3 hoặc 1:1.
-   Tiêu đề tối đa 2 dòng.
-   Giá nổi bật.
-   Khu vực.
-   Thời gian đăng.
-   Badge HOT nhỏ nếu cần.

### Số lượng

-   Hiển thị khoảng 5--6 tin.
-   Cuối card có `Xem thêm tin HOT →`.

### Logic

-   Lấy từ API/backend, không hard-code.
-   Chỉ lấy tin đang hoạt động và đã được duyệt.
-   Loại trừ tin hiện tại.
-   Ưu tiên dữ liệu HOT theo logic hệ thống: featured/hot score, lượt
    xem, tương tác, thời gian mới... theo backend hiện có.
-   Không tự tạo dữ liệu giả khi production.

### Sticky

Trên desktop: `position: sticky; top: <chiều cao header + khoảng cách>;`

Trên mobile/tablet nhỏ: - Không sticky. - Chuyển xuống sau phần nội dung
chính hoặc ẩn sidebar và đưa HOT thành carousel ngang.

------------------------------------------------------------------------

## 10. Tin liên quan ở cuối trang

Sau toàn bộ nội dung tin chính, thêm section:

### Heading

`Tin liên quan`

### Desktop

-   Grid 4 card/hàng nếu đủ chiều rộng.
-   Khoảng 8--12 tin.
-   Card đồng bộ card tin ở trang chủ.

### Mobile

-   2 card/hàng hoặc horizontal carousel tùy design system.

### Card gồm

-   Ảnh.
-   Badge tình trạng nếu cần.
-   Tiêu đề tối đa 2 dòng.
-   Giá.
-   Khu vực.
-   Thời gian.
-   Nút yêu thích ở góc ảnh.

### Logic gợi ý

Ưu tiên theo: 1. Cùng danh mục. 2. Cùng khu vực hoặc khu vực gần. 3.
Khoảng giá tương đương. 4. Mức độ mới/tương tác.

Loại bỏ: - Tin hiện tại. - Tin hết hạn. - Tin bị khóa/ẩn/chưa duyệt.

Có nút: `Xem thêm tin tương tự`

------------------------------------------------------------------------

## 11. Skeleton / Loading / Error state

Không để layout nhảy mạnh khi tải dữ liệu.

Tạo skeleton cho: - Gallery. - Tiêu đề/giá. - Seller card. - HOT
listing. - Related listing.

Xử lý: - Tin không tồn tại → trang 404 thân thiện. - Tin đã hết hạn →
thông báo trạng thái + đề xuất tin tương tự. - Tin bị ẩn → không render
nội dung nhạy cảm. - Ảnh lỗi → placeholder đúng nhận diện Tất Tần Tật. -
API HOT/Related lỗi → không làm hỏng trang chi tiết chính.

------------------------------------------------------------------------

## 12. Responsive

### Desktop ≥ 1024px

-   Main content + HOT sidebar.
-   Gallery lớn.
-   Sidebar sticky.

### Tablet

-   Có thể chuyển thành 1 cột.
-   HOT thành horizontal cards phía dưới phần thông tin/mô tả.

### Mobile ≤ 767px

-   Full width.
-   Breadcrumb rút gọn.
-   Gallery swipe ngang.
-   Tiêu đề khoảng 20--22px.
-   Giá nổi bật.
-   Action dạng icon + text gọn.
-   Seller card dễ thao tác bằng ngón tay.
-   Có thể tạo bottom action bar sticky: `Nhắn tin` \| `Mua ngay`
-   Lightbox phải hỗ trợ swipe và pinch zoom.
-   Tin liên quan 2 cột hoặc carousel.

------------------------------------------------------------------------

## 13. Visual Design

Áp dụng design token hiện tại của Tất Tần Tật.

Gợi ý: - Primary green: lấy chính xác từ design system/logo hiện tại. -
Background: `#F7F8FA` hoặc token tương đương. - Card: trắng. - Border:
xám rất nhạt. - Radius: 12--16px. - Shadow nhẹ, tránh card nổi quá
mạnh. - Text chính: gần `#111827`. - Text phụ: gần `#6B7280`. - Giá:
primary green, font-weight 700--800.

Không dùng quá nhiều màu. Màu xanh thương hiệu phải là điểm nhấn chính.

------------------------------------------------------------------------

## 14. Accessibility

-   Tất cả button có `aria-label` phù hợp.
-   Ảnh có `alt`.
-   Lightbox quản lý focus đúng.
-   Khi modal mở, focus không chạy ra background.
-   Có thể điều khiển gallery bằng keyboard.
-   Contrast đạt mức dễ đọc.
-   Focus state rõ ràng.
-   Touch target tối thiểu khoảng 44×44px.

------------------------------------------------------------------------

## 15. Performance

-   Lazy-load ảnh không nằm trong viewport.
-   Ảnh chính ưu tiên tải trước.
-   Dùng WebP/AVIF nếu hệ thống hỗ trợ.
-   Responsive images bằng `srcset/sizes` nếu phù hợp.
-   Không tải full-resolution cho toàn bộ thumbnails.
-   Lightbox chỉ tải ảnh lớn khi cần.
-   Related/HOT có thể fetch song song nhưng không block nội dung chính.
-   Hạn chế CLS.

------------------------------------------------------------------------

## 16. SEO

Đảm bảo trang chi tiết hỗ trợ: - Dynamic `<title>`. - Meta
description. - Canonical URL. - Open Graph image/title/description. -
Structured data phù hợp loại listing/product nếu dữ liệu đáp ứng. -
Breadcrumb structured data. - URL hiện tại phải tiếp tục hoạt động,
tránh phá routing/SEO.

------------------------------------------------------------------------

## 17. API / Backend

Tận dụng API và schema hiện tại trước khi tạo mới.

Cần xác định/triển khai các nguồn dữ liệu: -
`GET product/listing detail`. - `GET listing images`. -
`GET seller public profile`. - `GET hot listings`. -
`GET related listings`. - `POST favorite / DELETE favorite`. -
`POST report`. - `POST/create conversation` hoặc luồng chat hiện tại.

Yêu cầu: - Kiểm tra auth trước các action cần đăng nhập. - Nếu chưa đăng
nhập, mở popup đăng nhập hiện có rồi quay lại action. - Không expose
private seller fields qua frontend/API public. - Server phải lọc dữ liệu
riêng tư, không chỉ CSS hide. - Sanitize nội dung mô tả. - Validate
ID/slug. - Rate-limit report/message nếu backend hỗ trợ.

------------------------------------------------------------------------

## 18. Analytics

Nếu dự án đã có analytics, thêm event: - `listing_view`. -
`gallery_open`. - `gallery_zoom`. - `favorite_listing`. -
`share_listing`. - `contact_seller`. - `report_listing`. -
`hot_listing_click`. - `related_listing_click`.

Không làm thay đổi luồng chính nếu analytics lỗi.

------------------------------------------------------------------------

## 19. Yêu cầu triển khai

1.  Trước tiên kiểm tra codebase để xác định framework, routing,
    component library, API client, auth store và design tokens hiện tại.
2.  **Không viết lại toàn bộ dự án** và không thay đổi stack nếu không
    cần thiết.
3.  Tái sử dụng Header/Footer/card/component hiện có.
4.  Tách component hợp lý, ví dụ:
    -   `ListingGallery`
    -   `ListingLightbox`
    -   `ListingInfo`
    -   `SellerCard`
    -   `ListingDescription`
    -   `SafetyTips`
    -   `HotListings`
    -   `RelatedListings`
5.  Dữ liệu phải lấy từ API thật của dự án; không để demo data trong
    production.
6.  Giữ tương thích URL trang chi tiết hiện tại.
7.  Không phá các chức năng yêu thích, chat, tài khoản hoặc quản trị đã
    có.
8.  Chạy lint/typecheck/build/test phù hợp stack sau khi hoàn tất.
9.  Kiểm tra giao diện ở các breakpoint phổ biến: 1440, 1280, 1024, 768,
    390px.
10. Không kết thúc ở mockup: triển khai thành code hoạt động trong dự
    án.

------------------------------------------------------------------------

## 20. Tiêu chí nghiệm thu

Hoàn thành khi: - Trang chi tiết có hierarchy rõ ràng, dễ đọc hơn giao
diện cũ. - Album ảnh hoạt động mượt. - Click ảnh mở lightbox trong cùng
trang. - Zoom in/out, reset, next/previous, close hoạt động. - Không mở
cửa sổ/tab mới khi xem ảnh. - Có sidebar `Tin đang HOT` trên desktop. -
Có `Tin liên quan` cuối trang. - Responsive hoàn chỉnh. - Không lộ thông
tin cá nhân của người bán. - CTA chat/giao dịch qua Tất Tần Tật hoạt
động đúng luồng. - Loading/error/empty state đầy đủ. - Không có lỗi
console nghiêm trọng. - Build production thành công. - Không làm hỏng
Header, Footer, auth, routing và các trang hiện có.

------------------------------------------------------------------------

## 21. Kết quả cần trả về sau khi triển khai

Sau khi code xong, hãy báo cáo ngắn gọn: - Các file đã tạo/sửa. -
Component mới. - API/endpoint đã dùng hoặc bổ sung. - Cách hoạt động của
lightbox + zoom. - Logic Tin HOT. - Logic Tin liên quan. - Các thay đổi
bảo mật/ẩn dữ liệu người bán. - Kết quả lint/build/test. - Những phần
cần cấu hình thêm (nếu có).

Hãy ưu tiên **trải nghiệm người dùng, tính nhất quán với Tất Tần Tật,
khả năng bảo trì và dữ liệu thật** thay vì chỉ làm giao diện đẹp.
