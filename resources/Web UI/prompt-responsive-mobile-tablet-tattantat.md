# PROMPT THIẾT KẾ RESPONSIVE WEB --- TẤT TẦN TẬT

## 0. Vai trò

Bạn là **Senior Product Designer + Senior UX/UI Designer + Senior
Frontend Engineer** chuyên thiết kế marketplace responsive.

Hãy phân tích toàn bộ codebase hiện tại của **Tất Tần Tật ---
tattantat.vn** và nâng cấp giao diện thành **Mobile-first Responsive
Web** thân thiện với:

-   Điện thoại Android/iPhone.
-   Máy tính bảng.
-   Laptop.
-   Desktop.

Mục tiêu là **nâng cấp responsive trên codebase hiện tại**, không viết
lại toàn bộ website, không thay framework/UI stack nếu không thực sự cần
và không làm hỏng các chức năng đang hoạt động.

------------------------------------------------------------------------

# 1. Mục tiêu UX

Website phải tạo cảm giác như một marketplace hiện đại trên mobile:

-   dễ đọc;
-   dễ chạm;
-   thao tác một tay;
-   tìm kiếm nhanh;
-   xem ảnh thuận tiện;
-   đăng tin đơn giản;
-   không phải zoom trình duyệt;
-   không có horizontal scroll;
-   CTA quan trọng luôn dễ tiếp cận;
-   loading nhanh trên mạng di động;
-   tablet tận dụng tốt không gian thay vì chỉ phóng lớn mobile.

Giữ nhận diện hiện tại của Tất Tần Tật:

``` text
Logo Tất Tần Tật
Primary Green
Nền sáng
Card sạch
Bo góc mềm
Phong cách thân thiện
```

------------------------------------------------------------------------

# 2. Audit trước khi sửa

Trước khi code, kiểm tra:

1.  Framework.
2.  CSS solution.
3.  Design tokens.
4.  Header/Footer.
5.  Homepage.
6.  Search form.
7.  Category menu.
8.  Listing cards.
9.  Search result.
10. Filter.
11. Listing detail.
12. Gallery/lightbox.
13. Login/Register popup.
14. Dynamic Posting Engine.
15. Location Selector.
16. Favorites.
17. Messages/Chat.
18. Account pages.
19. Admin --- chỉ kiểm tra responsive nếu Admin nằm trong scope.
20. Existing breakpoints.
21. Fixed widths.
22. Overflow.
23. Tables.
24. Modals.
25. Images.
26. Current Core Web Vitals/performance nếu tooling sẵn có.

Báo cáo ngắn:

``` text
CURRENT RESPONSIVE STATE
ISSUES
TARGET
IMPLEMENTATION PLAN
```

Sau đó mới triển khai.

------------------------------------------------------------------------

# 3. Mobile-first

Ưu tiên CSS mobile-first.

Không thiết kế desktop xong rồi ép nhỏ bằng scale.

Các component phải tự thích nghi theo viewport.

Gợi ý breakpoints:

``` text
< 480px       Small Mobile
480–767px     Mobile
768–1023px    Tablet
1024–1279px   Small Desktop
>=1280px      Desktop
```

Nếu project đã có breakpoint system tốt thì tái sử dụng, không tạo hệ
breakpoint thứ hai.

------------------------------------------------------------------------

# 4. Container

Không dùng fixed width gây tràn màn hình.

Gợi ý:

``` css
width: 100%;
max-width: 1200px;
margin-inline: auto;
```

Padding responsive tương đương:

``` text
Mobile:       12–16px
Tablet:       20–24px
Desktop:      24–32px
```

Tôn trọng `safe-area-inset-*` trên thiết bị có notch/home indicator khi
có bottom navigation/sticky CTA.

------------------------------------------------------------------------

# 5. Typography Responsive

Đảm bảo body text trên mobile dễ đọc.

Gợi ý:

``` text
Body:             14–16px
Secondary:        13–14px
Listing title:    15–17px
Page title mobile:20–24px
Page title desktop:28–32px
```

