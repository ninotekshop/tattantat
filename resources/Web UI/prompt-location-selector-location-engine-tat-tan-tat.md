# PROMPT TRIỂN KHAI LOCATION SELECTOR / DROPDOWN KHU VỰC --- TẤT TẦN TẬT

## 0. Vai trò

Bạn là **Senior Product Designer + Senior Frontend Engineer + Senior
Backend Engineer + Database Architect**.

Hãy phân tích codebase hiện tại của **Tất Tần Tật (tattantat.vn)** và
triển khai một **Location Engine + Location Selector** dùng thống nhất
cho:

1.  Form tìm kiếm trên Header/Home.
2.  Trang kết quả tìm kiếm và bộ lọc.
3.  Dynamic Posting Engine / form Đăng tin.
4.  Trang chi tiết tin.
5.  Tin liên quan / tìm tin gần đây.
6.  Admin quản lý khu vực.

Có thể tham khảo pattern UX của các marketplace lớn như Chợ Tốt, nhưng
**không sao chép source code, tài sản thương hiệu hoặc giao diện
pixel-for-pixel**.

Mục tiêu là tạo phiên bản riêng, hiện đại và phù hợp giao diện Tất Tần
Tật.

------------------------------------------------------------------------

# 1. Nguyên tắc cốt lõi

Toàn hệ thống chỉ có **một nguồn dữ liệu khu vực duy nhất**:

``` text
LOCATION ENGINE
      │
      ├── Search Header
      ├── Search Filters
      ├── Posting Form
      ├── Listing Detail
      ├── Related/Nearby
      └── Admin
```

Tuyệt đối không hard-code danh sách tỉnh/thành ở nhiều component khác
nhau.

------------------------------------------------------------------------

# 2. Audit trước khi code

Kiểm tra:

-   Framework frontend/backend.
-   DB hiện tại.
-   Location model hiện tại.
-   Dữ liệu province/district/ward đang có.
-   Form tìm kiếm.
-   Search API.
-   Posting Engine.
-   Listing schema.
-   Header.
-   URL/query parameters.
-   Geolocation hiện tại nếu có.
-   Cache.
-   Admin.
-   Search index.

Sau đó báo cáo:

``` text
CURRENT STATE
LOCATION DATA CURRENTLY USED
GAPS
TARGET ARCHITECTURE
MIGRATION PLAN
```

Không reset dữ liệu production.

------------------------------------------------------------------------

# 3. Lưu ý dữ liệu địa giới Việt Nam

Không lấy một snapshot cũ của website khác làm nguồn dữ liệu chính.

Hệ thống phải hỗ trợ:

``` text
Tên hiện hành
Mã hành chính
Tên cũ / Alias
Parent hiện hành
Trạng thái active/inactive
Lịch sử mapping khi địa giới thay đổi
```

Thiết kế đủ linh hoạt để cập nhật khi Việt Nam thay đổi đơn vị hành
chính.

Không gắn logic nghiệp vụ vào tên text.

Ưu tiên dùng `administrative_code`/ID ổn định.

------------------------------------------------------------------------

# 4. Data Model

Tạo hoặc chuẩn hóa:

## locations

``` text
id
parent_id

administrative_code
name
slug

type
level

latitude
longitude

is_active
sort_order

created_at
updated_at
```

`type` có thể gồm các cấp thực tế mà dataset hiện hành hỗ trợ, ví dụ:

``` text
province
city
district
town
ward
commune
special
```

Không giả định cứng rằng mọi địa phương luôn có đủ 3 tầng.

------------------------------------------------------------------------

# 5. Location Aliases

Tạo:

## location_aliases

``` text
id
location_id
alias
alias_slug
alias_type
valid_from
valid_to
created_at
```

Dùng cho:

-   tên cũ;
-   tên viết tắt;
-   cách viết không dấu;
-   tên thường dùng;
-   migration sau thay đổi địa giới.

Ví dụ search một tên cũ vẫn có thể map sang đơn vị hiện hành nếu dữ liệu
mapping xác nhận.

------------------------------------------------------------------------

# 6. Location History / Mapping

Nếu hệ thống cần migration địa giới:

``` text
location_mappings
```

Có thể gồm:

``` text
old_location_id
new_location_id
mapping_type
effective_date
metadata_json
```

`mapping_type`:

``` text
renamed
merged
split
reassigned
deprecated
```

Không tự suy đoán mapping.

------------------------------------------------------------------------

# 7. Dropdown trên Form tìm kiếm

Ô khu vực nằm cạnh ô keyword.

