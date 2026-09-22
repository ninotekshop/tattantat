# PROMPT --- Thiết kế lại Footer Website Tất Tần Tật

## Mục tiêu

Hãy thiết kế lại **Footer của website Tất Tần Tật** dựa trên source code
và giao diện hiện tại.

Website: **www.tattantat.vn**

Đây là nền tảng mua bán/rao vặt đa danh mục.

Footer hiện tại còn khá đơn giản, khoảng cách và bố cục chưa tốt, một số
link bị dính vào nhau và chưa tạo cảm giác chuyên nghiệp.

Hãy nâng cấp footer theo phong cách:

**Modern Marketplace + Clean + Trustworthy + Professional + Friendly**

Không sao chép footer của website khác.

Giữ nguyên nhận diện thương hiệu **Tất Tần Tật**, đặc biệt là: - Logo
hiện tại. - Màu xanh thương hiệu. - Tông trắng/xanh. - Slogan: **"Mua
bán mọi thứ, gần bạn."**

------------------------------------------------------------------------

## 1. Bố cục tổng thể

Thiết kế footer desktop dạng 5 cột:

``` text
┌─────────────────────────────────────────────────────────────────────┐
│ LOGO          MUA BÁN       HỖ TRỢ       VỀ TẤT TẦN TẬT   TẢI APP │
│ Tất Tần Tật   Danh mục      Trợ giúp     Giới thiệu       Google  │
│ slogan        Tin mới       An toàn      Điều khoản       Apple   │
│               Yêu thích     Liên hệ      Bảo mật                   │
│                                                                     │
│               [ THÔNG BÁO BỘ CÔNG THƯƠNG ]                         │
├─────────────────────────────────────────────────────────────────────┤
│ © 2026 Tất Tần Tật                    www.tattantat.vn              │
└─────────────────────────────────────────────────────────────────────┘
```

Footer phải rộng bằng content container của website và responsive.

------------------------------------------------------------------------

## 2. Khu vực thương hiệu

Cột đầu tiên hiển thị logo **Tất Tần Tật**.

Bên dưới:

**Mua bán mọi thứ, gần bạn.**

Có thể thêm mô tả ngắn:

> Nền tảng mua bán, trao đổi và kết nối người mua -- người bán nhanh
> chóng, thuận tiện.

Không để đoạn mô tả quá dài.

Logo phải sử dụng asset hiện tại trong project, không tự tạo logo khác.

------------------------------------------------------------------------

## 3. Cột "Mua bán"

Tiêu đề: **Mua bán**

Các link: - Danh mục - Tin mới - Sản phẩm nổi bật - Gần bạn - Yêu
thích - Đăng tin miễn phí

Mỗi link nằm trên một dòng riêng.

Không để các link dính liền nhau như footer hiện tại.

Khoảng cách dọc khoảng 10--12px.

Hover: - Chuyển sang màu xanh thương hiệu. - Có transition nhẹ.

------------------------------------------------------------------------

## 4. Cột "Hỗ trợ"

Tiêu đề: **Hỗ trợ**

Các link: - Trung tâm trợ giúp - Hướng dẫn đăng tin - An toàn giao
dịch - Quy định đăng tin - Báo cáo vi phạm - Liên hệ hỗ trợ

Nếu route nào chưa tồn tại, không tự tạo URL giả.

Có thể giữ UI nhưng chỉ liên kết những route thực sự tồn tại.

------------------------------------------------------------------------

## 5. Cột "Về Tất Tần Tật"

Tiêu đề: **Về Tất Tần Tật**

Các link: - Giới thiệu - Điều khoản sử dụng - Chính sách bảo mật - Quy
chế hoạt động - Giải quyết khiếu nại

Nếu website đã có tên route khác thì sử dụng route hiện tại.

------------------------------------------------------------------------

## 6. Tải ứng dụng

Tạo một cột riêng:

### Tải ứng dụng Tất Tần Tật

Text nhỏ:

**Mua bán thuận tiện hơn trên điện thoại.**

Bên dưới đặt 2 badge:

-   Download on the App Store
-   GET IT ON Google Play

Yêu cầu: - Sử dụng badge chính thức của Apple App Store và Google Play
nếu project có asset phù hợp. - Hai badge có kích thước đồng đều. -
Không kéo méo logo. - Desktop có thể xếp dọc hoặc ngang tùy chiều
rộng. - Mobile ưu tiên xếp ngang nếu đủ chỗ, nếu không thì xếp dọc.

