# Prompt nâng cấp giao diện Website Tất Tần Tật

## Mục tiêu

Hãy nâng cấp giao diện trang chủ website **Tất Tần Tật** -- nền tảng mua
bán/rao vặt đa danh mục -- dựa trên giao diện hiện tại.

**Yêu cầu quan trọng:** Không thiết kế lại hoàn toàn. Giữ nguyên nhận
diện thương hiệu, logo, mascot chú chó, tông màu xanh--trắng và cấu trúc
tổng thể. Mục tiêu là refinement UI/UX: hiện đại hơn, chuyên nghiệp hơn,
đồng nhất hơn và giúp người dùng tìm kiếm/mua bán nhanh hơn.

------------------------------------------------------------------------

## 1. Header / Navigation

-   Giữ logo **Tất Tần Tật** ở bên trái.
-   Tăng kích thước logo khoảng **10--15%** so với hiện tại nhưng không
    làm header quá cao.
-   Giảm nhẹ chiều cao tổng thể của header để giao diện gọn hơn.
-   Header phải **sticky** khi người dùng cuộn trang.
-   Giữ các mục:
    -   Trang chủ
    -   Đăng tin
    -   Yêu thích
    -   Tin nhắn
    -   Tài khoản
    -   Thông báo
-   Làm nổi bật hành động **Đăng tin** hơn các navigation item khác.
-   Có thể chuyển thành CTA: **ĐĂNG TIN MIỄN PHÍ**
-   CTA cần tương phản tốt với nền xanh nhưng vẫn đồng bộ thương hiệu.
-   Trạng thái menu đang được chọn phải rõ ràng nhưng tinh tế.

------------------------------------------------------------------------

## 2. Hero Banner

Giữ banner phong cảnh biển và mascot chú chó của Tất Tần Tật nhưng tinh
chỉnh:

-   Giảm độ rực/bão hòa của background.
-   Giảm các chi tiết gây nhiễu xung quanh khu vực tìm kiếm.
-   Tạo nhiều khoảng thở hơn.
-   Mascot vẫn phải nổi bật và dễ nhận diện nhưng không lấn át thanh tìm
    kiếm.
-   Giữ thông điệp: **"Mua bán mọi thứ, gần bạn!"**
-   Banner cần mang phong cách marketplace hiện đại thay vì cảm giác như
    banner quảng cáo.
-   Bo góc lớn, sạch sẽ, phù hợp với hệ thống design mới.

------------------------------------------------------------------------

## 3. Thanh tìm kiếm

Thanh tìm kiếm phải là thành phần nổi bật nhất trong Hero.

Thiết kế theo cấu trúc:

**\[ 🔍 Bạn muốn mua gì? \] \[ 📍 Toàn quốc ▼ \] \[ Tìm kiếm \]**

Yêu cầu:

-   Tăng nhẹ chiều cao.
-   Tăng khoảng padding.
-   Phân chia rõ:
    -   Từ khóa
    -   Vị trí
    -   Nút tìm kiếm
-   Placeholder thân thiện: **"Bạn muốn mua gì?"**
-   Có thể hỗ trợ gợi ý tìm kiếm khi nhập.
-   Location có dropdown.
-   Nút **Tìm kiếm** sử dụng màu xanh thương hiệu đậm.
-   Responsive tốt trên tablet/mobile.

------------------------------------------------------------------------

## 4. Danh mục sản phẩm

Giữ các danh mục hiện tại.

Cải thiện:

-   Đồng nhất toàn bộ icon theo **một phong cách duy nhất** (ưu tiên 3D
    mềm mại hoặc flat hiện đại).
-   Kích thước icon đồng đều.
-   Khoảng cách giữa icon và label nhất quán.
-   Hover nhẹ khi rê chuột.
-   Có nút điều hướng trái/phải khi danh mục vượt quá chiều rộng.
-   Giảm khoảng trắng thừa để khu vực danh mục gọn hơn.

------------------------------------------------------------------------

## 5. Thanh khám phá nhanh

Ngay dưới danh mục, thêm navigation/filter dạng chip:

**Dành cho bạn · Gần bạn · Mới đăng · Giá tốt · Đã xác thực**

Yêu cầu:

-   Dạng pill/chip.
-   Trạng thái active rõ ràng.
-   Không chiếm quá nhiều chiều cao.
-   Có thể scroll ngang trên mobile.
-   "Gần bạn" sử dụng vị trí người dùng khi được cấp quyền.

------------------------------------------------------------------------

Yêu cầu:

-   Ảnh chuẩn tỷ lệ thống nhất: ưu tiên **1:1 hoặc 4:3**.
-   Kích thước ảnh hiển thị 180x180px.
-   `object-fit: cover`.
-   Tên sản phẩm tối đa 2 dòng.
-   Giá phải nổi bật.
-   Hiển thị địa điểm.
-   Hiển thị thời gian đăng.
-   Có icon yêu thích ở góc ảnh.
-   Có badge **Đã xác thực** cho người bán/shop đủ điều kiện.
-   Hover card nhẹ trên desktop.
-   Không dùng shadow quá mạnh.
-   Có skeleton loading khi tải dữ liệu.

------------------------------------------------------------------------

## 6. Design System

Giữ màu xanh thương hiệu hiện tại làm primary.

Chuẩn hóa hệ thống màu:

-   Primary Green: hành động chính.
-   Dark Green: hover/active.
-   Light Green: background nhẹ, badge và trạng thái.
-   White: nền chính.
-   Neutral Gray: border, text phụ, divider.

Không lạm dụng màu xanh trên tất cả thành phần.

### Border Radius

