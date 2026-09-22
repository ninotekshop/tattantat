# PROMPT TRIỂN KHAI DYNAMIC POSTING ENGINE --- ĐĂNG TIN TẤT TẦN TẬT

## 0. Vai trò

Bạn là **Senior Product Designer + Senior System Architect + Senior
Frontend Engineer + Senior Backend Engineer**.

Hãy phân tích codebase hiện tại của **Tất Tần Tật (tattantat.vn)** và
**nâng cấp chức năng Đăng tin hiện tại thành Dynamic Posting Engine**,
sử dụng **Category Engine mới** làm nguồn cấu hình duy nhất.

Không tạo lại toàn bộ hệ thống nếu không cần. Không thay framework/stack
hiện tại. Phải bảo toàn dữ liệu và các URL/luồng đang hoạt động.

------------------------------------------------------------------------

# 1. Mục tiêu cốt lõi

Form Đăng tin KHÔNG được hard-code riêng cho từng danh mục.

Luồng chuẩn:

``` text
ĐĂNG TIN MIỄN PHÍ
        ↓
Mục đích đăng
        ↓
Danh mục
        ↓
Chuyên mục
        ↓
Load Category Schema
        ↓
Dynamic Attributes
        ↓
Ảnh / Video
        ↓
Tiêu đề + Mô tả
        ↓
Giá
        ↓
Khu vực
        ↓
Xem trước
        ↓
Validation + Moderation
        ↓
ĐĂNG TIN / CHỜ DUYỆT
```

Category Engine phải quyết định: - trường nào xuất hiện; - trường nào
bắt buộc; - options; - dependency; - validation; - đơn vị; - listing
intent hợp lệ; - moderation rule; - filter/search metadata.

------------------------------------------------------------------------

# 2. Audit trước khi code

Bắt buộc kiểm tra:

1.  Framework frontend/backend.
2.  DB/schema.
3.  Listing model hiện tại.
4.  Category Engine đã triển khai đến đâu.
5.  API category/schema.
6.  Form Đăng tin hiện tại.
7.  Upload ảnh hiện tại.
8.  Location hiện tại.
9.  Auth/session.
10. Draft listing nếu có.
11. Moderation hiện tại.
12. Chat/transaction workflow.
13. Admin.
14. Search/index.
15. Storage/CDN.

Sau audit, trình bày:

``` text
CURRENT STATE
GAPS
TARGET ARCHITECTURE
MIGRATION PLAN
IMPLEMENTATION PLAN
```

Sau đó mới sửa code.

------------------------------------------------------------------------

# 3. UX tổng thể

Thiết kế dạng wizard nhiều bước, đơn giản và thân thiện.

Desktop: - Container khoảng 900--1050px. - Form chính ở giữa. - Progress
stepper phía trên. - Có card Preview/Summary khi phù hợp.

Mobile: - Full width. - Một bước/màn hình. - CTA sticky dưới màn hình. -
Touch target \>= 44px.

Stepper gợi ý:

``` text
1. Danh mục
2. Thông tin
3. Hình ảnh
4. Giá & Khu vực
5. Xem trước
```

Không nhất thiết bắt user thấy quá nhiều bước nhỏ.

------------------------------------------------------------------------

# 4. Bước 1 --- Mục đích đăng

Hiển thị các intent được Category Engine cho phép.

Ví dụ:

``` text
Bán
Cho thuê
Tặng miễn phí
Cần mua
Cần thuê
Cung cấp dịch vụ
Tuyển dụng
```

Internal codes:

``` text
sell
rent
giveaway
wanted_buy
wanted_rent
service_offer
job_offer
```

Không hiển thị intent không phù hợp category.

Nếu UX tốt hơn với codebase hiện tại, có thể chọn Category trước rồi chỉ
hiện intent hợp lệ.

------------------------------------------------------------------------

# 5. Bước 2 --- Chọn danh mục

Hiển thị Category Level 1 dạng card/icon:

``` text
🏠 Nhà đất
🚗 Xe cộ
💻 Đồ công nghệ
🛋 Nhà cửa & Đời sống
👕 Thời trang & Cá nhân
👶 Mẹ & Bé
⚽ Thể thao & Giải trí
🐶 Thú cưng
💼 Việc làm
🔧 Dịch vụ
🍜 Thực phẩm
🏭 Máy móc & Công nghiệp
🎁 Tặng miễn phí
📦 Khác
```