Không dùng chữ quá nhỏ để nhồi nội dung.

Line-height khoảng:

``` text
1.4–1.7
```

Tôn trọng typography/design tokens hiện tại.

------------------------------------------------------------------------

# 6. Touch Target

Mọi interactive element quan trọng:

``` text
min 44×44px
```

Bao gồm:

-   menu;
-   favorite;
-   close;
-   previous/next;
-   checkbox;
-   radio;
-   select;
-   tab;
-   pagination;
-   filter;
-   chat;
-   back;
-   account.

Không đặt các icon action sát nhau đến mức dễ bấm nhầm.

------------------------------------------------------------------------

# 7. Header Desktop

Giữ desktop navigation đầy đủ nếu đang phù hợp:

``` text
Logo | Search | Khu vực | Trang chủ | Yêu thích | Tin nhắn | Tài khoản | Đăng tin
```

Tối ưu spacing, alignment và không để search quá hẹp.

------------------------------------------------------------------------

# 8. Header Tablet

Tablet ưu tiên:

``` text
Logo
Search
Location
Account
Đăng tin
```

Các navigation ít quan trọng có thể chuyển vào menu.

Không để header wrap thành 2--3 dòng hỗn loạn.

------------------------------------------------------------------------

# 9. Header Mobile

Thiết kế lại thành header compact.

Gợi ý:

``` text
┌───────────────────────────────────┐
│ Logo                        🔔 👤 │
│                                   │
│ 🔎 Bạn đang tìm gì?               │
│ 📍 Khu vực                     ▼  │
└───────────────────────────────────┘
```

Hoặc một cấu trúc tương đương phù hợp UI hiện tại.

Search phải là chức năng nổi bật nhất.

------------------------------------------------------------------------

# 10. Bottom Navigation Mobile

Ở viewport mobile, triển khai bottom navigation nếu phù hợp với
navigation hiện tại:

``` text
⌂
Trang chủ

♡
Yêu thích

＋
Đăng tin

💬
Tin nhắn

👤
Tài khoản
```

Yêu cầu:

-   fixed/sticky hợp lý;
-   safe-area;
-   không che content;
-   active state rõ;
-   CTA `Đăng tin` nổi bật nhưng không quá phô trương;
-   không hiển thị đồng thời quá nhiều navigation trùng lặp.

Desktop/tablet lớn không cần bottom nav.

------------------------------------------------------------------------

# 11. Trang chủ --- Hero/Search

Banner/hero hiện tại phải responsive.

Desktop: - giữ banner ngang; - search có thể nằm trong vùng trung tâm
nếu thiết kế hiện tại dùng pattern này.

Tablet: - giảm decorative content; - giữ search rõ.

Mobile: - không cố nhét toàn bộ banner desktop vào màn hình; - ưu tiên
Logo/Search/Location/Category; - mascot/hình trang trí có thể crop, thu
nhỏ hoặc ẩn nếu ảnh hưởng usability.

Không làm chữ/hình hero bị méo.

------------------------------------------------------------------------

# 12. Form tìm kiếm Mobile

Mobile ưu tiên:

``` text
[ 🔎 Tìm sản phẩm, dịch vụ... ]

[ 📍 Toàn quốc / Khu vực      ▼ ]
```

CTA Search có thể tích hợp icon hoặc button phù hợp.

Không ép 3 input desktop nằm chung một hàng trên điện thoại.

------------------------------------------------------------------------

# 13. Location Selector

Dùng Location Engine hiện tại.

Desktop:

``` text
Popover
```

Mobile:

``` text
Bottom Sheet / Full Screen
```

Tablet: - popover lớn hoặc modal/sheet tùy viewport.

Không dùng dropdown bé khó cuộn trên điện thoại.

------------------------------------------------------------------------

# 14. Category trên trang chủ

Desktop:

``` text
nhiều cột
```

Tablet:

``` text
4–6 items/row tùy kích thước
```

Mobile:

``` text
4 items/row
```