Desktop gợi ý:

``` text
┌────────────────┬───────────────────────────────┬──────────┐
│ 📍 Khu vực  ▼  │ 🔎 Bạn đang tìm gì?           │ Tìm kiếm │
└────────────────┴───────────────────────────────┴──────────┘
```

Khi đã chọn:

``` text
📍 Gia Lai ▼
```

hoặc khu vực chi tiết phù hợp:

``` text
📍 Quy Nhơn ▼
```

Không để tên quá dài phá layout; dùng truncate + tooltip nếu cần.

------------------------------------------------------------------------

# 8. Dropdown / Popover chính

Click `Khu vực` mở popover lớn, KHÔNG mở browser window/tab mới.

Gợi ý:

``` text
┌────────────────────────────────────────────┐
│ Khu vực                              ✕     │
│                                            │
│ 🔎 Tìm tỉnh, thành phố, phường/xã...       │
│                                            │
│ ○ Toàn quốc                               │
│ 📍 Quanh tôi                              │
│ ────────────────────────────────────────── │
│ KHU VỰC PHỔ BIẾN                          │
│ ...                                        │
│ ────────────────────────────────────────── │
│ TỈNH / THÀNH PHỐ                          │
│                                            │
│ ...                                    ›   │
│ ...                                    ›   │
│                                            │
└────────────────────────────────────────────┘
```

Danh sách phải lấy từ API/database.

Không hard-code các tỉnh trong component.

------------------------------------------------------------------------

# 9. Search ngay trong Location Selector

Input:

``` text
🔎 Tìm khu vực...
```

Search theo:

``` text
name
alias
không dấu
slug
administrative_code khi phù hợp
```

Ví dụ user gõ không dấu vẫn tìm được tên có dấu.

Debounce khoảng 200--350ms tùy stack.

Highlight phần match nếu phù hợp.

------------------------------------------------------------------------

# 10. Điều hướng phân cấp

Khi chọn một location có child:

``` text
‹ Khu vực

TÊN KHU VỰC

✓ Toàn khu vực

Danh sách đơn vị trực thuộc
...
```

Có breadcrumb/back.

Không assume cố định `Province → District → Ward`; render theo
parent/child thực tế trong dataset.

------------------------------------------------------------------------

# 11. Chọn toàn khu vực

Ở mỗi node có lựa chọn:

``` text
✓ Toàn [Tên khu vực]
```

Ví dụ khi user muốn tìm mọi tin thuộc toàn bộ node đó.

Query nên lưu bằng ID/code, không build logic bằng chuỗi tên.

------------------------------------------------------------------------

# 12. Áp dụng / Hủy

Nếu UX cho phép chọn tạm trước khi search:

``` text
[Hủy]                         [Áp dụng]
```

Chỉ commit selection khi nhấn Áp dụng.

Nếu current UX đơn giản hơn và selection có thể commit ngay, giữ
convention nhất quán với web hiện tại.

------------------------------------------------------------------------

# 13. Toàn quốc

Option:

``` text
○ Toàn quốc
```

Semantics:

``` text
location_id = null
location_mode = nationwide
```

Không tạo một tỉnh giả tên `Toàn quốc` trong bảng locations.

------------------------------------------------------------------------

# 14. Quanh tôi

Option:

``` text
📍 Quanh tôi
```

Chỉ gọi browser Geolocation API sau khi user chủ động chọn.

Không tự xin quyền vị trí ngay khi load trang.

Nếu permission denied:

``` text
Không thể lấy vị trí. Bạn vẫn có thể chọn khu vực thủ công.
```

Không block search.

------------------------------------------------------------------------

# 15. Radius Search

Khi chọn Quanh tôi:

``` text
Tìm trong bán kính

[ 1 km ]
[ 3 km ]
[ 5 km ]
[ 10 km ]
[ 20 km ]
[ 50 km ]
```

Có thể mặc định 10km nếu sản phẩm hiện tại chưa có preference khác.

Query:

``` text
location_mode=nearby
lat=...
lng=...
radius_km=10
```

Không đưa tọa độ chính xác của user vào URL nếu có rủi ro privacy; ưu
tiên state/request body hoặc cơ chế phù hợp stack.

------------------------------------------------------------------------

# 16. Privacy Geolocation

Vị trí chính xác của user:

-   chỉ dùng khi user cấp quyền;
-   không hiển thị công khai;
-   không ghi log không cần thiết;
-   không gửi sang analytics nếu không cần;
-   không lưu dài hạn mặc định.