Không hard-code danh sách trên frontend.

Nguồn:

``` text
Category Engine API
```

Chỉ lấy:

``` text
is_active = true
```

------------------------------------------------------------------------

# 6. Chọn chuyên mục

Sau khi chọn category:

``` text
Đồ công nghệ
        ↓
Điện thoại
Máy tính bảng
Laptop
Máy tính để bàn
Máy ảnh & Máy quay
TV & Âm thanh
Thiết bị chơi game
...
```

UI: - card/list; - icon nếu có; - breadcrumb; - Back; - search category
nếu số lượng lớn.

Sau khi chọn leaf category:

``` text
GET category schema
```

------------------------------------------------------------------------

# 7. Category Schema

Frontend phải nhận schema thay vì tự quyết định fields.

Ví dụ:

``` json
{
  "category": {
    "id": 101,
    "name": "Máy ảnh & Máy quay",
    "slug": "may-anh-may-quay"
  },
  "allowedIntents": ["sell", "giveaway"],
  "attributes": [
    {
      "code": "product_type",
      "label": "Loại sản phẩm",
      "type": "single_select",
      "required": true
    },
    {
      "code": "brand",
      "label": "Thương hiệu",
      "type": "single_select",
      "required": true
    },
    {
      "code": "model",
      "label": "Model",
      "type": "single_select",
      "dependsOn": "brand"
    }
  ]
}
```

Schema là source of truth.

------------------------------------------------------------------------

# 8. Dynamic Form Renderer

Tạo component/service chung, ví dụ:

``` text
DynamicListingForm
DynamicFieldRenderer
```

Hỗ trợ:

``` text
text
textarea
integer
decimal
boolean
single_select
multi_select
date
year
range
location
```

Mỗi field đọc:

``` text
label
placeholder
help_text
unit
required
options
validation
dependency
ui_config
```

Không tạo:

``` text
if category === CAR ...
if category === CAMERA ...
```

tràn lan trong frontend.

------------------------------------------------------------------------

# 9. Dependent Fields

Bắt buộc hỗ trợ:

``` text
Brand → Model
Province → District → Ward
Type → Subtype
```

Ví dụ:

``` text
Sony
→ A7 III
→ A7 IV
→ A7R V
→ A6700
```

Khi parent đổi: - clear child value cũ; - fetch options mới; - disable
child trong lúc loading; - không gửi option không còn hợp lệ.

------------------------------------------------------------------------

# 10. Ví dụ form theo category

## Máy ảnh & Máy quay

``` text
Loại sản phẩm *
Thương hiệu *
Model
Tình trạng *
Cảm biến
Ngàm
Độ phân giải
Số shot
Bảo hành
```

## Ô tô

``` text
Hãng *
Dòng xe *
Phiên bản
Năm sản xuất *
Số km
Nhiên liệu *
Hộp số *
Kiểu dáng
Số chỗ
Màu
Xuất xứ
Tình trạng *
```

## Căn hộ

``` text
Mục đích *
Loại BĐS
Diện tích *
Phòng ngủ
Phòng tắm
Nội thất
Pháp lý
Hướng
```

Các form này phải sinh từ schema, không hard-code.

------------------------------------------------------------------------

# 11. Tiêu đề

Field:

``` text
Tiêu đề tin đăng
```

Yêu cầu: - required; - min/max lấy từ config; - character counter; -
trim whitespace; - chống title toàn ký tự đặc biệt; - validation
server-side.

Có thể hiển thị gợi ý:

``` text
Canon EOS R8 body, ngoại hình đẹp, còn bảo hành
```

Không tự đăng nội dung AI mà user chưa xác nhận.

------------------------------------------------------------------------

# 12. Mô tả

Textarea lớn, dễ đọc.

Có: - character counter; - auto-grow; - preserve line breaks; -
sanitize; - giới hạn độ dài; - cảnh báo nội dung bị cấm.

Không cho HTML tùy ý nếu hệ thống không cần.

------------------------------------------------------------------------

# 13. Chặn thông tin liên hệ