hoặc horizontal category carousel nếu kiểm thử cho UX tốt hơn.

Mỗi item: - icon lớn; - tên tối đa 2 dòng; - touch target rộng; - không
chữ quá nhỏ.

Category data lấy từ Category Engine.

------------------------------------------------------------------------

# 15. Listing Card

Tạo một responsive ListingCard dùng thống nhất.

Card có:

``` text
Ảnh
Badge nếu có
Favorite
Tiêu đề
Giá
Khu vực
Thời gian
```

Không nhồi seller metadata không cần thiết.

------------------------------------------------------------------------

# 16. Listing Grid

Gợi ý:

``` text
Small Mobile: 2 columns
Mobile:       2 columns
Tablet:       3 columns
Laptop:       4 columns
Large:        4–5 columns
```

Nếu card hiện tại cần nhiều thông tin và 2 cột ở màn hình rất nhỏ gây
khó đọc, cho phép chuyển 1 cột ở breakpoint phù hợp sau khi kiểm thử.

Không hard-code width card.

Dùng Grid/Flex.

------------------------------------------------------------------------

# 17. Listing Image

Ảnh:

``` text
aspect-ratio: 1 / 1
object-fit: cover
```

hoặc ratio hiện tại nếu design system quy định khác.

Lazy-load ảnh ngoài viewport.

Không để layout shift khi ảnh load.

------------------------------------------------------------------------

# 18. Tiêu đề Card

Mobile:

``` text
max 2 lines
```

Dùng line-clamp.

Không để một title dài làm card cao gấp đôi các card khác.

------------------------------------------------------------------------

# 19. Giá

Giá phải nổi bật hơn metadata.

Ví dụ hierarchy:

``` text
7.650.000 đ
```

font-weight 700+.

Không để font giá quá lớn trên mobile.

------------------------------------------------------------------------

# 20. Trang kết quả tìm kiếm

Desktop:

``` text
Filter Sidebar | Results
```

Tablet:

``` text
Results
[Filter]
```

Mobile:

``` text
Sort | Filter
```

Không giữ sidebar desktop trên mobile.

------------------------------------------------------------------------

# 21. Filter Mobile

Click:

``` text
☰ Bộ lọc
```

mở:

``` text
Bottom Sheet / Full-screen Filter
```

Header:

``` text
← Bộ lọc                 Đặt lại
```

Footer sticky:

``` text
[ Xem N kết quả ]
```

Nếu backend chưa hỗ trợ count preview hiệu quả, dùng `Áp dụng`.

------------------------------------------------------------------------

# 22. Sort Mobile

Sort dùng bottom sheet:

``` text
Sắp xếp

○ Mới nhất
○ Giá thấp → cao
○ Giá cao → thấp
○ Gần nhất
```

Chỉ hiển thị options backend thực sự hỗ trợ.

------------------------------------------------------------------------

# 23. Active Filters

Trên mobile hiển thị chips horizontal-scroll:

``` text
[Gia Lai ×] [Máy ảnh ×] [5–15 triệu ×]
```

Có:

``` text
Xóa tất cả
```

Không để chip wrap thành quá nhiều hàng làm mất viewport.

------------------------------------------------------------------------

# 24. Trang chi tiết tin --- Desktop

Desktop:

``` text
Main content        HOT sidebar
```

Main:

``` text
Gallery
Listing info
Seller
Description
Attributes
Safety
Related
```

Giữ cấu trúc đã triển khai nếu hiện tại tốt.

------------------------------------------------------------------------

# 25. Trang chi tiết --- Tablet

Tablet chuyển:

``` text
Gallery
Info
Seller
Description
HOT carousel
Related
```

Không giữ sidebar quá hẹp.

------------------------------------------------------------------------

# 26. Trang chi tiết --- Mobile

Thứ tự ưu tiên:

``` text
Gallery
Title
Price
Location / Time
Actions
Seller
Attributes
Description
Safety
HOT
Related
```

Không có khoảng trắng thừa lớn.

------------------------------------------------------------------------

# 27. Gallery Mobile

