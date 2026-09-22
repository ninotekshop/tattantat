# PROMPT --- Thiết kế khu vực trưng bày sản phẩm Tất Tần Tật

## Mục tiêu

Hãy thiết kế lại khu vực **trưng bày danh sách sản phẩm/tin đăng** trên
website **Tất Tần Tật** theo phong cách marketplace hiện đại.

Tham khảo cách bố trí Product Card trong ảnh mẫu đính kèm, nhưng **không
sao chép nguyên giao diện**. Hãy áp dụng Design System và màu xanh
thương hiệu hiện tại của Tất Tần Tật.

Mục tiêu:

-   Hiển thị được nhiều sản phẩm trên một hàng.
-   Ảnh sản phẩm lớn, dễ xem.
-   Giá nổi bật.
-   Thông tin vừa đủ để quyết định có mở tin hay không.
-   Card gọn, sạch, ít khung viền.
-   Tối ưu cho website mua bán/rao vặt.
-   Responsive tốt trên desktop, tablet và mobile.
-   Giữ giao diện thân thiện và đồng bộ Homepage Tất Tần Tật hiện tại.

------------------------------------------------------------------------

## 1. Bố cục khu vực sản phẩm

Thiết kế section:

### Sản phẩm mới dành cho bạn

Phía trên section:

`[Sản phẩm mới dành cho bạn]                     [Xem tất cả →]`

Có thể bổ sung tab/filter:

`[Dành cho bạn] [Gần bạn] [Mới đăng] [Giá tốt] [Đã xác thực]`

Các filter sử dụng dạng pill/chip nhỏ gọn.

------------------------------------------------------------------------

## 2. Product Grid

Trên desktop lớn:

-   Hiển thị 5--6 sản phẩm/hàng.
-   Khoảng cách giữa card khoảng 16--20px.
-   Card có chiều rộng đồng đều.
-   Không để khoảng trắng quá lớn.

Gợi ý:

``` css
grid-template-columns: repeat(6, minmax(0, 1fr));
```

Tùy container hiện tại để tự điều chỉnh số cột hợp lý.

-   Desktop: 5--6 cột.
-   Laptop: 4--5 cột.
-   Tablet: 3 cột.
-   Mobile: 2 cột.
-   Mobile nhỏ: có thể giữ 2 cột nếu nội dung vẫn đọc tốt.

------------------------------------------------------------------------

## 3. Thiết kế Product Card

Phong cách:

**Modern Marketplace + Minimal + Clean**

Không cần border/shadow mạnh bao quanh toàn bộ card.

Cấu trúc:

``` text
┌──────────────────────┐
│                      │
│       HÌNH ẢNH        │
│                  ♡   │
│                      │
│  [Badge nếu có]       │
└──────────────────────┘

Tên sản phẩm
Danh mục / thuộc tính ngắn
GIÁ
📍 Khu vực
🕒 Thời gian đăng                 ⋮
```

------------------------------------------------------------------------

## 4. Ảnh sản phẩm

Ảnh là thành phần nổi bật nhất.

-   Tỷ lệ thống nhất.
-   Ưu tiên `aspect-ratio: 1 / 1` hoặc `4 / 3`.
-   `object-fit: cover`.
-   Width 100%.
-   Border radius khoảng 14--16px.
-   Không làm méo ảnh.
-   Lazy loading.
-   Có placeholder khi ảnh lỗi.

Ví dụ:

``` css
aspect-ratio: 1 / 1;
object-fit: cover;
border-radius: 16px;
```

------------------------------------------------------------------------

## 5. Nhiều ảnh

Nếu tin có nhiều ảnh, hiển thị indicator ở góc dưới ảnh:

`🖼 6`

Không cần carousel trực tiếp trong card nếu gây nặng trang.

Click card → mở trang chi tiết.

------------------------------------------------------------------------

## 6. Tin có Video

Nếu tin có video, hiển thị nút Play dạng overlay ở giữa thumbnail.

Có thể hiển thị indicator video ở góc dưới.

Không autoplay video trong Product Grid.

