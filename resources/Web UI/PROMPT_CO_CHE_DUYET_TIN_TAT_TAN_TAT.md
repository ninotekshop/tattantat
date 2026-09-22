# MASTER PROMPT --- TRIỂN KHAI CƠ CHẾ DUYỆT TIN ĐĂNG TẤT TẦN TẬT

## 1. Vai trò & mục tiêu

Bạn là **Senior Full-stack Engineer + Marketplace Architect + Security
Engineer**.

Hãy triển khai hoàn chỉnh cơ chế **Moderation / Duyệt tin đăng** cho
marketplace **Tất Tần Tật** dựa trên source code hiện tại.

-   Website: `www.tattantat.vn`
-   Admin: `/admin`
-   Giao diện Admin đã có.
-   Không redesign toàn bộ UI.
-   Phải audit project trước khi code.
-   Không tự đoán framework, database, ORM, authentication hoặc API
    convention.
-   Ưu tiên tái sử dụng architecture, services, schema và components
    hiện tại.

Mục tiêu:

> Tin đăng được kiểm tra tự động trước khi xuất hiện công khai; tin an
> toàn có thể tự động duyệt, tin đáng ngờ chuyển Admin; nội dung vi phạm
> rõ ràng bị giữ/yêu cầu sửa. Đặc biệt, tuyệt đối không cho người mua và
> người bán trao đổi thông tin liên hệ cá nhân để lách giao dịch ngoài
> Tất Tần Tật.

------------------------------------------------------------------------

# 2. Nguyên tắc Marketplace khép kín

Tất Tần Tật là marketplace trung gian giao dịch.

Người mua KHÔNG được thấy trực tiếp:

-   Số điện thoại người bán.
-   Email.
-   Địa chỉ giao dịch chính xác.
-   Tài khoản ngân hàng.
-   Zalo.
-   Facebook.
-   Telegram.
-   WhatsApp.
-   Link mạng xã hội.
-   QR liên hệ/thanh toán.
-   Thông tin liên hệ ngoài nền tảng.

Mọi trao đổi/giao dịch phải đi qua hệ thống Tất Tần Tật.

Thông tin cá nhân không chỉ được ẩn bằng CSS/frontend.

**Public API tuyệt đối không được trả các field nhạy cảm không cần thiết
về browser.**

------------------------------------------------------------------------

# 3. Audit trước khi triển khai

Trước khi sửa code:

1.  Scan project.
2.  Xác định frontend/backend.
3.  Xác định database + ORM.
4.  Xác định authentication/authorization.
5.  Xác định Post/Listing schema.
6.  Xác định User schema.
7.  Xác định Admin roles/permissions.
8.  Xác định API đăng tin.
9.  Xác định API Admin moderation.
10. Xác định upload/image storage.
11. Xác định notification system.
12. Xác định queue/job system nếu có.
13. Tìm mock moderation data.
14. Tìm logic approve/reject hiện có.
15. Kiểm tra public API có leak phone/email/address hay không.

Sau audit, tạo báo cáo ngắn:

## MODERATION IMPLEMENTATION PLAN

### ĐÃ CÓ

### CẦN KẾT NỐI

### CẦN XÂY

### CẦN MIGRATION

### SECURITY / PRIVACY RISKS

Sau đó mới code.

------------------------------------------------------------------------

# 4. Moderation Pipeline

Khi user gửi tin:

``` text
POST SUBMITTED
      ↓
VALIDATION
      ↓
NORMALIZATION
      ↓
RULE ENGINE
      ↓
CONTACT / OFF-PLATFORM DETECTION
      ↓
SPAM / DUPLICATE CHECK
      ↓
CONTENT & IMAGE MODERATION
      ↓
RISK ENGINE
      ↓
 ┌──────────────┬───────────────────┬─────────────────┐
 │ LOW RISK     │ MEDIUM RISK       │ HIGH RISK       │
 │              │                   │                 │
 │ AUTO APPROVE │ ADMIN REVIEW      │ FLAG / HOLD     │
 └──────────────┴───────────────────┴─────────────────┘
```