Theo mô hình Tất Tần Tật, người mua/người bán giao tiếp qua hệ thống.

Kiểm tra:

``` text
phone
email
Zalo
Facebook
Telegram
URL ngoài
```

trong: - title; - description; - field text khác.

Nếu phát hiện: - highlight; - giải thích ngắn; - yêu cầu sửa; - hoặc
chuyển moderation tùy rule.

Backend phải kiểm tra lại.

Không chỉ validation frontend.

------------------------------------------------------------------------

# 14. Giá

Component PriceInput.

Hỗ trợ:

``` text
price
currency
negotiable
pricing_type
```

Hiển thị format VND khi nhập.

Ví dụ:

``` text
7.650.000 ₫
```

Lưu numeric, không lưu chuỗi formatted.

Validation:

``` text
>= 0
max theo hệ thống
```

### Giveaway

Nếu:

``` text
listing_intent = giveaway
```

thì:

``` text
price = 0
```

Ẩn/disable input giá và hiển thị:

``` text
Tặng miễn phí
```

### Việc làm

Có thể dùng:

``` text
salary_min
salary_max
salary_type
```

### Dịch vụ

Có thể dùng:

``` text
price_from
price_to
pricing_type
```

Tất cả do schema quyết định.

------------------------------------------------------------------------

# 15. Ảnh sản phẩm

Thiết kế uploader hiện đại.

Yêu cầu: - drag & drop desktop; - chọn nhiều ảnh; - camera/gallery
mobile; - preview; - progress; - retry; - remove; - reorder drag/drop; -
chọn ảnh bìa; - validation file type/size/count.

Ảnh đầu tiên mặc định là cover nếu user chưa chọn.

Hiển thị:

``` text
Ảnh bìa
```

trên thumbnail cover.

------------------------------------------------------------------------

# 16. Image Processing

Nếu backend/storage hỗ trợ: - normalize orientation; - resize hợp lý; -
thumbnail; - WebP/AVIF; - giữ ảnh đủ lớn cho lightbox; - loại metadata
không cần thiết nếu phù hợp privacy; - không upscale ảnh nhỏ vô ích.

Không làm upload block UI.

------------------------------------------------------------------------

# 17. Video

Nếu hệ thống hiện tại hỗ trợ video, tích hợp schema/media workflow.

Nếu chưa có: - không tự thêm hạ tầng video phức tạp chỉ vì prompt; -
thiết kế interface để có thể mở rộng sau.

------------------------------------------------------------------------

# 18. Khu vực

Component LocationPicker:

``` text
Tỉnh/Thành phố *
Quận/Huyện *
Phường/Xã *
```

Có search.

Có thể:

``` text
Dùng vị trí hiện tại
```

nhưng chỉ khi user chủ động cấp quyền.

Không bắt buộc GPS.

------------------------------------------------------------------------

# 19. Privacy vị trí

Không public địa chỉ giao dịch chính xác.

Có thể lưu location phục vụ matching nếu nghiệp vụ cần, nhưng public
listing chỉ hiển thị mức được policy cho phép.

Ví dụ:

``` text
Quy Nhơn, Gia Lai
```

hoặc cấu trúc địa giới mà dữ liệu hiện hành của hệ thống đang sử dụng.

Không đưa precise coordinates vào public payload nếu không cần.

------------------------------------------------------------------------

# 20. Draft Auto-save

Form dài phải hỗ trợ lưu nháp.

Auto-save: - sau thay đổi có debounce; - khi chuyển bước; - trước khi
rời trang nếu có thay đổi.

Hiển thị trạng thái:

``` text
Đang lưu...
Đã lưu
Không thể lưu — Thử lại
```

Không spam API.

------------------------------------------------------------------------

# 21. Resume Draft

Trang:

``` text
Tin nháp của tôi
```

User có thể: - tiếp tục; - xóa; - duplicate nếu phù hợp.

Khi schema đã thay đổi từ lúc draft: - validate lại; - thông báo field
cần cập nhật; - không silently discard dữ liệu.

------------------------------------------------------------------------

# 22. Đổi danh mục giữa chừng

Nếu user đã nhập form rồi đổi category:

Không xóa dữ liệu ngay.

Hiển thị confirm:

``` text
Đổi danh mục có thể làm thay đổi một số thông tin đã nhập.
```

Sau confirm: - giữ common fields; - map compatible attributes; - bỏ
incompatible fields; - tải schema mới.

------------------------------------------------------------------------

# 23. Validation

Có 3 lớp:

``` text
UI validation
↓
API validation
↓
Moderation validation
```

UI giúp user sửa nhanh.

API là authoritative.

Validation từ:

``` text
category_attributes.validation_json
```

Ví dụ:

``` json
{
  "min": 0,
  "max": 1000000
}
```

Không duplicate rule thủ công nếu có thể.

------------------------------------------------------------------------

# 24. Xem trước

Bước cuối:

``` text
XEM TRƯỚC TIN
```

Render gần giống trang Chi tiết tin thật:

-   gallery;
-   title;
-   price;
-   location;
-   attributes;
-   description;
-   seller public info.

Có:

``` text
Sửa
Đăng tin
```

Preview không tạo listing public.

------------------------------------------------------------------------

# 25. Submit Pipeline

Khi user nhấn Đăng:

``` text
Client Validation
      ↓
Server Validation
      ↓
Category Schema Validation
      ↓
Media Validation
      ↓
Contact Info Check
      ↓
Duplicate Check
      ↓
Policy / Moderation
      ↓
ALLOW / REVIEW / REJECT
```

------------------------------------------------------------------------

# 26. Listing Status

Chuẩn hóa state machine:

``` text
DRAFT
SUBMITTED
PENDING_REVIEW
ACTIVE
REJECTED
HIDDEN
EXPIRED
SOLD
ARCHIVED
```

Không dùng các status string rời rạc ở nhiều module.

Xác định transition hợp lệ.

Ví dụ:

``` text
DRAFT → SUBMITTED
SUBMITTED → ACTIVE
SUBMITTED → PENDING_REVIEW
PENDING_REVIEW → ACTIVE
PENDING_REVIEW → REJECTED
ACTIVE → SOLD
ACTIVE → EXPIRED
```

------------------------------------------------------------------------

# 27. Moderation Result UX

Nếu:

``` text
ACTIVE
```

hiển thị:

``` text
✓ Tin của bạn đã được đăng
```

Nếu:

``` text
PENDING_REVIEW
```

hiển thị:

``` text
Tin đã được gửi và đang chờ duyệt.
```

Nếu cần sửa: - chỉ rõ field; - giải thích lý do; - CTA `Chỉnh sửa tin`.

Không hiển thị internal risk score/rule implementation cho user.

------------------------------------------------------------------------

# 28. Duplicate Detection

Kiểm tra hợp lý: - cùng seller; - title tương tự; - attributes tương
tự; - image hash nếu hạ tầng hỗ trợ; - thời gian gần nhau.

Không auto-reject chỉ vì similarity nếu confidence không đủ.

Flag review khi cần.

------------------------------------------------------------------------

# 29. AI Category Suggestion

Có thể thêm nút:

``` text
✨ Gợi ý danh mục
```

Dựa trên:

``` text
title
description
```

Trả:

``` text
Top 1–3 category suggestions
confidence
```

User phải xác nhận.

Không tự chuyển category sau khi user đã chọn mà không báo.

------------------------------------------------------------------------

# 30. AI Attribute Suggestion

Ví dụ user nhập:

``` text
Canon EOS R8, 12.000 shot, còn BH 5 tháng
```

Gợi ý:

``` text
Brand: Canon
Model: EOS R8
Shutter count: 12000
Warranty: 5 tháng
```

Hiển thị:

``` text
Áp dụng gợi ý
```

User kiểm tra trước.

------------------------------------------------------------------------

# 31. AI Title Assistance

Có thể cung cấp:

``` text
✨ Gợi ý tiêu đề
```

AI dựa trên attributes user đã nhập.

Không thêm: - thông tin không có; - claim chất lượng; - số điện thoại; -
nội dung quảng cáo sai.

User phải chủ động áp dụng.

------------------------------------------------------------------------

# 32. Authentication

Nếu chưa login và nhấn:

``` text
Đăng tin miễn phí
```

mở Login Popup hiện tại.