Chuẩn hóa:

-   Container lớn: **20--24px**
-   Product card: **14--16px**
-   Button: **10--12px**
-   Chip/Pill: **999px**

### Border & Shadow

Ưu tiên:

-   Border: `#E8ECEF`
-   Shadow rất nhẹ.
-   Tránh box-shadow đậm.
-   Sử dụng whitespace để phân cấp nội dung.

------------------------------------------------------------------------

## 7. Typography

Sử dụng font sans-serif hiện đại, dễ đọc tiếng Việt.

Gợi ý:

-   Inter
-   Be Vietnam Pro

Phân cấp rõ:

-   Heading
-   Section title
-   Product title
-   Price
-   Metadata
-   Caption

Không sử dụng quá nhiều font-weight khác nhau.

------------------------------------------------------------------------

## 8. Khoảng cách và mật độ thông tin

Giao diện hiện tại có một số vùng hơi nhiều khoảng trắng.

Cần:

-   Giảm khoảng cách dọc giữa Hero → Categories → Products.
-   Mục tiêu là người dùng desktop có thể nhìn thấy **Hero +
    Categories + phần đầu danh sách sản phẩm** ngay trong viewport đầu
    tiên hoặc với thao tác cuộn tối thiểu.
-   Không làm giao diện quá chật.
-   Sử dụng spacing system nhất quán: 4 / 8 / 12 / 16 / 24 / 32 / 48px.

------------------------------------------------------------------------

## 9. UX Marketplace

Bổ sung các trải nghiệm cần thiết:

-   Search autocomplete.
-   Search history.
-   Recently viewed products.
-   Favorite/wishlist.
-   Location filter.
-   Price filter.
-   Category filter.
-   Verified seller badge.
-   Empty state.
-   Loading state.
-   Error state.
-   Skeleton loading.
-   Toast notification.
-   Pagination hoặc infinite scroll phù hợp.
-   Nút quay lại đầu trang khi danh sách dài.

Không làm trang chủ trở nên phức tạp vì các tính năng bổ sung.

------------------------------------------------------------------------

## 10. Responsive

Thiết kế đầy đủ cho:

### Desktop

-   ≥ 1280px
-   Product grid rộng.
-   Sidebar tùy chọn.

### Tablet

-   768--1279px
-   Thu gọn navigation hợp lý.
-   Giảm số cột sản phẩm.

### Mobile

-   \< 768px
-   Header tối giản.
-   Search dễ thao tác bằng một tay.
-   Category scroll ngang.
-   Filter chip scroll ngang.
-   Product grid 2 cột hoặc 1 cột tùy kích thước.
-   CTA Đăng tin luôn dễ truy cập.

------------------------------------------------------------------------

## 11. Accessibility

-   Contrast màu chữ đạt mức dễ đọc.
-   Không dùng màu sắc làm tín hiệu duy nhất.
-   Button/icon có trạng thái hover, focus và active.
-   Touch target trên mobile tối thiểu khoảng 44×44px.
-   Ảnh sản phẩm hỗ trợ `alt`.
-   Form/search có label hoặc aria-label phù hợp.

------------------------------------------------------------------------

## 12. Nguyên tắc thiết kế

Phong cách mong muốn:

**Modern Marketplace + Friendly + Clean + Trustworthy + Local**

Tham khảo tinh thần UX của các marketplace hiện đại nhưng **không sao
chép giao diện của thương hiệu khác**.

Tất Tần Tật phải giữ được nhận diện riêng thông qua:

-   Màu xanh thương hiệu.
-   Logo.
-   Mascot.
-   Thông điệp "Mua bán mọi thứ, gần bạn!".
-   Trải nghiệm mua bán gần gũi với người Việt.

------------------------------------------------------------------------

## 13. Yêu cầu triển khai

Khi chỉnh sửa source code hiện tại:

1.  Không phá vỡ chức năng đang hoạt động.
2.  Không thay đổi API/backend nếu không cần thiết.
3.  Ưu tiên tái sử dụng component hiện có.
4.  Tách component hợp lý.
5.  Không hard-code dữ liệu nếu hệ thống đã có API.
6.  Giữ code dễ bảo trì.
7.  Kiểm tra responsive.
8.  Kiểm tra overflow và layout ở các độ phân giải phổ biến.
9.  Tối ưu ảnh và lazy loading.
10. Hạn chế dependency mới nếu không thực sự cần.
11. Không xóa chức năng hiện tại chỉ vì chưa có trong mockup.
12. Sau khi hoàn tất, kiểm tra lại toàn bộ trang chủ trên desktop,
    tablet và mobile.

------------------------------------------------------------------------

## Kết quả mong muốn

Sau khi hoàn thành, trang chủ **Tất Tần Tật** phải:

-   Giữ được nhận diện thương hiệu hiện tại.
-   Nhìn hiện đại và chuyên nghiệp hơn.
-   Thanh tìm kiếm trở thành trọng tâm.
-   Danh mục rõ ràng và đồng nhất.
-   Product Card cung cấp đủ thông tin.
-   Hiển thị được nhiều sản phẩm hơn.
-   CTA Đăng tin nổi bật.
-   UX tìm kiếm theo khu vực tốt hơn.
-   Responsive tốt.
-   Không tạo cảm giác quá nhiều banner/quảng cáo.
-   Giao diện sạch, thân thiện và tạo cảm giác tin cậy.

**Không redesign toàn bộ website. Hãy nâng cấp giao diện hiện tại theo
hướng refinement, giữ lại những phần đang hoạt động tốt và cải thiện
tính nhất quán, thẩm mỹ và khả năng sử dụng.**