Nếu cần lưu preference, ưu tiên location ID hoặc phạm vi thay vì precise
coordinates.

------------------------------------------------------------------------

# 17. Mobile UX

Trên mobile, thay popover nhỏ bằng:

``` text
Bottom Sheet
```

hoặc full-screen selector.

Ví dụ:

``` text
Khu vực                         ✕

🔎 Tìm khu vực...

○ Toàn quốc
📍 Quanh tôi

KHU VỰC
------------------------------
...
```

Touch target \>=44px.

Có swipe/scroll tự nhiên.

Không dùng dropdown desktop bé trên mobile.

------------------------------------------------------------------------

# 18. Recent Locations

Có thể lưu:

``` text
Khu vực gần đây
```

Ví dụ tối đa 3--5 lựa chọn.

Chỉ lưu location ID, không duplicate location object.

Có thể lưu client preference nếu không nhạy cảm.

------------------------------------------------------------------------

# 19. Popular Locations

Hỗ trợ:

``` text
Khu vực phổ biến
```

Không hard-code trong frontend.

Có thể lấy từ:

``` text
location_popularity
```

hoặc config Admin.

Ranking có thể dựa trên search/listing volume nhưng không làm thay đổi
taxonomy.

------------------------------------------------------------------------

# 20. Header Search Integration

Search state gồm:

``` text
keyword
category
location
radius
filters
sort
```

Ví dụ URL:

``` text
/search?q=iphone&location=...
```

Dùng slug/code/ID theo routing convention hiện tại.

Không phụ thuộc tên hiển thị.

------------------------------------------------------------------------

# 21. Search Results Filter

Trang kết quả phải dùng cùng LocationSelector.

Filter có thể hiển thị:

``` text
Khu vực
────────────
Gia Lai
× Xóa

Bán kính
10 km
```

Đổi location phải refresh query/filter đúng cách.

Không reset các filter khác ngoài những field phụ thuộc nếu không cần.

------------------------------------------------------------------------

# 22. Posting Engine Integration

Form Đăng tin sử dụng cùng Location Engine nhưng semantics khác Search.

Posting yêu cầu location của listing:

``` text
Khu vực đăng tin *
```

User chọn node phù hợp với policy hiện tại.

Có thể hỗ trợ:

``` text
Tỉnh/Thành
→ đơn vị trực thuộc
→ đơn vị nhỏ hơn nếu dataset có
```

Không dùng `Toàn quốc` cho listing vật lý trừ khi category/schema cho
phép.

------------------------------------------------------------------------

# 23. Listing Location Data

Listing nên lưu:

``` text
location_id
```

và nếu cần denormalization:

``` text
province_id
district_id
ward_id
```

theo schema hiện tại.

Nếu có coordinates phục vụ nearby:

``` text
latitude
longitude
```

nhưng không expose precise values qua public API.

------------------------------------------------------------------------

# 24. Trang chi tiết tin

Public UI chỉ hiển thị phạm vi phù hợp:

``` text
📍 [Khu vực công khai]
```

Không hiển thị:

``` text
số nhà
tọa độ chính xác
địa chỉ giao dịch riêng tư
```

trừ khi nghiệp vụ tương lai có consent/policy rõ ràng.

------------------------------------------------------------------------

# 25. Nearby Listings

Chuẩn bị API/query:

``` text
GET /listings/nearby
```

hoặc tích hợp vào Search API.

Input:

``` text
lat
lng
radius
category
filters
```

Output: - listing hợp lệ; - khoảng cách xấp xỉ nếu policy cho phép; -
không expose seller coordinates.

------------------------------------------------------------------------

# 26. Related Listings + Location

Related score có thể dùng:

``` text
same_category
same_location
distance
price_similarity
freshness
engagement
```

Location chỉ là một signal, không bắt buộc tuyệt đối.

------------------------------------------------------------------------

# 27. Database Index

Tạo index phù hợp:

``` text
locations(parent_id)
locations(administrative_code)
locations(slug)
location_aliases(location_id)
```

Nếu DB hỗ trợ geospatial: - spatial index/PostGIS/GIS equivalent.

Không tự thêm dependency lớn nếu stack hiện tại đã có giải pháp.

------------------------------------------------------------------------

# 28. Location Search API

Theo convention hiện tại, ví dụ:

``` text
GET /api/locations
GET /api/locations/:id/children
GET /api/locations/search?q=
```

Response:

``` json
{
  "id": "...",
  "name": "...",
  "slug": "...",
  "type": "ward",
  "parentId": "...",
  "hasChildren": false
}
```