Gallery phải hỗ trợ:

-   swipe;
-   image counter;
-   tap mở lightbox;
-   pinch zoom nếu lightbox/library hỗ trợ;
-   double-tap zoom nếu phù hợp;
-   close dễ chạm.

Không mở ảnh trong tab/window mới.

------------------------------------------------------------------------

# 28. Sticky CTA trên trang chi tiết

Mobile có bottom action bar phía trên bottom navigation hoặc thay thế
theo context:

``` text
[ ♡ ] [ Nhắn tin ] [ Mua / Đặt mua ]
```

Chỉ hiển thị CTA thực sự có trong nghiệp vụ.

Nếu listing chỉ hỗ trợ Chat:

``` text
[ ♡ Lưu ] [ Nhắn tin người bán ]
```

Không expose số điện thoại/email cá nhân.

------------------------------------------------------------------------

# 29. Seller Card Mobile

Hiển thị gọn:

``` text
Avatar  Shop Demo
        ✓ nếu verified thật
        Xem trang người bán >
```

CTA rõ.

Không đưa thông tin riêng tư vào public UI.

------------------------------------------------------------------------

# 30. Description Mobile

Body:

``` text
15–16px
line-height ~1.6
```

Nếu dài:

``` text
Xem thêm
Thu gọn
```

Không dùng khung scroll riêng cho description.

------------------------------------------------------------------------

# 31. Attributes Mobile

Không dùng table rộng desktop.

Chuyển:

``` text
Tình trạng       Đã sử dụng
Thương hiệu      Canon
Model             EOS R8
Bảo hành          5 tháng
```

Có thể grid 2 cột label/value.

Label/value phải wrap được.

------------------------------------------------------------------------

# 32. Dynamic Posting Engine --- Mobile

Wizard Đăng tin phải mobile-first.

Mỗi màn hình chỉ tập trung vào task hiện tại.

``` text
← Đăng tin

Bước 2/5
Thông tin sản phẩm
```

CTA sticky:

``` text
[ Tiếp tục ]
```

Không để user phải scroll ngược lên đầu để sang bước.

------------------------------------------------------------------------

# 33. Dynamic Fields Mobile

Input:

``` text
width: 100%
```

Select không quá nhỏ.

Brand → Model: - mỗi field một hàng; - loading rõ; - không dùng desktop
two-column khi màn hình hẹp.

------------------------------------------------------------------------

# 34. Upload ảnh Mobile

Hiển thị grid thumbnail.

Cho phép:

``` text
+ Thêm ảnh
📷 Chụp ảnh
```

nếu browser/device hỗ trợ.

Cover image phải dễ nhận biết.

Reorder bằng drag nếu mobile UX ổn; nếu không, có controls rõ ràng.

------------------------------------------------------------------------

# 35. Draft / Save Status

Trên mobile hiển thị nhỏ:

``` text
✓ Đã lưu
```

Không tạo toast liên tục mỗi lần auto-save.

------------------------------------------------------------------------

# 36. Login / Register Popup

Desktop:

``` text
Modal
```

Mobile:

``` text
Full-screen modal / Bottom Sheet lớn
```

Không để modal rộng hơn viewport.

Keyboard mở không được che input/CTA.

------------------------------------------------------------------------

# 37. Social Login

Buttons:

``` text
Google
Facebook
Apple
Số điện thoại
```

Full width trên mobile.

Khoảng cách đủ lớn.

------------------------------------------------------------------------

# 38. Keyboard / Form UX

Input phải dùng đúng HTML input type:

``` text
email
tel
number
search
```

và `inputmode` phù hợp.

Khi keyboard mobile mở: - field active vẫn nhìn thấy; - CTA không che
field; - scroll-to-error đúng.

------------------------------------------------------------------------

# 39. Tin nhắn / Chat

Nếu Chat đã có:

Desktop:

``` text
conversation list | chat
```

Mobile:

``` text
Conversation list
      ↓
Chat full screen
```

Không ép 2 panel cạnh nhau trên điện thoại.

