# PROMPT TRIỂN KHAI CATEGORY ENGINE --- TẤT TẦN TẬT

## Vai trò và mục tiêu

Bạn là Senior System Architect + Backend Engineer + Frontend Engineer +
Product Designer. Hãy phân tích codebase hiện tại của **Tất Tần Tật
(tattantat.vn)** và triển khai **Category Engine** hoàn chỉnh.

Category Engine không chỉ là menu danh mục mà phải là nguồn cấu hình
trung tâm cho: cây danh mục, form đăng tin động, thuộc tính, bộ lọc,
validation, moderation, SEO, tin liên quan, tin HOT, loại giao dịch và
quản trị Admin.

Không sao chép code/giao diện của website khác. Không thay stack hiện
tại nếu không cần.

## 1. Kiến trúc

``` text
CATEGORY
  ↓
SUBCATEGORY
  ↓
ATTRIBUTE SCHEMA
  ↓
VALIDATION / MODERATION
  ↓
LISTING
  ↓
SEARCH / FILTER / SEO / RECOMMENDATION
```

Ưu tiên taxonomy 2 cấp. Không biến Brand/Model/Color/Year thành category
nếu có thể biểu diễn bằng Attribute.

## 2. Danh mục cấp 1

``` text
TẤT TẦN TẬT
├── Nhà đất
├── Xe cộ
├── Đồ công nghệ
├── Nhà cửa & Đời sống
├── Thời trang & Cá nhân
├── Mẹ & Bé
├── Thể thao & Giải trí
├── Thú cưng
├── Việc làm
├── Dịch vụ
├── Thực phẩm
├── Máy móc & Công nghiệp
├── Tặng miễn phí
└── Khác
```

Admin phải bật/tắt, đổi tên, slug, icon, ảnh và thứ tự mà không sửa
source.

## 3. Taxonomy cấp 2

### Nhà đất

-   Căn hộ / Chung cư
-   Nhà ở
-   Đất
-   Phòng trọ
-   Văn phòng
-   Mặt bằng kinh doanh
-   Kho / Xưởng
-   BĐS khác

Attributes: `transaction_type`, `property_type`, `price`, `area`,
`price_per_m2`, `bedrooms`, `bathrooms`, `floors`, `direction`,
`furnishing`, `legal_status`, `facade_width`, `street_width`, location.

`transaction_type`: sell, rent, wanted_buy, wanted_rent.

### Xe cộ

-   Ô tô
-   Xe máy
-   Xe đạp
-   Xe tải & Xe chuyên dụng
-   Phụ tùng & Phụ kiện
-   Phương tiện khác

Không tạo "Xe điện" thành category riêng; dùng `fuel_type/powertrain`.

Ô tô: brand, model, variant, year, mileage, fuel_type, transmission,
body_type, seats, color, origin, condition, ownership,
registration_year.

Xe máy: brand, model, vehicle_type, year, mileage, fuel_type,
engine_capacity, color, origin, condition.

### Đồ công nghệ

-   Điện thoại
-   Máy tính bảng
-   Laptop
-   Máy tính để bàn
-   Máy ảnh & Máy quay
-   TV & Âm thanh
-   Thiết bị chơi game
-   Thiết bị đeo thông minh
-   Phụ kiện
-   Linh kiện

Thuộc tính chung: brand, model, condition, warranty, color, price.

Điện thoại/tablet: storage, ram, screen_size, sim_type, battery_health,
network.

Laptop: cpu, ram, storage, gpu, screen_size, screen_resolution,
operating_system.

Máy ảnh: product_type, brand, model, sensor_format, mount, resolution,
shutter_count, condition, warranty.

`product_type`: Mirrorless, DSLR, Compact, Film, Action Camera,
Camcorder, Lens, Flash, Accessory, Other.

### Nhà cửa & Đời sống

-   Điện lạnh
-   Bếp & Đồ điện nhà bếp
-   Dụng cụ nhà bếp
-   Nội thất
-   Giường / Chăn / Ga / Gối / Nệm
-   Thiết bị vệ sinh & Nhà tắm
-   Quạt & Thiết bị không khí
-   Đèn
-   Trang trí nhà cửa
-   Cây cảnh & Sân vườn
-   Đồ gia dụng khác

Attributes: product_type, brand, model, condition, capacity, power,
energy_rating, warranty.

### Thời trang & Cá nhân

-   Quần áo nam
-   Quần áo nữ
-   Giày dép
-   Túi xách / Balo / Vali
-   Đồng hồ
-   Trang sức
-   Nước hoa
-   Mỹ phẩm
-   Phụ kiện thời trang