Sau login: - quay lại posting flow; - giữ draft/form nếu có; - không bắt
user nhập lại.

------------------------------------------------------------------------

# 33. Seller Privacy

Frontend/API public tuyệt đối không expose:

``` text
phone
private_email
exact_address
internal_user_id nếu không cần
private coordinates
```

Không dựa vào CSS để ẩn.

------------------------------------------------------------------------

# 34. Edit Listing

Trang:

``` text
Quản lý tin → Sửa tin
```

phải dùng cùng Dynamic Posting Engine.

Load:

``` text
listing
category schema
attribute values
media
```

Nếu đổi các field quan trọng: - revalidate; - re-run moderation theo
policy.

Không tạo form Edit riêng.

------------------------------------------------------------------------

# 35. Duplicate Listing

Nếu cho phép:

``` text
Đăng tin tương tự
```

Clone: - category; - attributes; - description nếu policy cho phép.

Không tự clone status, views, favorites, messages.

Media xử lý theo storage policy.

------------------------------------------------------------------------

# 36. Tặng miễn phí

UX riêng:

``` text
🎁 Tặng miễn phí
```

-   không nhập giá;
-   badge rõ;
-   chọn category thực của món đồ;
-   vẫn cần condition/location/media;
-   vẫn moderation.

Không tạo một bản sao taxonomy dưới Giveaway.

------------------------------------------------------------------------

# 37. Việc làm

Form phải chuyển sang Job Schema.

Không hiển thị:

``` text
Tình trạng sản phẩm
Giá sản phẩm
```

Thay bằng:

``` text
Vị trí tuyển dụng
Loại công việc
Mức lương
Kinh nghiệm
Thời gian làm việc
Quyền lợi
Địa điểm
```

------------------------------------------------------------------------

# 38. Nhà đất

Form hỗ trợ:

``` text
Bán / Cho thuê / Cần mua / Cần thuê
```

Các field:

``` text
price
area
bedrooms
bathrooms
legal_status
furnishing
direction
location
```

Nếu rent: - hỗ trợ đơn vị giá phù hợp như `/tháng` nếu schema cấu hình.

------------------------------------------------------------------------

# 39. Dịch vụ

Không ép dùng form hàng hóa.

Schema:

``` text
service_type
service_area
pricing_type
price_from
price_to
availability
description
```

------------------------------------------------------------------------

# 40. Error Handling

Xử lý: - schema load fail; - option load fail; - image upload fail; -
draft save fail; - submit fail; - auth expired; - network offline; -
category disabled trong lúc đang đăng.

Không làm mất dữ liệu form khi lỗi mạng.

------------------------------------------------------------------------

# 41. Offline / Connection Safety

Ít nhất lưu state tạm phù hợp với kiến trúc hiện tại để tránh mất nội
dung khi refresh/crash.

Không lưu dữ liệu nhạy cảm không cần thiết vào localStorage.

------------------------------------------------------------------------

# 42. Accessibility

-   label đúng cho input;
-   error liên kết field;
-   keyboard navigation;
-   focus khi chuyển step;
-   focus vào field lỗi đầu tiên;
-   aria-live cho upload/save status;
-   contrast;
-   touch target \>= 44px.

------------------------------------------------------------------------

# 43. Responsive

Kiểm thử tối thiểu:

``` text
1440
1280
1024
768
430
390
360
```

Không horizontal overflow.

Mobile uploader và select phải dễ dùng.

------------------------------------------------------------------------

# 44. Performance

-   lazy load option lớn;
-   cache category schema;
-   debounce search;
-   image compression hợp lý;
-   không fetch toàn bộ Brand/Model dataset cùng lúc;
-   request cancellation khi dependency đổi nhanh;
-   skeleton cho schema/options;
-   tránh re-render toàn form.

------------------------------------------------------------------------

# 45. Analytics

Nếu dự án có analytics, thêm:

``` text
posting_started
posting_category_selected
posting_subcategory_selected
posting_step_completed
posting_image_uploaded
posting_previewed
posting_submitted
posting_pending_review
posting_published
posting_validation_error
posting_abandoned
```

Không để analytics failure block posting.

------------------------------------------------------------------------

# 46. API / Security

Tận dụng API convention hiện tại.

Có thể cần:

``` text
GET  /categories
GET  /categories/:id/schema
GET  /attributes/:id/options
POST /listing-drafts
PATCH /listing-drafts/:id
POST /listings
PATCH /listings/:id
POST /listings/:id/media
POST /listings/:id/submit
```

Yêu cầu: - auth; - authorization; - CSRF nếu stack cần; - rate limit; -
server validation; - sanitize; - MIME verification; - ownership check; -
transaction/idempotency khi submit.

Không tin category/price/user_id chỉ từ client.

------------------------------------------------------------------------

# 47. Idempotent Submit

Double-click `Đăng tin` không được tạo hai listing.

Disable button khi submit và hỗ trợ idempotency phù hợp backend.

------------------------------------------------------------------------

# 48. Admin Integration

Dynamic Posting Engine phải phản ánh thay đổi từ:

``` text
Admin
→ Category Builder
→ Attribute Builder
→ Option Manager
→ Dependency Manager
→ Validation
→ Moderation
→ Publish
```

Khi schema mới publish: - invalidate cache; - form mới dùng version
mới; - draft cũ được validate/migrate an toàn.

------------------------------------------------------------------------

# 49. Migration form Đăng tin hiện tại

Không xóa form cũ ngay.

Quy trình:

``` text
Audit
→ Map old fields
→ Implement Dynamic Renderer
→ Feature flag
→ Test
→ Migrate
→ Verify
→ Enable production
→ Remove legacy only after stable
```

Nếu có listing đang draft, phải có migration/compatibility.

------------------------------------------------------------------------

# 50. Test bắt buộc

Unit: - schema parser; - validation; - dependency; - price; - intent.

Integration: - category → schema; - Brand → Model; - draft; - upload; -
submit; - moderation.

E2E tối thiểu: 1. Đăng điện thoại. 2. Đăng máy ảnh. 3. Đăng ô tô. 4.
Đăng BĐS cho thuê. 5. Tặng miễn phí. 6. Tuyển dụng. 7. Dịch vụ. 8. Sửa
tin. 9. Resume draft. 10. Tin chờ duyệt.

------------------------------------------------------------------------

# 51. Acceptance Criteria

Chỉ hoàn thành khi:

-   Không hard-code form theo category.
-   Category Engine là source of truth.
-   Dynamic attributes render đúng.
-   Required/validation đúng frontend + backend.
-   Brand → Model hoạt động.
-   Intent thay đổi đúng form.
-   Giveaway luôn giá 0.
-   Job/Service/Property có schema riêng phù hợp.
-   Upload/reorder/cover ảnh hoạt động.
-   Draft auto-save/resume.
-   Preview hoạt động.
-   Contact info được kiểm tra.
-   Submit không tạo duplicate.
-   Moderation/status hoạt động.
-   Edit dùng cùng engine.
-   Private seller info không expose.
-   Mobile hoàn chỉnh.
-   Listing cũ không mất.
-   Build/lint/typecheck/test pass.

------------------------------------------------------------------------

# 52. Deliverables sau triển khai

Báo cáo:

1.  Current-state audit.
2.  Files created/modified.
3.  Components.
4.  APIs.
5.  DB migrations.
6.  Dynamic schema renderer.
7.  Validation.
8.  Upload/media.
9.  Draft system.
10. Moderation integration.
11. Category Engine integration.
12. Migration từ form cũ.
13. Tests.
14. Build result.
15. Remaining TODO.

------------------------------------------------------------------------

# 53. Nguyên tắc kiến trúc cuối cùng

Khi Admin tạo một chuyên mục mới:

``` text
Admin
→ Category
→ Attributes
→ Options
→ Dependencies
→ Validation
→ Moderation
→ Preview
→ Publish
```

thì **form Đăng tin phải tự thích ứng mà không cần lập trình thêm một
form mới**.

Mục tiêu cuối cùng:

``` text
CATEGORY ENGINE
       ↓
POSTING ENGINE
       ↓
MODERATION
       ↓
LISTING
       ↓
SEARCH / FILTER
       ↓
DETAIL / RELATED / HOT
```

Toàn bộ Tất Tần Tật phải sử dụng **cùng một taxonomy và schema**, tránh
mỗi module có một định nghĩa danh mục riêng.