Không trả dữ liệu thừa.

------------------------------------------------------------------------

# 29. Search không dấu

Normalize để:

``` text
quy nhon
```

match:

``` text
Quy Nhơn
```

và aliases hợp lệ.

Phải xử lý Unicode tiếng Việt đúng cách.

------------------------------------------------------------------------

# 30. Location Selector State

Tạo model chung:

``` text
LocationSelection {
  mode: "nationwide" | "administrative" | "nearby",
  locationId?: string,
  label?: string,
  latitude?: number,
  longitude?: number,
  radiusKm?: number
}
```

Không truyền nhiều biến rời rạc thiếu nhất quán giữa components.

------------------------------------------------------------------------

# 31. URL State

Search/filter phải shareable.

Administrative location có thể encode vào URL.

Nearby search cần cân nhắc privacy; không nhất thiết encode precise GPS.

Back/Forward browser phải restore selection đúng.

------------------------------------------------------------------------

# 32. Cache

Cache:

``` text
top-level locations
children
popular locations
```

Location data ít thay đổi nên TTL hợp lý.

Khi Admin publish dataset mới:

``` text
invalidate cache
```

------------------------------------------------------------------------

# 33. Admin --- Location Manager

Thêm:

``` text
Quản trị
→ Khu vực
```

Admin có thể:

-   xem tree;
-   search;
-   enable/disable;
-   sửa tên hiển thị nếu được phép;
-   alias;
-   mapping;
-   sort popular locations;
-   import dataset;
-   xem listing count.

Không cho Admin tùy tiện đổi administrative code nếu đang được tham
chiếu.

------------------------------------------------------------------------

# 34. Import dữ liệu địa giới

Tạo importer có validation.

Hỗ trợ CSV/JSON nếu phù hợp.

Import flow:

``` text
Upload
→ Validate
→ Diff
→ Preview
→ Confirm
→ Import
→ Reindex
```

Báo:

``` text
New
Updated
Renamed
Deprecated
Mapping required
Conflict
```

Không overwrite production mù quáng.

------------------------------------------------------------------------

# 35. Dataset Version

Lưu:

``` text
location_dataset_versions
```

Ví dụ:

``` text
id
version
source
effective_date
imported_at
imported_by
notes
```

Giúp audit khi địa giới thay đổi.

------------------------------------------------------------------------

# 36. Migration listing cũ

Không reset location của listing hiện tại.

Quy trình:

``` text
Audit old location
→ Match administrative code
→ Match verified alias/mapping
→ Flag ambiguous
→ Manual review
→ Update location_id
```

Không auto-map khi confidence thấp.

------------------------------------------------------------------------

# 37. Backward Compatibility

Nếu URL cũ chứa:

``` text
province
district
ward
```

giữ hoạt động hoặc redirect sang canonical mới.

Không làm mất SEO/index hiện tại.

------------------------------------------------------------------------

# 38. Empty State

Nếu khu vực không có tin:

``` text
Chưa có tin phù hợp tại khu vực này.
```

Có thể đề xuất:

``` text
Mở rộng phạm vi tìm kiếm
```

Ví dụ:

``` text
10 km → 20 km
```

Không tự thay đổi search mà user không biết.

------------------------------------------------------------------------

# 39. Error State

Xử lý:

-   API location lỗi;
-   geolocation denied;
-   geolocation timeout;
-   location inactive;
-   alias ambiguous;
-   location không còn tồn tại;
-   search no result.

Không crash form tìm kiếm.

------------------------------------------------------------------------

# 40. Loading State

Dùng skeleton/spinner nhẹ cho: - top-level list; - children; - search
results.

Không khóa toàn trang.

------------------------------------------------------------------------

# 41. Accessibility

-   keyboard navigation;
-   arrow/Tab hợp lý;
-   Enter chọn;
-   Esc đóng;
-   focus trap nếu modal/bottom sheet;
-   aria-label;
-   aria-selected;
-   screen-reader label;
-   visible focus;
-   touch target \>=44px.

------------------------------------------------------------------------

# 42. Performance

-   lazy-load children;
-   debounce search;
-   request cancellation;
-   cache location tree;
-   virtualized list nếu dataset lớn;
-   không download toàn bộ dataset vào browser nếu không cần.

------------------------------------------------------------------------

# 43. Analytics

Nếu hệ thống đã có analytics:

``` text
location_selector_opened
location_search_used
location_selected
nationwide_selected
nearby_selected
geolocation_allowed
geolocation_denied
radius_changed
```

