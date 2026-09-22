# PROMPT THIẾT KẾ LẠI FORM TÌM KIẾM – TẤT TẦN TẬT

## 1. Mục tiêu
Thiết kế lại **form tìm kiếm chính trên banner trang chủ Tất Tần Tật** theo hướng hiện đại, cao cấp, dễ nhìn và dễ thao tác hơn form hiện tại.

Giữ nguyên vị trí tổng thể: form nằm nổi ở khu vực trung tâm banner/hero, nhưng cần tăng tính thẩm mỹ, phân cấp rõ ràng và tạo cảm giác đây là chức năng quan trọng nhất của trang.

## 2. Phong cách thiết kế
- Phong cách: **Modern Marketplace / Clean / Premium / Friendly**.
- Đồng bộ nhận diện thương hiệu **Tất Tần Tật** với màu xanh lá chủ đạo.
- Ưu tiên nền trắng, xanh thương hiệu, xám rất nhạt; hạn chế viền đậm.
- Form phải nổi bật trên banner nhiều màu nhưng không che quá nhiều hình nền.
- Bo góc mềm mại, shadow tinh tế, tránh hiệu ứng quá nặng.
- Thiết kế desktop trước nhưng phải responsive tốt cho tablet/mobile.

## 3. Thiết kế form tìm kiếm mới

### 3.1. Container
- Chiều rộng desktop khoảng **760–900px**, tùy không gian banner.
- Chiều cao khoảng **64–72px**.
- Background: `#FFFFFF` hoặc trắng hơi trong suốt.
- Border radius: **18–22px**.
- Có `box-shadow` nhẹ để tách form khỏi ảnh banner.
- Có thể thêm border `1px solid rgba(0,0,0,0.05)`.
- Padding trong form thoáng, cân đối.
- Căn giữa theo chiều ngang banner.

### 3.2. Ô nhập từ khóa
Chiếm khoảng **55–60%** chiều rộng form.

Bố cục:
`[Icon Search]  Bạn đang tìm gì?`

Yêu cầu:
- Icon kính lúp kích thước 20–22px.
- Placeholder đổi từ **“Tìm trên Tất Tần Tật...”** thành:
  **“Bạn đang tìm gì?”**
- Font 15–16px.
- Không dùng border riêng bao quanh input.
- Khi focus:
  - Không xuất hiện outline mặc định của trình duyệt.
  - Icon hoặc vùng focus chuyển nhẹ sang xanh thương hiệu.
- Có nút `×` nhỏ để xóa nhanh nội dung khi người dùng đã nhập từ khóa.

### 3.3. Bộ chọn khu vực
Chiếm khoảng **22–25%** chiều rộng.

Hiển thị:
`[Icon vị trí] Toàn quốc  [Chevron Down]`

Yêu cầu:
- Có đường divider dọc mảnh ngăn với ô tìm kiếm.
- Icon location rõ ràng.
- Toàn bộ vùng location có thể click.
- Hover có background xanh/xám rất nhạt.
- Khi mở dropdown, hiển thị:
  - Ô tìm tỉnh/thành.
  - “Toàn quốc”.
  - Các tỉnh/thành phổ biến hoặc gần đây.
  - Danh sách tỉnh/thành đầy đủ.
- Dropdown bo góc 14–16px, shadow nhẹ.
- Có thể hỗ trợ lưu địa điểm người dùng chọn gần nhất.

### 3.4. Nút “Tìm kiếm”
Thiết kế nút CTA nổi bật hơn hiện tại.

Nội dung:
`[Icon Search] Tìm kiếm`

Yêu cầu:
- Background xanh thương hiệu.
- Chữ trắng, font-weight 600–700.
- Chiều cao gần bằng chiều cao bên trong form.
- Border radius **14–18px**.
- Padding ngang khoảng 24–30px.
- Hover: xanh đậm hơn nhẹ + shadow.
- Active: hiệu ứng nhấn xuống nhẹ.
- Transition 150–200ms.
- Không dùng hiệu ứng gradient quá mạnh.

## 4. Gợi ý tìm kiếm nhanh
Bổ sung một hàng nhỏ ngay bên dưới form tìm kiếm:

**Tìm kiếm phổ biến:** iPhone · Xe máy · Máy ảnh · Việc làm · Nhà đất

Yêu cầu:
- Không làm banner rối.
- Font khoảng 13–14px.
- Mỗi từ khóa có thể click để tìm nhanh.
- Màu chữ đủ tương phản với background banner.
- Có thể dùng nền trắng trong suốt nhẹ hoặc text-shadow rất nhẹ nếu cần tăng khả năng đọc.

## 5. Autocomplete / Search Suggestions
Khi người dùng nhập từ khóa, hiển thị dropdown ngay dưới form.

Ví dụ khi nhập “iPhone”:
- 🔍 iPhone 16 Pro Max
- 🔍 iPhone 15
- 📱 Điện thoại Apple
- 🕘 iPhone 14 Pro Max
- 🔥 iPhone cũ giá tốt