Attributes: gender, brand, size, color, material, condition,
authenticity.

### Mẹ & Bé

-   Đồ cho bé
-   Đồ cho mẹ
-   Xe đẩy / Ghế / Nôi / Cũi
-   Đồ chơi
-   Quần áo trẻ em
-   Sữa & Đồ ăn cho bé
-   Khác

Attributes: age_range, brand, size, condition, expiry_date.

### Thể thao & Giải trí

-   Thể thao
-   Dã ngoại
-   Nhạc cụ
-   Sách / Truyện / Tạp chí
-   Đồ sưu tầm
-   Game & Phụ kiện
-   Vé
-   Sở thích khác

`sport_type`: Tennis, Cầu lông, Bóng đá, Golf, Pickleball, Gym, Chạy bộ,
Bơi, Xe đạp thể thao, Khác.

### Thú cưng

-   Chó
-   Mèo
-   Chim
-   Cá cảnh
-   Thú cưng khác
-   Thức ăn
-   Phụ kiện
-   Dịch vụ thú cưng

Attributes tùy subtype: breed, age, gender, vaccination_status,
health_document, origin. Có moderation riêng.

### Việc làm

-   Bán hàng
-   Kinh doanh
-   Văn phòng
-   Kế toán
-   IT / Công nghệ
-   Marketing
-   Thiết kế
-   Nhà hàng / Khách sạn
-   Giao hàng / Tài xế
-   Lao động phổ thông
-   Kỹ thuật
-   Việc làm khác

Attributes: employment_type, job_title, industry, experience_level,
salary_min, salary_max, salary_type, working_hours, education, benefits,
work_location, remote_option.

### Dịch vụ

-   Sửa chữa
-   Vận chuyển
-   Thuê xe
-   Du lịch
-   Lưu trú
-   Gia đình
-   Vệ sinh
-   Làm đẹp
-   Chụp ảnh / Video
-   Thiết kế / Công nghệ
-   Giáo dục
-   Tổ chức sự kiện
-   Dịch vụ khác

Attributes: service_type, service_area, pricing_type, price_from,
price_to, availability, provider_type.

### Thực phẩm

-   Đồ ăn
-   Đồ uống
-   Đặc sản
-   Rau củ / Trái cây
-   Thực phẩm tươi sống
-   Thực phẩm khô
-   Đồ handmade
-   Khác

Attributes: product_type, origin, weight, unit, manufacture_date,
expiry_date, delivery_available. Có moderation hàng hạn chế.

### Máy móc & Công nghiệp

-   Máy móc công nghiệp
-   Máy móc nông nghiệp
-   Thiết bị xây dựng
-   Dụng cụ cơ khí
-   Thiết bị nhà hàng
-   Thiết bị cửa hàng
-   Thiết bị văn phòng
-   Nguyên vật liệu
-   Giống cây trồng
-   Khác

Attributes: equipment_type, brand, model, year, power, capacity,
condition, warranty.

### Tặng miễn phí

Không nhân bản taxonomy. Dùng `listing_intent = giveaway`, cho user chọn
danh mục thực của món đồ. Luôn `price = 0`.

### Khác

Chỉ dùng khi không có chuyên mục phù hợp. Theo dõi analytics để phát
hiện nhu cầu tạo category mới.

## 4. Listing Intent

Tách ý định khỏi category:

``` text
sell
rent
giveaway
wanted_buy
wanted_rent
service_offer
job_offer
```

Tạo `category_listing_intents` để quy định intent hợp lệ theo category.

## 5. Database

### categories

``` text
id
parent_id
name
slug
description
icon
cover_image
level
sort_order
is_active
is_featured
seo_title
seo_description
created_at
updated_at
```

Không hard-delete category đã có listing; dùng archive/soft delete.

### attributes

``` text
id
code
name
data_type
unit
placeholder
help_text
created_at
updated_at
```

`data_type`: text, textarea, integer, decimal, boolean, single_select,
multi_select, date, year, range, location.

### attribute_options

``` text
id
attribute_id
parent_option_id
value
label
sort_order
is_active
metadata_json
```

### category_attributes

``` text
id
category_id
attribute_id
is_required
is_filterable
is_searchable
is_sortable
show_in_post_form
show_in_listing_card
show_in_listing_detail
sort_order
validation_json
ui_config_json
default_value
```

### listings

Giữ bảng lõi gọn:

``` text
id
user_id
category_id
listing_intent_id
title
description
price
currency
negotiable
condition
province_id
district_id
ward_id
latitude
longitude
status
published_at
expires_at
created_at
updated_at
```

### listing_attribute_values

``` text
id
listing_id
attribute_id
value_text
value_number
value_boolean
value_date
option_id
created_at
updated_at
```

Không tạo hàng trăm cột category-specific trong `listings`.

## 6. Location Engine

``` text
locations:
id
parent_id
type
name
slug
code
latitude
longitude
is_active
```

Hierarchy: Province/City → District → Ward.

Chuẩn bị geospatial search: 1km, 3km, 5km, 10km, 20km, 50km.

Không bắt buộc GPS. API public không expose địa chỉ giao dịch chính xác.

## 7. Dynamic Posting Form

``` text
Đăng tin
→ Chọn mục đích
→ Chọn danh mục
→ Chọn chuyên mục
→ Load Category Schema
→ Dynamic Attributes
→ Ảnh/Video
→ Tiêu đề
→ Mô tả
→ Giá
→ Khu vực
→ Xem trước
→ Validation
→ Moderation
→ Đăng/Chờ duyệt
```

Frontend không hard-code form riêng nếu schema có thể sinh tự động.

API theo convention dự án, ví dụ:

``` text
GET /api/categories
GET /api/categories/{id}/schema
GET /api/categories/{id}/filters
```

## 8. Dynamic Filter Engine

Filter sinh từ `category_attributes`.

Ví dụ Điện thoại: - Hãng - Model - Giá - Dung lượng - RAM - Tình trạng -
Khu vực

Ô tô: - Hãng - Dòng xe - Giá - Năm - Số km - Nhiên liệu - Hộp số - Kiểu
dáng - Khu vực

Không dùng cùng một filter panel cố định cho mọi category.

## 9. Dependent Attributes

Bắt buộc hỗ trợ Brand → Model qua `parent_option_id` hoặc dependency
table.

Ví dụ:

``` text
Canon → EOS R8 / EOS R50 / EOS R6 Mark II
Sony → A7 III / A7 IV / A6700
Toyota → Vios / Camry / Corolla Cross
```

Không load tất cả model trước khi chọn brand.

## 10. Moderation theo Category

Tạo `category_moderation_rules`:

``` text
id
category_id
rule_code
rule_type
config_json
severity
auto_action
is_active
```

Rule types: - required_attribute - forbidden_keyword -
duplicate_detection - price_anomaly - image_required - minimum_images -
contact_info_detection - external_link_detection - prohibited_item -
location_validation - title_validation - description_validation

Actions: allow, flag, manual_review, reject.

AI moderation chỉ gợi ý/risk-score trong trường hợp mơ hồ; hỗ trợ human
review.

## 11. Bảo vệ thông tin người bán

Theo nghiệp vụ Tất Tần Tật, không public: - phone - email - Zalo -
Facebook/Telegram - địa chỉ giao dịch chính xác

Phát hiện thông tin liên hệ trong title/description và nếu hệ thống có
khả năng phù hợp thì cả ảnh.

API public không được trả private seller fields; không chỉ CSS hide.

Liên hệ qua Tất Tần Tật Chat / transaction workflow.

## 12. Search / SEO

Search index gồm field chung và các attribute có `is_searchable`.

Attribute `is_filterable` hỗ trợ faceted filter.

Category có:

``` text
seo_title
seo_description
canonical_pattern
indexable
```

Giữ backward compatibility URL hiện tại và redirect phù hợp nếu đổi
slug.

## 13. Related & HOT

Related score có thể dựa trên: - same_subcategory - same_category -
same_brand/model - price_similarity - distance - freshness - engagement

Loại listing hiện tại, hết hạn, khóa, chưa duyệt.

HOT dùng scoring/config thay vì hard-code:

``` text
featured_weight
view_weight
favorite_weight
message_weight
freshness_weight
```

Admin có thể đánh dấu HOT, ghim và đặt thời hạn.

## 14. Admin --- Category Builder

Menu:

``` text
Quản trị → Danh mục tin đăng
```

Tree View + drag/drop.

Admin có thể: - thêm/sửa/archive category - bật/tắt - sắp xếp -
icon/cover - SEO - preview

Không hard-delete category đang có listing.

## 15. Admin --- Attribute Builder

Khi chọn chuyên mục, hiển thị danh sách attribute với: - Required -
Filterable - Searchable - Sortable - Show in post form - Show on card -
Show on detail

Cho phép drag/drop và `+ Thêm thuộc tính`.