------------------------------------------------------------------------

## 7. Favorite

Góc trên bên phải ảnh có nút yêu thích.

-   Chưa yêu thích: `♡`
-   Đã yêu thích: `♥`
-   Button khoảng 40×40px.
-   Background bán trong suốt nếu cần.
-   Dễ nhìn trên ảnh sáng và tối.
-   Hover animation nhẹ.
-   Click favorite không được trigger mở Product Detail.

------------------------------------------------------------------------

## 8. Badge

Có thể hỗ trợ:

-   TIN NỔI BẬT
-   MỚI
-   ĐÃ XÁC THỰC

Không hiển thị quá nhiều badge trên cùng một ảnh. Ưu tiên tối đa 1--2
badge.

------------------------------------------------------------------------

## 9. Tên sản phẩm

Ví dụ:

**iPhone 15 Pro Max 256GB Titan Tự Nhiên**

-   Font weight 500--600.
-   Màu text chính.
-   Tối đa 2 dòng.
-   Dùng `line-clamp: 2`.
-   Không để tên dài làm card lệch chiều cao.

------------------------------------------------------------------------

## 10. Metadata / thuộc tính phụ

Ngay dưới tên có thể hiển thị:

-   `iPhone 15 Pro Max · 256GB`
-   `Nhà trống · 20m²`
-   `Gà tre · 3 tháng tuổi`

Text nhỏ hơn Product Title, màu xám, tối đa 1 dòng và ellipsis nếu quá
dài.

Không bắt buộc mọi category có cùng metadata. Metadata phải phù hợp từng
loại sản phẩm.

------------------------------------------------------------------------

## 11. Giá

Giá phải là thông tin nổi bật thứ hai sau hình ảnh.

Ví dụ:

-   `14.500.000 ₫`
-   `3 triệu/tháng`
-   `500.000 ₫`

Thiết kế:

-   Font weight 700.
-   Desktop khoảng 18--20px.
-   Mobile khoảng 16--18px.
-   Sử dụng màu nhấn phù hợp Design System Tất Tần Tật.

Nếu miễn phí, có thể hiển thị:

**TẶNG MIỄN PHÍ**

với style riêng.

------------------------------------------------------------------------

## 12. Địa điểm

Hiển thị:

-   `📍 Quy Nhơn`
-   hoặc `📍 Quy Nhơn, Gia Lai`

Không hiển thị địa chỉ quá dài trong Product Card.

------------------------------------------------------------------------

## 13. Thời gian đăng

Hiển thị dạng relative time:

-   Vừa xong
-   15 phút trước
-   2 giờ trước
-   Hôm qua
-   3 ngày trước

Có thể bố trí:

`📍 Quy Nhơn · 2 giờ trước`

để tiết kiệm diện tích.

------------------------------------------------------------------------

## 14. More Menu

Góc dưới card có nút `⋮`.

Menu có thể gồm:

-   Ẩn tin này
-   Báo cáo
-   Chia sẻ
-   Sao chép liên kết

Nếu là tin của chính user:

-   Sửa tin
-   Đánh dấu đã bán
-   Ẩn tin

Chỉ hiển thị action phù hợp với user hiện tại.

------------------------------------------------------------------------

## 15. Verified Seller

Nếu người bán đã xác thực, hiển thị nhỏ:

`✓ Đã xác thực`

Không làm badge quá lớn.

------------------------------------------------------------------------

## 16. Hover Effect

Desktop:

-   Ảnh scale nhẹ khoảng 1.02--1.04.
-   Card có thể dịch lên khoảng 2px.
-   Shadow rất nhẹ.
-   Animation 150--250ms ease.

Không sử dụng animation mạnh.

------------------------------------------------------------------------

## 17. Skeleton Loading

Trong khi API tải dữ liệu, hiển thị Product Card skeleton giữ đúng kích
thước card để tránh layout shift.

------------------------------------------------------------------------

## 18. Empty State

Nếu không có sản phẩm:

**Không tìm thấy sản phẩm phù hợp.**

`Thử thay đổi từ khóa, khu vực hoặc bộ lọc của bạn.`