Không cho tin xuất hiện public trước khi moderation pipeline hoàn thành,
trừ khi business rule hiện tại đã có cơ chế an toàn tương đương.

------------------------------------------------------------------------

# 5. Trạng thái tin đăng

Audit status hiện tại trước.

Nếu cần mở rộng, dùng state tương đương:

``` text
DRAFT
PROCESSING
PENDING_REVIEW
APPROVED
NEEDS_CHANGES
REJECTED
FLAGGED
HIDDEN
SOLD
EXPIRED
```

Không đổi tên status hiện có nếu không cần.

State transition phải được backend validate.

Ví dụ:

``` text
DRAFT
  ↓
PROCESSING
  ↓
├── APPROVED
├── PENDING_REVIEW
├── NEEDS_CHANGES
└── FLAGGED
```

Admin review:

``` text
PENDING_REVIEW / FLAGGED
          ↓
├── APPROVED
├── NEEDS_CHANGES
└── REJECTED
```

------------------------------------------------------------------------

# 6. Validation Layer

Kiểm tra trước moderation:

-   Title.
-   Description.
-   Category.
-   Price nếu category yêu cầu.
-   Location ở mức được phép.
-   Images nếu category yêu cầu.
-   Required attributes.
-   File type.
-   Image count.
-   File size.

Tin thiếu dữ liệu không cần gửi AI.

Trả lỗi cụ thể để user sửa.

------------------------------------------------------------------------

# 7. Normalization

Trước khi chạy rule:

-   Normalize Unicode.
-   Lowercase bản copy dùng cho detection.
-   Chuẩn hóa khoảng trắng.
-   Nhận diện ký tự thay thế.
-   Loại zero-width characters cho detection.
-   Chuẩn hóa dạng số điện thoại.
-   Chuẩn hóa URL.
-   Chuẩn hóa text obfuscation ở mức hợp lý.

Không thay đổi nội dung gốc của user một cách mất dữ liệu.

Giữ `originalContent` và dùng normalized representation cho moderation
nếu architecture phù hợp.

------------------------------------------------------------------------

# 8. Contact Information Detection --- Ưu tiên cao

Phải phát hiện thông tin liên hệ trong:

-   Title.
-   Description.
-   Custom attributes.
-   Image text nếu hệ thống có image/OCR moderation.
-   Chat ở phase riêng sau này.

Phát hiện:

``` text
PHONE_NUMBER
EMAIL
EXTERNAL_URL
ZALO
FACEBOOK
MESSENGER
TELEGRAM
WHATSAPP
SOCIAL_HANDLE
BANK_ACCOUNT
PAYMENT_QR
CONTACT_QR
```

Ví dụ cần nhận diện:

``` text
0901992349
0901 992 349
0901.992.349
0901-992-349
09O1 992 349
zalo 090...
fb.com/...
facebook.com/...
t.me/...
@gmail.com
```

Thiết kế detector có khả năng mở rộng.

Không phụ thuộc duy nhất vào một regex khổng lồ.

------------------------------------------------------------------------

# 9. Chính sách khi phát hiện thông tin liên hệ

Đối với contact info rõ ràng:

**Không Auto Approve.**

Ưu tiên:

``` text
NEEDS_CHANGES
```

và trả về reason code.

Ví dụ:

``` json
{
  "code": "CONTACT_INFO_DETECTED",
  "message": "Tin đăng có chứa thông tin liên hệ ngoài Tất Tần Tật. Vui lòng xóa thông tin này để tiếp tục."
}
```

Không nhất thiết chuyển Admin nếu user có thể tự sửa.

Sau khi sửa → chạy moderation lại.

------------------------------------------------------------------------

# 10. Không cho leak PII qua API

Audit public endpoints.

Listing public chỉ trả seller public profile tối thiểu, ví dụ:

``` json
{
  "seller": {
    "id": "...",
    "displayName": "Nguyễn H.",
    "avatar": "...",
    "verified": true,
    "rating": 4.9,
    "generalLocation": "Quy Nhơn, Gia Lai"
  }
}
```

Không trả:

``` text
phone
email
exactAddress
bankAccount
privateNotes
verificationDocuments
```

Không gửi dữ liệu xuống frontend rồi hide bằng CSS.

------------------------------------------------------------------------

# 11. Prohibited Content Rule Engine

Tạo rule system có cấu trúc.

Không hard-code tất cả rule trong React component.

Reason codes có thể gồm:

``` text
CONTACT_INFO_DETECTED
EXTERNAL_URL_DETECTED
SOCIAL_MEDIA_DETECTED
PAYMENT_INFO_DETECTED
QR_CODE_DETECTED

PROHIBITED_ITEM
SPAM
DUPLICATE_POST
MISLEADING_CONTENT
PRICE_ANOMALY
WRONG_CATEGORY
SUSPICIOUS_CONTENT
IMAGE_POLICY_VIOLATION
TOO_MANY_POSTS
```

Rule phải có thể thêm/bớt mà không phá pipeline.

------------------------------------------------------------------------

# 12. Spam Detection

Kiểm tra:

-   User đăng quá nhiều tin trong thời gian ngắn.
-   Nội dung giống nhau.
-   Title lặp.
-   Description lặp.
-   Image reuse nếu architecture hỗ trợ.
-   Nhiều account đăng nội dung gần giống nếu có tín hiệu phù hợp.
-   Repeated external-contact attempts.

Không auto-ban user chỉ vì một tín hiệu đơn lẻ.

------------------------------------------------------------------------

# 13. Duplicate Detection

Phát hiện tin trùng dựa trên tín hiệu phù hợp:

-   normalized title.
-   description similarity.
-   seller.
-   category.
-   images/hash nếu có.

Kết quả nên trả:

``` text
duplicateScore
matchedPostIds
```

Nếu confidence không đủ cao → Admin review thay vì reject tự động.

------------------------------------------------------------------------

# 14. Price Anomaly

Nếu category có price:

Phát hiện giá bất thường.

Ví dụ:

``` text
iPhone cao cấp → 1.000đ
Ô tô → 10.000đ
```

Không hard-code vài sản phẩm cụ thể.

Nếu chưa có đủ dữ liệu thị trường:

Price anomaly chỉ là risk signal.

Không reject chỉ dựa vào giá.

------------------------------------------------------------------------

# 15. Image Moderation

Kiểm tra hình ảnh nếu infrastructure hỗ trợ:

-   Nội dung bị cấm.
-   QR code.
-   Số điện thoại.
-   Email.
-   URL.
-   Watermark chứa contact info.
-   Ảnh không liên quan.
-   Duplicate images nếu có.

Không dùng OCR lặp vô tội vạ.

Nếu image analysis bất định:

→ `PENDING_REVIEW`.

------------------------------------------------------------------------

# 16. AI Moderation

AI là một lớp tín hiệu, không phải nguồn quyết định duy nhất.

AI có thể đánh giá:

-   Spam.
-   Scam-like language.
-   Wrong category.
-   Misleading content.
-   Prohibited content.
-   Contact/off-platform attempts.
-   Title-description mismatch.
-   Image-text mismatch nếu model hỗ trợ.

Output phải structured.

Ví dụ:

``` json
{
  "riskScore": 62,
  "recommendedAction": "REVIEW",
  "reasons": [
    {
      "code": "SUSPICIOUS_CONTENT",
      "confidence": 0.81
    }
  ]
}
```

Không lưu chain-of-thought.

Chỉ lưu structured moderation result/reasons cần thiết.

------------------------------------------------------------------------

# 17. AI Failure Handling

Nếu AI provider timeout/error:

Không tự động approve một tin chỉ vì AI lỗi.

Fallback theo rule:

-   Nếu deterministic checks đều sạch và policy cho phép → có thể xử lý
    theo policy cấu hình.
-   Nếu cần AI để quyết định → `PENDING_REVIEW`.

Không để lỗi AI làm mất tin user.

------------------------------------------------------------------------

# 18. Risk Engine

Tạo risk engine tập trung.

Không phân tán logic score ở nhiều component.

Ví dụ ban đầu:

``` text
0–29    LOW
30–69   MEDIUM
70–100  HIGH
```

Default action:

``` text
LOW     → AUTO_APPROVE
MEDIUM  → PENDING_REVIEW
HIGH    → FLAGGED / HOLD
```

Nhưng threshold phải configurable.

Không hard-code vào UI.

------------------------------------------------------------------------

# 19. Hard Rules

Một số deterministic violation có thể override Risk Score.

Ví dụ:

``` text
CONTACT_INFO_DETECTED
PAYMENT_INFO_DETECTED
EXTERNAL_CONTACT_QR
```

→ `NEEDS_CHANGES`

Các nội dung rõ ràng bị cấm theo policy:

→ `FLAGGED` hoặc `REJECTED` tùy business rule.

Không để Risk Score thấp override hard violation.

------------------------------------------------------------------------

# 20. User Trust Signals

Nếu hệ thống có đủ dữ liệu, Risk Engine có thể sử dụng:

-   Account age.
-   Verification status.
-   Previous approved posts.
-   Previous violations.
-   Reports.
-   Successful transactions.
-   Repeated rejected posts.

Không dùng các thuộc tính nhạy cảm không liên quan.

Không tạo black-box "trust score" mà Admin không thể giải thích.

Lưu các signal/reason cụ thể.

------------------------------------------------------------------------

# 21. Auto Approve

Tin chỉ được Auto Approve khi:

-   Validation pass.
-   Không hard violation.
-   Không contact info.
-   Không payment/off-platform info.
-   Spam check pass.
-   Duplicate risk thấp.
-   Content checks pass.
-   Risk dưới threshold.
-   User/account không có restriction liên quan.

Khi auto approve:

``` text
status = APPROVED
moderationDecision = AUTO_APPROVED
approvedAt = now
```

Lưu moderation log.

------------------------------------------------------------------------

# 22. Admin Review Queue

Hoàn thiện khu vực:

`Quản lý tin đăng → Chờ duyệt`

Admin thấy:

-   Thumbnail.
-   Title.
-   Seller public/admin-safe identity.
-   Category.
-   Price.
-   Created time.
-   Risk level.
-   Risk score nếu hữu ích.
-   Reason codes.
-   Moderation checks.
-   Previous violations nếu permission cho phép.

Không expose PII không cần thiết cho Moderator.

------------------------------------------------------------------------

# 23. Sắp xếp hàng chờ

Mặc định ưu tiên:

1.  High risk.
2.  Oldest waiting.
3.  Medium risk.
4.  Manual reports/escalations.

Cho filter:

``` text
ALL
HIGH_RISK
MEDIUM_RISK
CONTACT_INFO
SPAM
DUPLICATE
PROHIBITED
IMAGE
AI_FLAGGED
```

Có search và server-side pagination.

------------------------------------------------------------------------

# 24. Admin Actions

Admin/Moderator có quyền phù hợp có thể:

``` text
APPROVE
REJECT
REQUEST_CHANGES
HIDE
ESCALATE
```

Mỗi action phải authorization ở backend.

Không chỉ disable button frontend.

------------------------------------------------------------------------

# 25. Approve

Admin approve:

``` text
status = APPROVED
approvedBy = adminId
approvedAt = now
moderationDecision = MANUAL_APPROVED
```

Sau đó:

-   Audit log.
-   Notification.
-   Revalidate listing.
-   Remove khỏi pending queue.

------------------------------------------------------------------------

# 26. Reject

Reject bắt buộc reason.

Preset:

-   Hàng hóa/nội dung không được phép.
-   Spam.
-   Nội dung gây hiểu nhầm.
-   Vi phạm nhiều lần.
-   Khác.

Cho internal note nếu cần.

Không hiển thị internal security notes cho seller.

------------------------------------------------------------------------

# 27. Request Changes

Đây là action quan trọng.

Dùng khi tin có thể sửa:

-   Có số điện thoại.
-   Có Zalo.
-   Có URL ngoài.
-   Sai category.
-   Thiếu thông tin.
-   Giá cần kiểm tra.
-   Ảnh chứa thông tin liên hệ.