Không gửi precise lat/lng vào analytics.

------------------------------------------------------------------------

# 44. Component Architecture

Tùy framework hiện tại, tổ chức tương đương:

``` text
LocationSelector
LocationPopover
LocationMobileSheet
LocationSearch
LocationTree
LocationBreadcrumb
NearbyLocationSelector
RadiusSelector
RecentLocations
PopularLocations
```

Shared logic:

``` text
useLocationSelector
locationService
locationStore
```

Không duplicate logic giữa Header và Posting.

------------------------------------------------------------------------

# 45. Design Tất Tần Tật

Giữ design system hiện tại:

-   primary green;
-   white cards;
-   border nhẹ;
-   radius 12--16px;
-   shadow nhẹ;
-   typography rõ;
-   icon location dễ nhận biết.

Selected:

``` text
✓
```

màu primary.

Hover/focus rõ nhưng không rối.

------------------------------------------------------------------------

# 46. Desktop Layout

Popover khoảng:

``` text
width: 420–520px
max-height: 520–620px
```

tùy viewport.

Không bị cắt bởi container có `overflow:hidden`.

Tự reposition nếu gần mép viewport.

------------------------------------------------------------------------

# 47. Mobile Layout

\<=767px:

``` text
Bottom Sheet / Full-screen
```

Header sticky:

``` text
‹   Chọn khu vực          ✕
```

Search sticky nếu cần.

Footer `Áp dụng` sticky khi selection chưa commit.

------------------------------------------------------------------------

# 48. Security

-   validate location ID server-side;
-   không tin label client;
-   reject inactive location nếu policy yêu cầu;
-   sanitize search query;
-   rate-limit search endpoint nếu cần;
-   không expose private coordinates;
-   authorization cho Admin import/update.

------------------------------------------------------------------------

# 49. Tests

Unit: - hierarchy; - alias normalization; - selection state; -
nationwide; - nearby; - radius; - Unicode/no-accent search.

Integration: - Header selector → Search. - Filter selector → Search. -
Posting selector → Listing. - URL restore. - inactive location. - Admin
import.

E2E: 1. Toàn quốc. 2. Chọn tỉnh/thành. 3. Chọn node con. 4. Search không
dấu. 5. Quanh tôi allow. 6. Quanh tôi deny. 7. Đổi radius. 8. Mobile
bottom sheet. 9. Đăng tin với location. 10. Edit listing giữ location.

------------------------------------------------------------------------

# 50. Acceptance Criteria

Chỉ hoàn thành khi:

-   Một Location Engine dùng toàn hệ thống.
-   Không hard-code tỉnh/thành trong nhiều components.
-   Search location có dấu/không dấu.
-   Hierarchy render động.
-   Toàn quốc hoạt động.
-   Quanh tôi chỉ xin permission sau user action.
-   Radius search hoạt động nếu backend hỗ trợ.
-   Header + Filter + Posting dùng chung engine.
-   Public API không expose precise seller location.
-   Mobile UX tốt.
-   Alias/mapping hỗ trợ thay đổi địa giới.
-   Migration không mất location cũ.
-   Admin quản trị/import được.
-   Backward URL compatibility.
-   Build/lint/typecheck/test pass.

------------------------------------------------------------------------

# 51. Deliverables

Sau triển khai báo cáo:

1.  Current-state audit.
2.  Location data source hiện tại.
3.  DB migrations.
4.  Dataset/import strategy.
5.  Files created/modified.
6.  API endpoints.
7.  Components.
8.  Header integration.
9.  Search/filter integration.
10. Posting Engine integration.
11. Privacy implementation.
12. Nearby/radius implementation.
13. Admin Location Manager.
14. Migration result.
15. Tests.
16. Build result.
17. Remaining TODO.

------------------------------------------------------------------------

# 52. Nguyên tắc cuối cùng

Mục tiêu kiến trúc:

``` text
                  LOCATION ENGINE
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
     SEARCH           POSTING         ADMIN
        │               │
        ↓               ↓
     FILTER          LISTING
        │               │
        └───────┬───────┘
                ↓
        NEARBY / RELATED
```

Mọi module phải tham chiếu **Location ID / administrative code**, không
dựa vào text name để làm khóa nghiệp vụ.

Location Selector của Tất Tần Tật phải có trải nghiệm đơn giản tương tự
các marketplace quen thuộc, nhưng được xây thành **hệ thống khu vực độc
lập, nhất quán, có khả năng cập nhật địa giới và bảo vệ quyền riêng
tư**.
