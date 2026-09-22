Với Tất Tần Tật, dùng **một prompt tổng thể** để AI/code team xây dựng **Form Engine đăng tin** , thay vì yêu cầu thiết kế từng form rời rạc. 

THIẾT KẾ HỆ THỐNG FORM ĐĂNG TIN TẤT TẦN TẬT 

Tôi đang xây dựng nền tảng marketplace “Tất Tần Tật” — nơi người dùng có thể mua bán mọi loại sản phẩm, phương tiện, bất động sản và dịch vụ. 

Brand: 

- Tên: Tất Tần Tật 

- Slogan: “Mua bán mọi thứ, gần bạn” 

- Màu chủ đạo: xanh lá + trắng 

- Phong cách: hiện đại, thân thiện, chuyên nghiệp, dễ sử dụng 

- Đối tượng: người dùng phổ thông tại Việt Nam 

- Hỗ trợ Desktop Web, Mobile Web và Android App. 

MỤC TIÊU 

Thiết kế một hệ thống “Dynamic Listing Form / Form Engine” có khả năng sử dụng chung cho toàn bộ nền tảng. 

KHÔNG tạo một form code riêng cho từng sản phẩm. 

Thay vào đó: 

Category 

- → Listing Template 

- → Dynamic Fields 

- → Listing Form 

- → Preview 

- → Submit Listing 

Khi người dùng chọn danh mục, hệ thống tự động thay đổi các trường dữ liệu tương ứng. 

================================================== 

1. KIẾN TRÚC DANH MỤC 

================================================== 

Thiết kế tối thiểu 12 nhóm form: 

1. Đồ công nghệ 

- Điện thoại 

- Laptop 

- Máy tính bảng 

- Máy tính để bàn 

- Máy ảnh 

- Máy quay 

- TV 

- Thiết bị âm thanh 

- Phụ kiện công nghệ 

- Máy chơi game 

- Đồng hồ thông minh 

2. Xe cộ 

- Ô tô 

- Xe máy 

- Xe điện 

- Xe tải 

- Xe bán tải 

- Xe khách 

- Xe đạp 

- Phụ tùng & đồ chơi xe 

3. Nhà đất 

- Bán nhà 

- Bán đất 

- Căn hộ 

- Phòng trọ 

- Cho thuê nhà 

- Cho thuê mặt bằng 

- Văn phòng 

- Bất động sản khác 

4. Đồ gia dụng & nội thất 

- Sofa 

- Bàn ghế 

- Tủ 

- Giường 

- Tủ lạnh 

- Máy giặt 

- Điều hòa 

- Thiết bị nhà bếp 

5. Thời trang & phụ kiện 

- Quần áo 

- Giày dép 

- Túi xách 

- Đồng hồ 

- Phụ kiện 

6. Thể thao & giải trí 

- Playstation 

- Xbox 

- Nintendo 

- Dụng cụ thể thao 

- Nhạc cụ 

- Đồ chơi 

7. Sách & học tập 

- Sách 

- Giáo trình 

- Đồ dùng học tập 

8. Máy móc & công cụ 

- Máy móc công nghiệp 

- Dụng cụ 

- Thiết bị xây dựng 

- Thiết bị điện 

9. Đồ sưu tầm 

- Đồng hồ 

- Đồ cổ 

- Mô hình 

- Tem 

- Vật phẩm sưu tầm 

10. Thú cưng & vật dụng 

- Thú cưng 

- Phụ kiện 

- Thức ăn 

11. Hàng hóa khác 

12. Dịch vụ 

- Sửa chữa 

- Vận chuyển 

- Thiết kế 

- Cho thuê 

- Dịch vụ cá nhân 

- Dịch vụ doanh nghiệp 

================================================== 

# 2. FLOW ĐĂNG TIN CHUNG 

================================================== 

Tất cả danh mục sử dụng cùng một flow: 

BƯỚC 1 Chọn danh mục 