Seller nhận reason rõ ràng.

Sau khi seller sửa:

``` text
NEEDS_CHANGES
      ↓
PROCESSING
      ↓
MODERATION PIPELINE AGAIN
```

Không tự động dùng kết quả moderation cũ.

------------------------------------------------------------------------

# 28. Seller Notification

Thông báo trong app/web khi:

-   Approved.
-   Needs changes.
-   Rejected.
-   Hidden.

Ví dụ:

> Tin đăng của bạn có chứa thông tin liên hệ ngoài Tất Tần Tật. Vui lòng
> xóa số điện thoại/Zalo/đường dẫn và gửi lại.

Không tiết lộ chi tiết detection nội bộ có thể giúp spammer né hệ thống.

------------------------------------------------------------------------

# 29. Moderation Log

Tạo/hoàn thiện moderation history.

Schema tùy ORM hiện tại nhưng cần tương đương:

``` text
id
postId
pipelineVersion
riskScore
riskLevel
decision
reasonCodes
ruleResults
aiResultSummary
createdAt
```

Nếu Admin action:

``` text
reviewedBy
reviewedAt
adminDecision
adminReason
```

Không lưu chain-of-thought.

------------------------------------------------------------------------

# 30. Audit Log

Admin actions cần audit:

``` text
POST_APPROVED
POST_REJECTED
POST_REQUESTED_CHANGES
POST_HIDDEN
POST_ESCALATED
```

Lưu tương đương:

``` text
actorId
postId
action
reason
timestamp
```

------------------------------------------------------------------------

# 31. Moderation History UI

Trong Post Detail, tạo section:

`Lịch sử kiểm duyệt`

Ví dụ:

``` text
10:31 — Tin được gửi
10:31 — Rule Engine hoàn tất
10:31 — Phát hiện CONTACT_INFO
10:31 — Yêu cầu chỉnh sửa
10:45 — Người bán chỉnh sửa
10:45 — Kiểm tra lại
10:46 — Auto Approved
```

Chỉ Admin thấy technical details.

Seller chỉ thấy thông báo phù hợp.

------------------------------------------------------------------------

# 32. Admin Permissions

Tích hợp RBAC hiện tại.

Permission đề xuất:

``` text
posts.view
posts.review
posts.approve
posts.reject
posts.request_changes
posts.hide
posts.escalate

moderation.view_details
moderation.manage_rules
```

Nếu hệ thống đã có permission convention khác → dùng convention hiện
tại.

------------------------------------------------------------------------

# 33. Privacy Permission

Không mặc định Moderator được xem PII.

Nếu cần access dữ liệu riêng tư cho support/dispute:

``` text
users.view_private
orders.view_shipping_address
```

và phải audit access nếu architecture hỗ trợ.

------------------------------------------------------------------------

# 34. Moderation Configuration

Nếu phù hợp, tạo Admin Settings:

`/admin/settings/moderation`

Cho Super Admin cấu hình:

-   Auto Approve enabled.
-   Low-risk threshold.
-   Review threshold.
-   Spam limits.
-   Duplicate threshold.
-   AI moderation enabled.
-   Image moderation enabled.

Không cho role thường thay đổi.

Validate giá trị.

Lưu audit khi thay đổi.

------------------------------------------------------------------------

# 35. Không cho rule thay đổi phá production

Config phải có safe defaults.

Không cho:

``` text
autoApproveThreshold = 100
```

nếu điều này vô tình auto approve mọi nội dung nguy hiểm.

Thiết lập validation/range an toàn.

Hard rules không được tắt tùy tiện.

------------------------------------------------------------------------

# 36. Re-Moderation

Khi seller sửa các field quan trọng:

-   title
-   description
-   category
-   price
-   images

phải re-run moderation.

Không giữ `APPROVED` nếu nội dung đã thay đổi đáng kể mà chưa kiểm tra
lại.

Có thể phân biệt field thay đổi không ảnh hưởng moderation nếu business
logic chứng minh an toàn.

------------------------------------------------------------------------

# 37. Approved Post Monitoring