Nếu ứng dụng chưa có link Store chính thức: - Không tạo URL giả. - Có
thể để button ở trạng thái chưa liên kết. - Hoặc dùng label nhỏ: **Sắp
ra mắt**. - Component cần sẵn sàng để sau này chỉ cần truyền URL App
Store/Google Play.

------------------------------------------------------------------------

## 7. Thông báo Bộ Công Thương

Bổ sung khu vực:

**Chứng nhận / Thông báo**

Hiển thị logo/badge:

**ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG**

Yêu cầu quan trọng: - Chỉ sử dụng logo/badge Bộ Công Thương hợp lệ. -
Không tự vẽ hoặc biến đổi logo chứng nhận. - Không hiển thị website như
đã được xác nhận/đăng ký nếu thực tế chưa hoàn thành thủ tục tương
ứng. - Nếu website đã có asset và URL xác thực chính thức, sử dụng
asset/link đó. - Khi click badge, mở trang xác nhận tương ứng nếu có. -
External link dùng `target="_blank"` và `rel="noopener noreferrer"`. -
Kích thước badge vừa phải, không lớn hơn logo thương hiệu.

Có thể đặt dưới cột thương hiệu hoặc ở khu vực riêng phía dưới các cột
footer.

------------------------------------------------------------------------

## 8. Social Media

Nếu Tất Tần Tật có tài khoản chính thức, thêm:

**Kết nối với chúng tôi**

Có thể hỗ trợ: - Facebook - YouTube - TikTok - Zalo

Yêu cầu: - Icon khoảng 36--40px. - Hover nhẹ. - Không sử dụng URL giả. -
Chỉ hiển thị social network đã có URL thực tế trong
config/database/source.

------------------------------------------------------------------------

## 9. Footer Bottom

Tạo divider mảnh.

Bên trái:

**© 2026 Tất Tần Tật. Mọi quyền được bảo lưu.**

Bên phải:

**www.tattantat.vn**

Có thể bổ sung: - Điều khoản - Chính sách bảo mật

Không lặp quá nhiều link đã có phía trên.

------------------------------------------------------------------------

## 10. Phong cách thiết kế

Ưu tiên footer nền sáng để đồng bộ website hiện tại.

Background: - `#FFFFFF` - hoặc `#F8FAF9`

Footer top có border nhẹ: - `#E5E7EB`

Có thể sử dụng một vùng xanh rất nhạt để phân biệt footer với content.

Không sử dụng quá nhiều shadow.

------------------------------------------------------------------------

## 11. Phương án nhấn thương hiệu

Có thể thêm một strip mỏng phía trên footer:

``` text
┌───────────────────────────────────────────────────────────────┐
│ 🛡 Mua bán an toàn     ⚡ Đăng tin nhanh     💬 Hỗ trợ       │
└───────────────────────────────────────────────────────────────┘
```

Chỉ thêm nếu không khiến footer quá cao.

Không biến footer thành khu vực quảng cáo.

------------------------------------------------------------------------

## 12. Typography

Giữ font hiện tại của website.

Footer Heading: - 15--16px. - Font weight 600--700.

Footer Link: - 14px. - Font weight 400--500.

Description: - 13--14px. - Màu neutral gray. - Line-height khoảng
1.5--1.6.

------------------------------------------------------------------------

## 13. Spacing

Footer desktop: - Padding top/bottom khoảng 48--56px. - Khoảng cách giữa
các cột: 32--48px. - Khoảng cách giữa heading và link: 16--20px. -
Khoảng cách giữa từng link: 10--12px.

Không để các link dính vào nhau.

------------------------------------------------------------------------

## 14. Responsive

### Desktop ≥ 1200px

5 cột:

**Logo \| Mua bán \| Hỗ trợ \| Tất Tần Tật \| Tải ứng dụng**

### Tablet

Có thể chuyển thành 3 cột + 2 cột ở hàng tiếp theo.

### Mobile

Chuyển thành 1--2 cột.

Ưu tiên thứ tự: 1. Logo 2. Tải ứng dụng 3. Mua bán / Hỗ trợ 4. Về Tất
Tần Tật 5. Bộ Công Thương 6. Social 7. Copyright

Không để footer mobile quá dài vì khoảng trắng thừa.

------------------------------------------------------------------------

## 15. App Store / Google Play trên mobile

Badge phải dễ bấm.

Touch target tối thiểu khoảng 44px.