BƯỚC 2 Thông tin sản phẩm 

BƯỚC 3 Mô tả chi tiết 

BƯỚC 4 Hình ảnh & video 

BƯỚC 5 Giá & vị trí 

BƯỚC 6 

Thông tin liên hệ 

BƯỚC 7 

Xem trước 

BƯỚC 8 

Xác nhận & đăng tin 

Có progress indicator: 

01 Danh mục 02 Thông tin 03 Hình ảnh 04 Giá & vị trí 05 Liên hệ 06 Xem trước 07 Đăng tin 

Cho phép: 

- Quay lại bước trước 

- Lưu nháp - Tiếp tục sau 

- Tự động lưu dữ liệu 

- Hiển thị lỗi validation 

- Không mất dữ liệu khi quay lại 

================================================== 

3. FORM THÔNG TIN CHUNG 

================================================== 

Mọi listing phải có: 

- Tiêu đề 

- Danh mục 

- Danh mục con 

- Tình trạng 

- Giá 

- Cho phép thương lượng 

- Mô tả 

- Tỉnh/thành 

- Quận/huyện 

- Phường/xã 

- Địa chỉ 

- Họ tên người bán 

- Số điện thoại 

- Email 

- Hình ảnh 

- Video 

================================================== 

4. FORM ĐỘNG 

================================================== 

Thiết kế cơ chế Dynamic Fields. 

Ví dụ: 

Người dùng chọn: 

Đồ công nghệ 

→ Điện thoại 

Hiển thị: 

- Hãng 

- Model 

- RAM 

- Bộ nhớ 

- Màu sắc 

- Màn hình 

- Camera 

- Pin 

- SIM 

- 5G 

- Hệ điều hành 

- Xuất xứ 

- Bảo hành 

Nếu chọn: 

Đồ công nghệ 

→ Laptop 

Hiển thị: 

- Hãng 

- Model 

- CPU 

- RAM 

- SSD/HDD 

- GPU 

- Kích thước màn hình 

- Độ phân giải 

- Hệ điều hành 

- Pin 

- Tình trạng 

- Bảo hành 

Nếu chọn: 

Xe cộ 

→ Ô tô 

Hiển thị: 

- Hãng xe 

- Dòng xe 

- Phiên bản 

- Năm sản xuất 

- Số km 

- Hộp số 

- Nhiên liệu 

- Dung tích động cơ 

- Số chỗ 

- Màu sắc 

- Xuất xứ 

- Tình trạng 

- Đăng kiểm 

- Lịch sử bảo dưỡng 

Nếu chọn: 

Xe cộ 

- → Xe máy 

Hiển thị: 

- Hãng 

- Dòng xe 

- Năm sản xuất 

- Số km 

- Dung tích 

- Loại xe 

- Hộp số 

- Màu sắc 

- Xuất xứ 

- Giấy tờ 

# - Bảo hành 

Nếu chọn: 

Nhà đất 

- → Bán nhà 

Hiển thị: 

- Loại nhà 

- Diện tích đất 

- Diện tích sử dụng 

- Số tầng 

- Số phòng ngủ 

- Số WC 

- Hướng nhà 

- Mặt tiền 

- Đường vào 

- Pháp lý 

- Nội thất 

- Tình trạng 

- Địa chỉ 

Nếu chọn: 

Nhà đất 

→ Bán đất 

Hiển thị: 

- Loại đất 

- Diện tích 

- Chiều ngang 

- Chiều dài 

- Hướng 

- Đường vào 

- Pháp lý 

- Quy hoạch 

- Vị trí 

- Địa chỉ 

================================================== 

5. MEDIA UPLOAD 

================================================== 

Thiết kế component upload dùng chung. 

Cho phép: 

- Tối đa 20 ảnh 

- Tối đa 3 video 

- Kéo thả thay đổi thứ tự 

- Chọn ảnh đại diện 