Composer sticky dưới.

Keyboard không che composer.

------------------------------------------------------------------------

# 40. Yêu thích

Mobile dùng cùng ListingGrid.

Empty state:

``` text
Bạn chưa lưu tin nào.
```

CTA:

``` text
Khám phá tin đăng
```

------------------------------------------------------------------------

# 41. Tài khoản

Mobile chuyển menu account thành list:

``` text
Thông tin tài khoản
Tin của tôi
Tin nháp
Yêu thích
Tin nhắn
Cài đặt
Đăng xuất
```

Không dùng sidebar hẹp kiểu desktop.

------------------------------------------------------------------------

# 42. Quản lý tin

Mobile cards thay table nếu table hiện tại quá rộng.

Ví dụ:

``` text
[Ảnh] Canon EOS R8
      18.900.000đ

Trạng thái: Đang hiển thị

[Làm mới] [Sửa] [...]
```

Không bắt horizontal scroll.

------------------------------------------------------------------------

# 43. Tables toàn website

Không cho table desktop gây tràn viewport.

Tùy ngữ cảnh: - responsive table; - card list; - column hiding; -
controlled horizontal scroll chỉ khi dữ liệu thực sự dạng bảng.

------------------------------------------------------------------------

# 44. Modal

Mọi modal phải responsive.

Desktop:

``` text
center modal
```

Mobile:

``` text
bottom sheet / full-screen
```

Không dùng fixed pixel width vượt viewport.

------------------------------------------------------------------------

# 45. Toast / Notification

Mobile toast không che: - Header; - bottom nav; - sticky CTA; -
keyboard.

Không stack quá nhiều toast.

------------------------------------------------------------------------

# 46. Footer

Desktop giữ footer đầy đủ.

Tablet giảm số cột.

Mobile dùng accordion:

``` text
Về Tất Tần Tật        +
Hỗ trợ                +
Chính sách            +
Kết nối               +
```

Thông tin pháp lý quan trọng vẫn phải dễ tìm.

------------------------------------------------------------------------

# 47. Banner quảng cáo

Các banner quảng cáo phải responsive.

Không stretch ảnh 280×280 thành kích thước sai tỷ lệ.

Desktop sidebar:

``` text
280×280
```

Tablet/mobile: - reposition; - responsive slot; - hoặc ẩn nếu policy
quảng cáo cho phép.

Không để quảng cáo làm CLS lớn.

------------------------------------------------------------------------

# 48. Image Strategy

Dùng:

``` text
srcset
sizes
loading=lazy
```

khi phù hợp.

Ảnh hero/LCP cần preload/priority phù hợp.

Không tải ảnh desktop khổng lồ cho mobile nếu CDN/image service hỗ trợ
resize.

------------------------------------------------------------------------

# 49. Performance Mobile

Ưu tiên mạng 4G/chậm.

Giảm: - JS không cần thiết; - bundle thừa; - ảnh quá lớn; - font weight
dư; - API duplicate; - re-render.

Code-split route/component nếu stack hỗ trợ.

------------------------------------------------------------------------

# 50. Core Web Vitals

Tối ưu:

``` text
LCP
INP
CLS
```

Đặc biệt: - reserve image dimensions; - tránh banner shift; - skeleton
đúng kích thước; - không inject content phía trên sau load.

Không chase điểm benchmark bằng cách làm hỏng UX.

------------------------------------------------------------------------

# 51. PWA-ready

Không bắt buộc biến website thành PWA nếu project chưa có.

Nhưng responsive architecture phải sẵn sàng: - mobile viewport; -
touch; - standalone-safe layout; - safe area; - icon/manifest có thể bổ
sung sau.

------------------------------------------------------------------------

# 52. Viewport

Đảm bảo document có viewport đúng:

``` html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Không dùng `user-scalable=no`.

Người dùng phải có quyền zoom vì accessibility.

------------------------------------------------------------------------

# 53. Accessibility

Đạt mức accessibility tốt:

-   semantic HTML;
-   keyboard;
-   focus visible;
-   labels;
-   alt;
-   aria khi cần;
-   contrast;
-   skip navigation nếu phù hợp;
-   modal focus trap;
-   không dựa chỉ vào màu để biểu đạt trạng thái.

------------------------------------------------------------------------

# 54. Orientation

Test cả:

``` text
Portrait
Landscape
```

trên tablet và mobile.

Không assume mobile luôn portrait.

------------------------------------------------------------------------

# 55. Tablet riêng biệt

Không coi tablet chỉ là mobile phóng to.

768--1023px: - tận dụng 2--3 columns; - search rộng hơn; - category
nhiều cột; - gallery/info có thể bố trí linh hoạt; - filter dùng
sheet/drawer; - navigation tinh gọn.

Landscape tablet có thể gần desktop nhưng vẫn phải touch-friendly.

------------------------------------------------------------------------

# 56. Hover

Không dùng hover là cách duy nhất để: - xem action; - xem tooltip quan
trọng; - mở menu; - favorite.

Touch device không có hover ổn định.

------------------------------------------------------------------------

# 57. Responsive Icons

Icon phải: - cùng style; - SVG/icon library hiện tại; - không blur; -
không quá nhỏ; - aria-hidden nếu decorative.

Không dùng emoji cho UI production nếu design system hiện tại đã có icon
set.

------------------------------------------------------------------------

# 58. Empty / Error States

Tất cả page quan trọng có mobile-friendly states:

``` text
Không có kết quả
Không có tin yêu thích
Không có tin nhắn
Không tải được dữ liệu
Mất kết nối
404
```

CTA rõ ràng.

------------------------------------------------------------------------

# 59. Skeleton

Skeleton phải theo đúng layout responsive.

Không dùng skeleton desktop trên mobile.

------------------------------------------------------------------------

# 60. Responsive CSS Architecture

Ưu tiên: - CSS Grid; - Flexbox; - `minmax()`; - `clamp()`; - responsive
design tokens; - container queries nếu stack/browser support phù hợp.

Tránh: - absolute positioning cho layout chính; - hàng loạt magic
numbers; - duplicate media queries; - inline fixed width.

------------------------------------------------------------------------

# 61. Design Tokens

Chuẩn hóa nếu project chưa có:

``` text
--space-*
--radius-*
--font-size-*
--container-*
--header-height-*
--bottom-nav-height
--z-*
```

Không đổi nhận diện thương hiệu hiện tại một cách tùy tiện.

------------------------------------------------------------------------

# 62. Z-index

Thiết lập layer rõ:

``` text
content
sticky
header
dropdown
bottom-nav
overlay
modal
toast
```

Tránh lỗi Location Popover nằm sau banner hoặc modal nằm sau header.

------------------------------------------------------------------------

# 63. Scroll Behavior

Khi modal/sheet mở: - lock background scroll; - restore scroll khi đóng.

Không tạo nested scroll không cần thiết.

------------------------------------------------------------------------

# 64. Safe Area

Mobile bottom elements:

``` css
padding-bottom: env(safe-area-inset-bottom);
```

khi cần.

Bottom navigation/sticky CTA không bị home indicator che.

------------------------------------------------------------------------

# 65. Browser Support

Kiểm tra ít nhất: - Chrome Android; - Safari iOS; - Chrome desktop; -
Safari desktop nếu scope hỗ trợ; - Edge.

Có graceful fallback cho CSS/API mới.

------------------------------------------------------------------------

# 66. Breakpoint QA

Kiểm tra tối thiểu:

``` text
360×800
390×844
430×932
768×1024
820×1180
1024×768
1280×800
1440×900
```

Ngoài ra resize liên tục để tìm breakpoint "gãy".

------------------------------------------------------------------------

# 67. Không thay đổi nghiệp vụ

Responsive redesign không được tự ý thay đổi: - Category Engine; -
moderation; - privacy; - auth; - listing status; - pricing; -
transaction logic.

Chỉ thay đổi nghiệp vụ khi thực sự cần để responsive hoạt động và phải
báo cáo.

------------------------------------------------------------------------

# 68. Không expose thông tin người bán

Trên mobile/desktop vẫn tuân thủ:

``` text
Không public phone
Không public private email
Không public địa chỉ giao dịch chính xác
```

Các CTA giao tiếp sử dụng luồng của Tất Tần Tật.

------------------------------------------------------------------------

# 69. Progressive Rollout

Nếu phạm vi code lớn:

``` text
Phase 1
Shared Layout + Header + Navigation