`[Đặt lại bộ lọc]`

Có thể sử dụng mascot Tất Tần Tật nhỏ để tạo cảm giác thân thiện.

------------------------------------------------------------------------

## 19. Responsive

### Desktop ≥ 1440px

5--6 card/hàng.

### Laptop 1024--1439px

4--5 card/hàng.

### Tablet 768--1023px

3 card/hàng.

### Mobile \< 768px

2 card/hàng.

Trên mobile giảm gap, font size, padding và metadata không cần thiết.

------------------------------------------------------------------------

## 20. Mobile Product Card

Trên mobile ưu tiên:

``` text
[ẢNH]
Tên sản phẩm
GIÁ
📍 Khu vực · thời gian
```

Ẩn bớt metadata thứ cấp nếu thiếu diện tích.

Favorite vẫn nằm góc trên ảnh.

Không dùng hover làm chức năng bắt buộc.

------------------------------------------------------------------------

## 21. Infinite Scroll / Load More

Nếu danh sách lớn, ưu tiên một trong hai phương án tùy kiến trúc hiện
tại:

`[Xem thêm sản phẩm]`

hoặc Infinite Scroll.

Nếu dùng Infinite Scroll:

-   Có loading indicator.
-   Không request trùng dữ liệu.
-   Có pagination/cursor ở backend.
-   Giữ vị trí scroll khi user mở Product Detail rồi quay lại.

------------------------------------------------------------------------

## 22. Product Card theo từng danh mục

Không ép tất cả danh mục hiển thị cùng metadata.

### Công nghệ

``` text
iPhone 15 Pro Max
256GB · Titan tự nhiên
14.500.000 ₫
📍 Quy Nhơn · 2 giờ trước
```

### Nhà đất

``` text
Cho thuê phòng trọ
20m² · Có gác
2,5 triệu/tháng
📍 Quy Nhơn · Hôm qua
```

### Xe cộ

``` text
Honda Vision 2024
12.000 km
28.000.000 ₫
📍 Quy Nhơn · 3 giờ trước
```

### Việc làm

``` text
Nhân viên bán hàng
Toàn thời gian
8–12 triệu/tháng
📍 Quy Nhơn · Hôm nay
```

### Tặng miễn phí

``` text
Bàn học cũ còn tốt
Đã sử dụng
TẶNG MIỄN PHÍ
📍 Quy Nhơn · 30 phút trước
```

------------------------------------------------------------------------

## 23. Design System Tất Tần Tật

Không sao chép màu sắc website tham khảo.

Giữ:

-   Primary Green của Tất Tần Tật.
-   White.
-   Neutral Gray.
-   Màu semantic hiện có.

Product Grid ưu tiên ảnh và nội dung, không sử dụng quá nhiều nền xanh.

Màu thương hiệu chủ yếu dùng cho:

-   Active filter.
-   CTA.
-   Badge.
-   Verified.
-   Interaction.

------------------------------------------------------------------------

## 24. Border Radius

-   Ảnh: 14--16px.
-   Card: 14--16px nếu có background.
-   Button: 10--12px.
-   Chip: 999px.

------------------------------------------------------------------------

## 25. Spacing

Sử dụng spacing system:

`4 / 8 / 12 / 16 / 20 / 24 / 32px`

Product Card phải nhỏ gọn.

------------------------------------------------------------------------

## 26. Accessibility

-   Favorite button có `aria-label`.
-   More button có `aria-label`.
-   Ảnh có `alt`.
-   Keyboard focus rõ ràng.
-   Không chỉ dùng màu để biểu thị trạng thái.
-   Touch target mobile khoảng 44×44px.
-   Giá và tên sản phẩm đủ contrast.

------------------------------------------------------------------------

## 27. Performance

Vì Product Grid có thể có nhiều ảnh:

-   Lazy loading.
-   Responsive images.
-   `srcset` nếu hệ thống hỗ trợ.
-   Thumbnail tối ưu.
-   Không tải ảnh full-resolution không cần thiết.
-   Skeleton loading.
-   Hạn chế animation nặng.
-   Không tải video cho đến khi người dùng yêu cầu phát.