- Xóa ảnh 

- Crop ảnh 

- Preview ảnh 

- Upload progress 

- Compress ảnh 

- Kiểm tra dung lượng 

- Kiểm tra định dạng 

Hiển thị cảnh báo: 

“Ảnh rõ nét và đủ sáng giúp tin đăng nhận được nhiều lượt xem hơn.” 

================================================== 

# 6. GIÁ 

================================================== 

Component giá phải hỗ trợ: 

- Giá cố định 

- Có thể thương lượng 

- Liên hệ 

- Miễn phí 

- Theo giờ 

- Theo ngày 

- Theo tháng 

- Theo m² 

Tự thay đổi theo loại listing. 

Ví dụ: 

Nhà đất: 

500.000.000 đ 

Cho thuê: 

12.000.000 đ/tháng 

Dịch vụ: 

500.000 đ/giờ 

================================================== 

7. VỊ TRÍ 

================================================== 

Thiết kế location picker: 

Tỉnh/thành 

→ Quận/huyện → Phường/xã 

Cho phép: 

- GPS 

- Chọn trên bản đồ 

- Nhập địa chỉ 

- Ẩn địa chỉ chính xác nếu người bán muốn 

Hiển thị bản đồ preview. 

================================================== 

8. PREVIEW LISTING 

================================================== 

Khi người dùng hoàn thành form: 

Hiển thị preview giống giao diện listing thật. 

Bao gồm: 

- Ảnh đại diện 

- Gallery 

- Tiêu đề 

- Giá 

- Thông tin sản phẩm 

- Mô tả 

- Vị trí 

- Người bán 

- Nút gọi điện 

- Nút nhắn tin 

- Nút yêu thích 

- Nút chia sẻ 

Có nút: 

[← Chỉnh sửa] 

[Xác nhận đăng tin] 

================================================== 

9. VALIDATION 

================================================== 

Thiết kế validation rõ ràng. 

Required fields: 

- Danh mục 

- Tiêu đề 

- Giá 

- Tình trạng 

- Mô tả 

- Ít nhất 1 ảnh 

- Vị trí 

- Số điện thoại 

Thông báo lỗi bằng tiếng Việt. 

Ví dụ: 

“Vui lòng nhập tiêu đề tin đăng.” 

“Vui lòng thêm ít nhất 1 hình ảnh.” 

“Giá bán không hợp lệ.” 

================================================== 

10. UI/UX 

================================================== 

Phong cách: 

- Material 3 

- Clean UI 

- Card-based layout 

- Border radius 10–14px 

- Khoảng cách rộng, dễ thao tác 

- Font tiếng Việt rõ ràng 

- Primary: xanh lá thương hiệu Tất Tần Tật 

- Secondary: xanh nhạt 

- Background: #F7FAF8 

- Text: xanh đậm / đen 

- Error: đỏ 

- Warning: cam 

Desktop: 

3 cột: 

LEFT 

Navigation / Progress 

CENTER Form RIGHT Preview + Tips + Support 

Mobile: 1 cột: Header ↓ Progress ↓ Form ↓ Preview ↓ CTA 

CTA mobile phải sticky: 

[Tiếp tục →] 

================================================== 

11. ADMIN FORM ENGINE ================================================== 

Thiết kế thêm giao diện Backend để Admin quản lý Dynamic Fields. 

Admin có thể: 

- Tạo category 

- Tạo subcategory 

- Tạo field 

- Xóa field 

- Sắp xếp field 

- Bật/tắt field 

- Required / Optional 

- Chọn loại field 

- Tạo option 

- Điều kiện hiển thị field 

- Thiết lập validation 

Field types: 

text textarea number currency select multi-select radio checkbox date 

year location image video boolean range 

Ví dụ: 

Field: 

“Nhiên liệu” Type: select 

Options: - Xăng - Dầu - Hybrid - Điện 

================================================== 12. DATABASE 

================================================== 