Dropdown gồm tối đa 6–8 kết quả và có thể chia:
- Từ khóa gợi ý.
- Danh mục phù hợp.
- Lịch sử tìm kiếm.
- Từ khóa phổ biến.

Yêu cầu:
- Dropdown rộng theo vùng tìm kiếm hoặc toàn form.
- Background trắng.
- Border radius 14–18px.
- Shadow hiện đại.
- Item cao khoảng 44–48px.
- Hover item có nền xanh rất nhạt.
- Highlight phần từ khóa trùng với nội dung người dùng nhập.
- Hỗ trợ điều hướng bằng phím `↑`, `↓`, `Enter`, `Esc`.

## 6. Trạng thái tương tác
Thiết kế đầy đủ các state:
- Default.
- Hover.
- Focus.
- Typing.
- Loading.
- Autocomplete opened.
- No results.
- Error.
- Disabled nếu cần.

Khi nhấn tìm kiếm:
- Nút có thể hiển thị spinner nhỏ.
- Tránh người dùng click nhiều lần liên tục.

## 7. Responsive

### Desktop ≥ 1024px
Giữ bố cục ngang:
`[Từ khóa] | [Khu vực] [Tìm kiếm]`

### Tablet
- Giảm chiều rộng và padding hợp lý.
- Vẫn ưu tiên giữ một hàng nếu đủ không gian.

### Mobile ≤ 640px
Chuyển thành bố cục dễ bấm:
- Hàng 1: ô nhập từ khóa.
- Hàng 2: khu vực + nút Tìm kiếm.
- Hoặc full-width từng thành phần nếu màn hình nhỏ.
- Touch target tối thiểu khoảng 44px.
- Không để text/icon bị tràn.

## 8. Accessibility
- Input phải có `aria-label`.
- Location selector hỗ trợ keyboard.
- Dropdown autocomplete sử dụng semantics phù hợp.
- Màu chữ/nền đảm bảo contrast tốt.
- Focus state rõ ràng nhưng đẹp.
- Nút tìm kiếm phải dùng `<button>` thật.
- Cho phép submit bằng phím Enter.

## 9. Yêu cầu UX
- Form tìm kiếm phải là điểm tập trung thị giác chính của banner.
- Người dùng nhìn vào phải hiểu ngay 3 hành động:
  **Nhập thứ cần tìm → Chọn khu vực → Tìm kiếm.**
- Không làm form quá nhiều màu.
- Không sử dụng icon 3D trong form; ưu tiên icon outline đồng nhất.
- Khoảng cách giữa icon, text, divider và button phải nhất quán.
- Không làm form quá cao hoặc chiếm quá nhiều banner.
- Giữ hình mascot và nội dung banner hiện tại có đủ khoảng thở.

## 10. Yêu cầu triển khai
Thiết kế component có cấu trúc rõ ràng, dễ tái sử dụng:

- `SearchBar`
- `SearchInput`
- `LocationSelector`
- `SearchButton`
- `SearchSuggestions`
- `PopularKeywords`

Nếu dự án đang dùng React/Next.js/Tailwind CSS, ưu tiên triển khai bằng stack hiện có; **không thay đổi framework hoặc kiến trúc dự án nếu không cần thiết**.

Không làm ảnh hưởng:
- Header/navigation hiện tại.
- Banner/hero hiện tại.
- Danh mục bên dưới.
- Logic routing/search đang hoạt động.

Nếu đã có API tìm kiếm, giữ nguyên API và chỉ cải thiện UI/UX. Nếu chưa có autocomplete API, tạo component/mock data có cấu trúc sẵn để kết nối API sau.

## 11. Kết quả mong muốn
Form mới cần tạo cảm giác giống một marketplace hiện đại:
- Sạch hơn form hiện tại.
- CTA rõ hơn.
- Location selector dễ nhận biết hơn.
- Tìm kiếm nhanh hơn nhờ autocomplete.
- Có từ khóa gợi ý.
- Responsive tốt.
- Đồng bộ nhận diện xanh của **Tất Tần Tật**.
- Không phá vỡ bố cục đẹp của banner hiện tại.

## 12. Tiêu chí nghiệm thu
1. Form hiển thị đẹp và cân đối trên banner desktop.
2. Không che mascot hoặc nội dung quan trọng của banner.
3. Input, location và button phân cấp rõ ràng.
4. Hover/focus/active mượt và nhất quán.
5. Enter có thể thực hiện tìm kiếm.
6. Autocomplete hoạt động tốt với bàn phím và chuột.
7. Mobile không overflow và thao tác thuận tiện.
8. Không xuất hiện layout shift đáng kể khi dropdown mở.
9. Không thay đổi chức năng hiện có ngoài phạm vi form tìm kiếm.
10. Tổng thể phải **gọn, hiện đại và cao cấp hơn rõ rệt so với form hiện tại**.