------------------------------------------------------------------------

## 28. Không hard-code dữ liệu

Sử dụng dữ liệu/API hiện tại.

Không hard-code:

-   Tên sản phẩm.
-   Giá.
-   Location.
-   User.
-   Favorite.
-   Số ảnh.
-   Video.
-   Badge.
-   Thời gian.

Nếu API thiếu field, component phải xử lý optional data an toàn.

------------------------------------------------------------------------

## 29. Component hóa

Nếu kiến trúc project cho phép, tách thành:

-   ProductSection
-   ProductGrid
-   ProductCard
-   ProductImage
-   FavoriteButton
-   ProductBadge
-   ProductPrice
-   ProductMetadata
-   ProductLocation
-   ProductMenu
-   ProductSkeleton
-   ProductEmptyState
-   ProductFilters

Tái sử dụng Design System/component hiện tại trước khi tạo component
mới.

------------------------------------------------------------------------

## 30. Product Card mẫu mong muốn

``` text
┌────────────────────────┐
│                    ♡   │
│                        │
│      PRODUCT IMAGE     │
│                        │
│ [TIN NỔI BẬT]     🖼 6 │
└────────────────────────┘

iPhone 15 Pro Max 256GB
Titan Tự Nhiên · 256GB

14.500.000 ₫

📍 Quy Nhơn · 2 giờ trước       ⋮
```

Không cần border bao quanh toàn bộ card nếu layout vẫn rõ ràng.

------------------------------------------------------------------------

## 31. Visual Hierarchy

Giao diện cuối cùng cần có cảm giác:

**Clean + Modern + Visual-first + Marketplace + Friendly**

Thứ tự visual hierarchy:

1.  Hình ảnh
2.  Tên sản phẩm
3.  Giá
4.  Vị trí
5.  Thời gian
6.  Metadata phụ

Không nhồi quá nhiều thông tin vào Product Card.

------------------------------------------------------------------------

## 32. Yêu cầu triển khai

Trước khi code:

1.  Kiểm tra source hiện tại.
2.  Xác định component Product Card hiện có.
3.  Xác định API/data structure.
4.  Xác định Design System.
5.  Xác định responsive breakpoints hiện tại.

Sau đó chỉnh sửa trực tiếp component hiện tại thay vì tạo hệ thống song
song không cần thiết.

Không thay đổi backend/API nếu không cần.

------------------------------------------------------------------------

## 33. Kiểm tra sau khi hoàn thành

Test các trường hợp:

-   1 sản phẩm.
-   Nhiều sản phẩm.
-   Tên rất dài.
-   Giá rất lớn.
-   Sản phẩm không có giá.
-   Tặng miễn phí.
-   1 ảnh.
-   Nhiều ảnh.
-   Video.
-   Không có ảnh.
-   Tin nổi bật.
-   Tin đã xác thực.
-   Location dài.
-   Favorite.
-   Loading.
-   Empty.
-   API error.

Kiểm tra độ phân giải:

-   1920px
-   1440px
-   1366px
-   1024px
-   768px
-   430px
-   390px

Không để card vỡ layout hoặc lệch chiều cao bất thường.

------------------------------------------------------------------------

# Kết quả mong muốn

Hãy nâng cấp khu vực sản phẩm của **Tất Tần Tật** thành một Product Grid
marketplace hiện đại, lấy cảm hứng về cách tổ chức thông tin từ ảnh tham
khảo nhưng vẫn giữ nhận diện riêng của Tất Tần Tật.

Đặc biệt ưu tiên:

**Ảnh lớn → Tên → Giá → Vị trí → Thời gian**

Giao diện phải giúp người dùng lướt nhanh hàng chục sản phẩm, dễ so
sánh, dễ yêu thích và nhanh chóng mở sản phẩm họ quan tâm.

-   Không sao chép nguyên giao diện tham khảo.
-   Không redesign những khu vực website không liên quan.
-   Không phá vỡ chức năng hiện tại.