Một tin đã Approved vẫn có thể:

-   Bị report.
-   Bị phát hiện vi phạm sau đó.
-   Bị seller sửa.
-   Bị hệ thống re-check.

Có thể chuyển:

``` text
APPROVED → FLAGGED
APPROVED → HIDDEN
```

theo rule/permission phù hợp.

------------------------------------------------------------------------

# 38. Transaction Protection

Moderation phải hỗ trợ mục tiêu:

> Mọi giao dịch đi qua Tất Tần Tật.

Không cho listing hướng user sang:

-   Chuyển khoản trực tiếp.
-   Gọi điện trực tiếp.
-   Zalo.
-   Facebook.
-   Telegram.
-   Website ngoài.
-   QR thanh toán ngoài.

CTA public ưu tiên:

``` text
MUA NGAY
CHAT VỚI NGƯỜI BÁN
```

đều là chức năng nội bộ Tất Tần Tật.

------------------------------------------------------------------------

# 39. API Security

Public listing API phải dùng DTO/serializer riêng.

Không serialize trực tiếp toàn bộ User model.

Admin API phải:

-   Authenticate.
-   Authorize.
-   Validate input.
-   Rate limit nếu phù hợp.
-   Audit sensitive actions.

------------------------------------------------------------------------

# 40. Concurrency

Ngăn hai Admin cùng duyệt một tin.

Nếu Admin A đã xử lý trong khi Admin B đang mở:

Admin B phải nhận `409 Conflict` hoặc cơ chế tương đương.

Có thể dùng:

-   version field.
-   optimistic locking.
-   conditional atomic update.

Theo stack hiện tại.

------------------------------------------------------------------------

# 41. Idempotency

Approve/reject endpoint phải xử lý double-click/retry an toàn.

Không tạo:

-   duplicate notification.
-   duplicate audit.
-   invalid state.

------------------------------------------------------------------------

# 42. Performance

Moderation không được làm request đăng tin treo quá lâu.

Nếu project có queue/job infrastructure:

cân nhắc:

``` text
Submit
  ↓
PROCESSING
  ↓
Background Moderation Job
  ↓
Decision
```

Nếu chưa có queue, không tự thêm hệ thống phức tạp trước khi audit.

Rule nhẹ có thể chạy sync.

AI/image checks có thể async nếu cần.

------------------------------------------------------------------------

# 43. Failure & Retry

Background job cần:

-   retry policy.
-   max retries.
-   failure status.
-   logging.

Sau max retry:

→ `PENDING_REVIEW`

Không mất listing.

Không auto approve vì worker lỗi.

------------------------------------------------------------------------

# 44. Observability

Theo dõi:

-   moderation processing time.
-   auto approval rate.
-   manual review rate.
-   needs changes rate.
-   rejection rate.
-   AI failure rate.
-   queue backlog.

Không log PII không cần thiết.

------------------------------------------------------------------------

# 45. Moderation Analytics

Admin Analytics có thể hiển thị:

``` text
Tổng tin gửi
Auto Approved
Manual Approved
Needs Changes
Rejected
Flagged
Average Review Time
Pending Queue
```

Thêm thống kê reason:

``` text
CONTACT_INFO
SPAM
DUPLICATE
PROHIBITED
IMAGE
OTHER
```

------------------------------------------------------------------------

# 46. Feedback Loop

Lưu khác biệt giữa automated recommendation và Admin decision.

Ví dụ:

``` text
System: REVIEW
Admin: APPROVE
```

hoặc:

``` text
System: LOW_RISK
Later: confirmed violation
```

Dùng dữ liệu để điều chỉnh rule/threshold.

Không tự động train/deploy model vào production nếu chưa có quy trình
kiểm thử.

------------------------------------------------------------------------

# 47. Testing

Viết test theo stack hiện tại.

Bắt buộc test:

### Contact detection

-   Phone.
-   Phone có khoảng trắng.
-   Phone dùng dấu chấm.
-   Phone dùng dấu gạch.
-   Email.
-   URL.
-   Zalo.
-   Facebook.
-   Telegram.
-   QR nếu detector hỗ trợ.