## 16. Option & Dependency Manager

Admin quản lý options, import/export CSV, disable option.

Có UI dependency:

``` text
Brand
└── Model
```

Hỗ trợ bulk import.

## 17. Preview + Draft/Publish

Admin có: - Xem thử Form đăng tin - Xem thử Bộ lọc - Desktop / Tablet /
Mobile preview

Schema hỗ trợ `DRAFT` → `PUBLISHED`.

Thay đổi chưa publish không ảnh hưởng production.

## 18. Versioning + Audit

Không để schema mới phá listing cũ.

Cân nhắc `schema_version`. Option cũ đang được sử dụng chỉ được disable,
không xóa vật lý.

Audit log:

``` text
admin_id
action
entity_type
entity_id
old_value
new_value
created_at
```

## 19. RBAC

Các role: - Super Admin - Category Manager - Moderator - SEO Manager

Phân quyền đúng phạm vi.

## 20. Migration dữ liệu hiện tại

KHÔNG reset production.

``` text
Audit category cũ
→ Map old → new
→ Seed Category Engine
→ Migrate listing
→ Verify counts
→ Rebuild search index nếu cần
→ Giữ redirect/slug cũ
→ Sau kiểm chứng mới bỏ legacy code
```

Migration cần rollback phù hợp.

## 21. Cache

Cache category tree, schema, filters, options. Khi Admin publish thì
invalidate cache.

## 22. AI hỗ trợ --- không thay quyền quyết định của user

Chuẩn bị `category-suggestions`: - input: title, description - output:
top suggestions + confidence

AI chỉ gợi ý category; user xác nhận/sửa.

Có thể bổ sung attribute extraction, ví dụ:
`Canon EOS R8 body, 12k shot` → brand Canon, model EOS R8, shutter_count
12000; user xác nhận trước khi lưu.

## 23. Category Analytics

Dashboard: - tin mới/category - tỷ lệ duyệt/từ chối - tỷ lệ hoàn thành
form - field bị bỏ trống - filter usage - search demand - CTR - chat
initiated - listing conversion

Dùng dữ liệu quyết định thêm/bớt category.

## 24. Quy tắc tạo category mới

Chỉ tạo category mới khi có đủ lý do: - search demand - listing volume -
distinct attribute schema - filter need - moderation requirement -
business importance

Nếu chỉ khác brand/model/color/size/year → dùng Attribute.

## 25. Acceptance Criteria

Hoàn thành khi: - Category tree không hard-code frontend. - Admin quản
trị category được. - Attribute schema cấu hình được. - Form đăng tin
sinh theo category. - Filter sinh theo schema. - Validation frontend +
backend. - Brand → Model dependency hoạt động. - Listing cũ không mất dữ
liệu. - Search/routing cũ không bị phá. - Private seller info không
expose. - Moderation rule theo category. - Admin preview +
Draft/Publish. - Audit log + RBAC. - Responsive. -
Build/typecheck/lint/test thành công.

## 26. Quy trình triển khai bắt buộc

Trước khi code, audit: 1. Framework. 2. DB/schema. 3. Category hiện tại.
4. Listing model. 5. Search/filter. 6. Admin. 7. Auth/RBAC. 8.
Moderation.

Sau đó trình bày:

``` text
CURRENT STATE
TARGET ARCHITECTURE
MIGRATION PLAN
IMPLEMENTATION
TEST
```

Không viết lại toàn dự án nếu không cần.

## 27. Deliverables

Sau triển khai báo cáo: 1. Files created/modified. 2. DB migrations. 3.
Seed data. 4. Category tree. 5. Attribute schema. 6. Dynamic form. 7.
Dynamic filters. 8. Category Builder. 9. Attribute/Option/Dependency
Builder. 10. Moderation integration. 11. Search integration. 12.
Migration result. 13. Tests. 14. Build result. 15. Remaining TODO.

## 28. Mục tiêu dài hạn

Sau này khi cần thêm:

``` text
Đồ câu cá
Thiết bị livestream
Máy pha cà phê
Máy ảnh Film
Thiết bị Pickleball
Thiết bị POS
```

phần lớn thao tác phải thực hiện được bằng:

``` text
Admin
→ Tạo chuyên mục
→ Chọn attributes
→ Tạo options
→ Cấu hình filter
→ Cấu hình moderation
→ Preview
→ Publish
```

Không cần lập trình lại form cho từng chuyên mục.

**Category Engine phải trở thành nền tảng cấu hình trung tâm của Tất Tần
Tật.**