Phase 2
Homepage + Search + Category

Phase 3
Results + Filter + Listing Card

Phase 4
Listing Detail

Phase 5
Posting + Auth

Phase 6
Account + Chat

Phase 7
QA + Performance
```

Có thể dùng feature flag nếu codebase hiện tại hỗ trợ.

------------------------------------------------------------------------

# 70. Không tạo bản mobile riêng

KHÔNG tạo:

``` text
m.tattantat.vn
```

và không duy trì hai codebase desktop/mobile.

Dùng responsive layout chung.

------------------------------------------------------------------------

# 71. Acceptance Criteria

Chỉ coi là hoàn thành khi:

-   Không horizontal overflow ở viewport chính.
-   Header hoạt động tốt mobile/tablet.
-   Search dễ sử dụng bằng một tay.
-   Location Selector responsive.
-   Category dễ chạm.
-   Listing grid thích nghi.
-   Listing Detail mobile hoàn chỉnh.
-   Gallery swipe/zoom hoạt động nếu library hỗ trợ.
-   Filter mobile dùng sheet/full-screen.
-   Posting Engine mobile-friendly.
-   Auth modal không vỡ khi keyboard mở.
-   Chat usable trên mobile.
-   Account/Manage Listings không phụ thuộc table desktop.
-   Bottom navigation không che content.
-   Sticky CTA không xung đột bottom nav.
-   Footer responsive.
-   Touch target đạt chuẩn.
-   Không expose seller private data.
-   Không phá desktop hiện tại.
-   Build/typecheck/lint/test pass.
-   Không có console error nghiêm trọng.

------------------------------------------------------------------------

# 72. Test thực tế

Không chỉ dùng DevTools width.

Nếu môi trường cho phép, test hành vi tương đương: - iPhone viewport +
Safari behavior; - Android Chrome; - tablet portrait; - tablet
landscape; - desktop.

Kiểm tra: - keyboard; - scroll; - bottom sheet; - modal; - image
gallery; - sticky elements; - safe area; - back button/browser history.

------------------------------------------------------------------------

# 73. Deliverables

Sau khi hoàn thành, báo cáo:

``` text
1. Responsive audit
2. Files modified
3. Components created/refactored
4. Breakpoints
5. Header/mobile navigation
6. Homepage
7. Search/location
8. Listing grid/card
9. Search/filter
10. Listing detail
11. Posting Engine
12. Auth
13. Account/Chat
14. Accessibility changes
15. Performance changes
16. Tests
17. Build result
18. Remaining issues
```

Kèm danh sách trước/sau đối với các lỗi responsive quan trọng.

------------------------------------------------------------------------

# 74. Nguyên tắc cuối cùng

Website phải hoạt động theo triết lý:

``` text
ONE CODEBASE
     ↓
RESPONSIVE DESIGN SYSTEM
     ↓
┌────────┬────────┬─────────┬─────────┐
Mobile   Tablet   Laptop    Desktop
└────────┴────────┴─────────┴─────────┘
```

Ưu tiên thứ tự:

``` text
Usability
→ Readability
→ Touch
→ Speed
→ Consistency
→ Visual polish
```

Không thu nhỏ giao diện desktop để gọi đó là mobile responsive.

**Tất Tần Tật trên điện thoại phải mang cảm giác của một sản phẩm được
thiết kế dành riêng cho mobile, nhưng vẫn sử dụng cùng codebase và cùng
hệ thống dữ liệu với phiên bản desktop.**