### Workflow

-   Clean post → auto approve khi policy cho phép.
-   Medium risk → pending review.
-   Contact info → needs changes.
-   Admin approve.
-   Admin reject.
-   Request changes.
-   Seller edit → re-moderation.

### Security

-   User thường gọi Admin API → 403.
-   Moderator thiếu permission → 403.
-   Public API không trả phone/email/address.
-   Invalid state transition.
-   Concurrent review.
-   Double submit.

------------------------------------------------------------------------

# 48. Không được làm

Không:

-   Auto approve tất cả.
-   Tin tưởng AI tuyệt đối.
-   Auto reject mọi case AI nghi ngờ.
-   Leak PII qua API.
-   Chỉ hide PII bằng CSS.
-   Cho phone/email/address trong listing.
-   Cho seller đưa Zalo/Facebook/Telegram vào tin.
-   Cho payment instruction ngoài hệ thống.
-   Hard-code moderation trong React component.
-   Fake moderation result.
-   Fake risk score.
-   Reset database.
-   Xóa production data.
-   Đổi framework/ORM/authentication không cần thiết.
-   Lưu AI chain-of-thought.

------------------------------------------------------------------------

# 49. Definition of Done

Moderation chỉ hoàn thành khi có:

``` text
Submission
+ Validation
+ Rule Engine
+ Contact Detection
+ Spam Detection
+ Duplicate Detection
+ Risk Engine
+ Auto Approve policy
+ Admin Review Queue
+ Approve/Reject/Request Changes
+ Re-Moderation
+ Notification
+ Moderation Log
+ Audit Log
+ RBAC
+ Public API Privacy
+ Error Handling
+ Tests
```

------------------------------------------------------------------------

# 50. Thứ tự triển khai

## PHASE 0 --- AUDIT

Audit source/schema/API/privacy.

## PHASE 1 --- DATA MODEL

Status + moderation log + migration nếu cần.

## PHASE 2 --- PRIVACY

Loại PII khỏi public APIs.

## PHASE 3 --- RULE ENGINE

Validation + contact + off-platform + spam.

## PHASE 4 --- RISK ENGINE

Scoring + hard rules + decision.

## PHASE 5 --- ADMIN QUEUE

Pending review + filters + detail.

## PHASE 6 --- ADMIN ACTIONS

Approve + Reject + Request Changes + Audit.

## PHASE 7 --- RE-MODERATION

Seller edit → pipeline lại.

## PHASE 8 --- AI / IMAGE MODERATION

Chỉ sau khi deterministic foundation ổn định.

## PHASE 9 --- ANALYTICS

Moderation metrics + feedback.

## PHASE 10 --- HARDENING

Security + concurrency + testing + performance.

------------------------------------------------------------------------

# 51. Bắt đầu

Bắt đầu bằng **PHASE 0 --- AUDIT**.

Không code trước khi audit.

Sau audit, báo cáo:

``` text
1. Current Post Schema
2. Current Post Status Workflow
3. Current Admin APIs
4. Current Public Listing APIs
5. Current PII Exposure
6. Existing Moderation Logic
7. Existing RBAC
8. Required Migrations
9. Security Risks
10. Implementation Plan
```

Sau đó mới triển khai từng phase.

## Mục tiêu cuối cùng

Xây dựng cơ chế:

``` text
USER SUBMITS POST
        ↓
AUTOMATED MODERATION
        ↓
 ┌─────────────┬───────────────┬─────────────────┐
 │ SAFE        │ UNCERTAIN     │ POLICY ISSUE    │
 │             │               │                 │
 │ AUTO APPROVE│ ADMIN REVIEW  │ NEEDS CHANGES / │
 │             │               │ FLAG            │
 └─────────────┴───────────────┴─────────────────┘
        ↓
PUBLIC MARKETPLACE
        ↓
CHAT / ORDER / PAYMENT
        ↓
TẤT CẢ GIAO DỊCH QUA TẤT TẦN TẬT
```

Ưu tiên theo thứ tự:

**Privacy → deterministic rules → human review → automation → AI →
optimization.**