Không kéo badge quá rộng.

Có thể bố trí:

`[ App Store ] [ Google Play ]`

trên cùng một hàng nếu màn hình đủ rộng.

------------------------------------------------------------------------

## 16. Accessibility

-   Logo có `alt="Tất Tần Tật"`.
-   Badge App Store có alt phù hợp.
-   Badge Google Play có alt phù hợp.
-   Logo Bộ Công Thương có alt phù hợp.
-   Social icon có `aria-label`.
-   Link có focus state.
-   Contrast đạt mức dễ đọc.
-   Không sử dụng icon mà không có accessible name.

------------------------------------------------------------------------

## 17. Performance

-   Sử dụng SVG/WebP/PNG tối ưu phù hợp với asset.
-   Không tải ảnh badge kích thước quá lớn.
-   Không thêm thư viện mới chỉ để làm footer.
-   Reuse icon library hiện tại.
-   Không gây layout shift.

------------------------------------------------------------------------

## 18. Component hóa

Nếu project sử dụng React/Next.js hoặc kiến trúc component tương tự, có
thể chia:

-   Footer
-   FooterBrand
-   FooterColumn
-   AppDownload
-   CommerceCertification
-   SocialLinks
-   FooterBottom

Không component hóa quá mức nếu source hiện tại đơn giản.

------------------------------------------------------------------------

## 19. Không hard-code URL không tồn tại

Kiểm tra route/config hiện tại trước khi tạo link.

Đặc biệt: - App Store URL. - Google Play URL. - Bộ Công Thương
verification URL. - Facebook. - TikTok. - YouTube. - Zalo.

Nếu chưa có URL thật, không tự đoán.

------------------------------------------------------------------------

## 20. Giao diện mong muốn

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ [LOGO]          MUA BÁN       HỖ TRỢ        VỀ TẤT TẦN TẬT    TẢI APP │
│ Tất Tần Tật     Danh mục      Trợ giúp      Giới thiệu        [Apple]  │
│                 Tin mới       An toàn       Điều khoản        [Google] │
│ Mua bán mọi     Gần bạn       Báo cáo       Bảo mật                    │
│ thứ, gần bạn.   Yêu thích     Liên hệ       Quy chế                     │
│                                                                          │
│ [ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG]                ○ FB ○ TikTok ○ YouTube  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ © 2026 Tất Tần Tật. Mọi quyền được bảo lưu.       www.tattantat.vn     │
└──────────────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

## 21. Yêu cầu chỉnh source

Không chỉ tạo mockup.

Hãy chỉnh trực tiếp Footer component hiện tại.

Trước khi sửa: 1. Xác định component Footer. 2. Kiểm tra logo asset hiện
tại. 3. Kiểm tra routing. 4. Kiểm tra App Store/Google Play URL trong
config/env. 5. Kiểm tra asset/link Bộ Công Thương. 6. Kiểm tra social
URLs. 7. Kiểm tra breakpoint/design tokens hiện tại.

Sau đó mới triển khai.

Không thay đổi Header hoặc Product Grid trong task này.

------------------------------------------------------------------------

## 22. Kiểm tra sau khi hoàn thành

Test: - 1920px - 1440px - 1366px - 1024px - 768px - 430px - 390px

Kiểm tra: - Link không dính nhau. - Không overflow. - Logo đúng tỷ lệ. -
App Store badge đúng tỷ lệ. - Google Play badge đúng tỷ lệ. - Bộ Công
Thương không bị méo. - Footer mobile không vỡ layout. - External link
hoạt động đúng. - Không có console error. - Không có hydration error nếu
sử dụng Next.js.

------------------------------------------------------------------------

# Kết quả mong muốn

Footer mới của **Tất Tần Tật** phải tạo cảm giác:

**Uy tín + Hiện đại + Gọn gàng + Đầy đủ + Đồng bộ thương hiệu**

Footer phải giải quyết được các vấn đề hiện tại: - Link không còn dính
nhau. - Phân cấp nội dung rõ ràng. - Logo thương hiệu nổi bật vừa đủ. -
Có khu vực tải ứng dụng. - Có App Store. - Có Google Play. - Có khu vực
Thông báo Bộ Công Thương. - Có thông tin pháp lý. - Responsive tốt. -
Không quá cao hoặc nặng nề.

Không redesign toàn bộ website. Chỉ tập trung nâng cấp Footer và bảo
toàn chức năng hiện tại.