Thiết kế Form Engine tương thích PostgreSQL. 

Kiến trúc: 

categories listing_templates listing_fields listing_field_options listing_field_values listings listing_images listing_videos 

Không tạo bảng riêng cho từng loại sản phẩm. 

Ví dụ: categories ↓ listing_templates ↓ listing_fields ↓ listing_field_options User nhập: listing_field_values Listing cuối cùng: listings ================================================== 13. API ================================================== Thiết kế REST API: GET /categories GET /categories/{id} GET /listing-templates/{categoryId} GET /listing-fields/{templateId} 

POST /listings/draft 

PUT /listings/{id} POST /listings/{id}/images POST /listings/{id}/videos POST /listings/{id}/publish 

GET /listings/{id} 

================================================== 14. MÀN HÌNH CẦN THIẾT KẾ ================================================== 

Tạo đầy đủ UI cho: 

1. Chọn danh mục 2. Chọn danh mục con 3. Form đồ công nghệ 4. Form xe cộ 5. Form nhà đất 6. Form đồ gia dụng 7. Form thời trang 8. Form thể thao & giải trí 9. Form sách 10. Form máy móc 11. Form đồ sưu tầm 12. Form thú cưng 

13. Form hàng hóa khác 

14. Form dịch vụ 15. Upload hình ảnh 16. Chọn vị trí 17. Xem trước tin 18. Xác nhận đăng 19. Đăng thành công 20. Lưu bản nháp 21. Danh sách tin nháp 22. Chỉnh sửa tin 23. Quản lý Dynamic Fields trên Admin 

================================================== 

15. DELIVERABLE 

================================================== 

Tạo: 

- A. UI Design - Desktop 1440px - Mobile 390×844 

- Android 1080×2400 

- B. Component Library - Input - Select - Radio 

- Checkbox - Upload - Price 

- Location - Product Preview 

- Stepper 

- Validation - CTA C. Frontend Ưu tiên: 

Web: Next.js + TypeScript + Tailwind CSS 

Android: Kotlin + Jetpack Compose 

Backend: NestJS + TypeScript 

Database: PostgreSQL 

================================================== 

16. YÊU CẦU QUAN TRỌNG ================================================== 

Không hard-code form theo từng sản phẩm. 

Form phải được render từ: 

Category → Template → Field configuration → Options → Validation 

→ Conditional visibility 

Mục tiêu cuối cùng: 

Admin có thể tạo một loại sản phẩm mới mà KHÔNG cần sửa source code frontend. 

Ví dụ Admin tạo: 

“Thiết bị quay phim” 

Thêm fields: 

- Hãng 

- Model 

- Độ phân giải 

- Cảm biến 

- Ống kính 

- Tình trạng 

- Bảo hành 

Sau khi lưu, app và website tự động hiển thị form mới. 

Hãy thiết kế hệ thống theo hướng: 

SCALABLE 

MAINTAINABLE 

API-FIRST 

MOBILE-FIRST 

VIETNAMESE UX 

và sẵn sàng mở rộng Tất Tần Tật từ Quy Nhơn ra toàn Việt Nam. 

**Tôi khuyên triển khai prompt này theo 3 giai đoạn** 

**Giai đoạn 1:** thiết kế UI/UX + Component Library 

→ hoàn thiện 12 nhóm form. 

**Giai đoạn 2:** xây **Form Engine + PostgreSQL** 

→ đây là phần quan trọng nhất, giúp sau này thêm hàng trăm loại sản phẩm mà không phải lập trình lại. 

**Giai đoạn 3:** kết nối Web + Android + Admin cùng một API. 

Như vậy các form **Đăng bán xe, Đăng bán đồ công nghệ và Đăng bán nhà đất** mà chúng ta vừa thiết kế sẽ không phải là 3 hệ thống riêng, mà trở thành **3 template đầu tiên của cùng một Form Engine Tất Tần Tật** . 

