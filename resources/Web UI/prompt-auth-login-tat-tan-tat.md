# PROMPT TRIỂN KHAI AUTHENTICATION – TẤT TẦN TẬT

## Mục tiêu

Đóng vai Senior Full-stack Engineer. Hãy kiểm tra codebase hiện tại và triển khai hoàn chỉnh hệ thống đăng nhập/đăng ký cho **Tất Tần Tật – tattantat.vn**. Không chỉ tạo mockup UI.

Yêu cầu:
- Đăng nhập/đăng ký bằng **popup/modal**, không chuyển trang.
- Email + mật khẩu.
- Google.
- Facebook.
- Apple.
- Số điện thoại + OTP.
- Quên/reset mật khẩu.
- Xác minh email khi cần.
- Gửi email chúc mừng đăng ký thành công.
- Email hệ thống gửi từ **Tất Tần Tật <hotro@tattantat.vn>**.
- Responsive desktop/mobile.
- Ưu tiên bảo mật và không tạo tài khoản trùng.

## 1. Kiểm tra codebase trước khi triển khai

Trước khi code, xác định:
- Framework frontend/backend.
- Database và ORM.
- User model hiện tại.
- Session/token/auth library hiện tại.
- API authentication hiện có.
- Email/SMS service hiện có.

Tái sử dụng stack và kiến trúc hiện tại. Không thay framework hoặc dựng một hệ thống auth song song nếu project đã có auth. Migration database phải an toàn với dữ liệu hiện có.

Không hard-code OAuth secret, SMTP password, SMS API key hoặc private key. Tất cả secret lấy từ environment variables.

## 2. Auth Modal

Khi người chưa đăng nhập click `Tài khoản`, `Yêu thích`, `Tin nhắn`, `Đăng tin miễn phí` hoặc chức năng yêu cầu authentication, mở Auth Modal ngay trên trang hiện tại.

Desktop:
- Width 440–500px.
- Border radius 20–24px.
- Nền trắng.
- Shadow nhẹ.
- Overlay tối mờ.
- Animation fade + scale 150–200ms.

Mobile:
- Modal gần full-screen hoặc bottom sheet.
- Không overflow khi bàn phím mở.
- Touch target >= 44px.

Header:
- Logo Tất Tần Tật.
- **Chào mừng đến Tất Tần Tật**
- `Mua bán dễ dàng – Kết nối mọi người`
- Nút đóng `×`.

Modal có tab:

`Đăng nhập | Đăng ký`

Sau login thành công:
- Đóng modal.
- Giữ nguyên trang hiện tại.
- Refresh auth state.
- Tiếp tục action trước đó nếu phù hợp.
- Không reload toàn trang nếu không cần.

## 3. Đăng nhập Email

Fields:
- Email.
- Mật khẩu + show/hide.
- `Ghi nhớ đăng nhập`.
- `Quên mật khẩu?`
- CTA **Đăng nhập**.

Validation cả frontend và backend.

Thông báo login sai dùng câu trung tính:

`Email hoặc mật khẩu chưa chính xác.`

Không tiết lộ tài khoản nào tồn tại.

## 4. Đăng ký

Fields:
- Họ và tên.
- Email.
- Mật khẩu.
- Nhập lại mật khẩu.
- Show/hide password.

Mật khẩu tối thiểu 8 ký tự và áp dụng password policy phù hợp với auth library/framework.

Checkbox bắt buộc:

`Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Tất Tần Tật.`

Hai tài liệu phải click được.

CTA: **Tạo tài khoản**

Sau đăng ký:
1. Tạo đúng một User.
2. Xác minh email nếu chính sách yêu cầu.
3. Gửi welcome email một lần.
4. Login tự động chỉ khi phù hợp với chính sách email verification.
5. Refresh auth state.

Database phải có unique constraint để chống race condition khi đăng ký trùng email.

## 5. Social Login

Hiển thị divider:

**Hoặc tiếp tục với**

Buttons:
- Google.
- Facebook.
- Apple.

Dùng OAuth/OIDC flow chính thức, không giả lập.

Google: lưu tối thiểu providerAccountId, email, tên/avatar nếu provider cấp.

Facebook: không giả định Facebook luôn trả email.

Apple:
- Hỗ trợ Sign in with Apple đúng chuẩn.
- Apple có thể chỉ cung cấp tên ở lần authorization đầu.
- Hỗ trợ Hide My Email.
- Không phụ thuộc provider luôn trả lại name/email.

OAuth security:
- `state`.
- PKCE khi provider/flow hỗ trợ hoặc yêu cầu.
- Callback whitelist chính xác.
- Validate provider response.
- Production chỉ dùng HTTPS.
- Không tin OAuth payload do client tự gửi thay cho provider verification.

## 6. Account Linking

Thiết kế `User` và `Account/AuthProvider` để một User có thể liên kết:
- credentials,
- google,
- facebook,
- apple,
- phone.

Không tùy tiện tạo user mới khi cùng người dùng đăng nhập provider khác.

Tuy nhiên **không tự động link chỉ dựa trên email nếu email/provider chưa được xác minh đủ an toàn**. Nếu có nguy cơ account takeover, yêu cầu xác thực tài khoản hiện tại trước khi link.

Unique constraint:

`provider + providerAccountId`

## 7. Đăng nhập số điện thoại + OTP

Có lựa chọn **Đăng nhập bằng số điện thoại**.

Input:
`+84 | Số điện thoại`

Chuẩn hóa số Việt Nam, ưu tiên lưu dạng E.164 như `+84901234567`.

CTA: **Gửi mã OTP**

Màn hình OTP:
- 6 chữ số.
- Auto-focus.
- Cho phép paste cả mã.
- Numeric keyboard trên mobile.
- Mask số điện thoại, ví dụ `•••• 2349`.
- Countdown 60 giây.
- `Gửi lại mã`.

Security:
- OTP hết hạn khoảng 5 phút.
- Single-use.
- Giới hạn số lần nhập sai.
- Rate-limit send/resend/verify.
- Rate-limit theo phone + IP + session/device ở mức phù hợp.
- Không lưu/log OTP plaintext trong production.
- Dùng SMS provider adapter cấu hình bằng ENV.

## 8. Quên mật khẩu

Click **Quên mật khẩu?** chuyển view trong cùng modal.

Text:

`Nhập email đã đăng ký. Tất Tần Tật sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.`

CTA: **Gửi hướng dẫn**

Response luôn trung tính:

`Nếu email này được đăng ký tại Tất Tần Tật, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.`

Mục đích: chống account enumeration.

## 9. Reset Password

Tạo reset token:
- Cryptographically secure.
- Single-use.
- Expire khoảng 15–30 phút.
- Ưu tiên lưu hash token thay vì raw token.
- Token cũ có thể invalid khi tạo token mới.

Link production:

`https://www.tattantat.vn/reset-password?token=...`

Trang reset:
- Mật khẩu mới.
- Nhập lại mật khẩu.
- CTA **Đổi mật khẩu**.

Không gửi mật khẩu mới qua email.

Sau reset:
- Invalidate reset token.
- Cân nhắc revoke các session cũ theo cơ chế auth hiện tại.

## 10. Email chính thức

Mọi email authentication phải gửi từ:

**Tất Tần Tật <hotro@tattantat.vn>**

ENV tham khảo:

```env
MAIL_FROM_NAME="Tất Tần Tật"
MAIL_FROM_ADDRESS="hotro@tattantat.vn"

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SECURE=
```

Tạo `MailService`/adapter để có thể đổi SMTP/transactional provider mà không sửa business logic.

Production cần cấu hình/xác minh:
- SPF.
- DKIM.
- DMARC.

Không báo email production hoàn tất nếu DNS/provider chưa được cấu hình thực tế.

## 11. Welcome Email

Subject:

**Chào mừng bạn đến với Tất Tần Tật! 🎉**

From:

**Tất Tần Tật <hotro@tattantat.vn>**

Nội dung:

```text
Xin chào {{name}},

Chúc mừng bạn đã đăng ký tài khoản Tất Tần Tật thành công!

Từ bây giờ, bạn có thể khám phá, mua bán và kết nối thuận tiện hơn trên Tất Tần Tật.

Bạn có thể:
• Đăng tin mua bán
• Lưu tin yêu thích
• Quản lý tin đăng
• Nhắn tin và giao dịch trên Tất Tần Tật
• Theo dõi hoạt động tài khoản

Khám phá Tất Tần Tật:
https://www.tattantat.vn

Cảm ơn bạn đã đồng hành cùng Tất Tần Tật.

Tất Tần Tật
Mua bán dễ dàng – Kết nối mọi người
hotro@tattantat.vn
```

Email HTML:
- Logo.
- Xanh thương hiệu.
- Responsive.
- CTA **Khám phá ngay**.
- Plain-text fallback.

Welcome email chỉ gửi cho đăng ký mới, không gửi lại mỗi lần OAuth login.

## 12. Reset Email

Subject:

**Đặt lại mật khẩu Tất Tần Tật**

Nội dung:

```text
Xin chào {{name}},

Tất Tần Tật nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

[ĐẶT LẠI MẬT KHẨU]

Liên kết này sẽ hết hạn sau {{expiry}} phút.

Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email.

Không chia sẻ liên kết đặt lại mật khẩu cho bất kỳ ai.

Tất Tần Tật
hotro@tattantat.vn
```

## 13. Email Verification

Nếu hệ thống yêu cầu verification:
- Subject: **Xác minh email Tất Tần Tật**
- CTA: **Xác minh email**
- Token secure + expiry + single-use.
- Có **Gửi lại email xác minh** và rate-limit.

## 14. Database tham khảo

Điều chỉnh theo ORM hiện tại.

```text
User
- id
- name
- email
- emailVerifiedAt
- phone
- phoneVerifiedAt
- passwordHash
- avatarUrl
- status
- lastLoginAt
- createdAt
- updatedAt

Account
- id
- userId
- provider
- providerAccountId
- createdAt
- updatedAt

PasswordResetToken
- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt

EmailVerificationToken
- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt

OTP
- id
- phone
- codeHash
- purpose
- expiresAt
- attemptCount
- usedAt
- createdAt
```

User status tối thiểu:
- ACTIVE.
- SUSPENDED.
- BANNED.
- PENDING_VERIFICATION.

## 15. Session và Password Security

Ưu tiên auth/session mechanism hiện tại.

Cookie production:
- HttpOnly.
- Secure.
- SameSite phù hợp.
- Scope tối thiểu cần thiết.

Không lưu access token nhạy cảm vào localStorage nếu có thể dùng HttpOnly cookie.

Password:
- Dùng thuật toán hiện đại theo framework/library, ví dụ Argon2id hoặc bcrypt với cost phù hợp.
- Không plaintext.
- Không reversible encryption.
- Không log password.
- Không gửi password qua email.

## 16. Bảo mật API

Bảo vệ phù hợp:
- CSRF với cookie-based auth.
- XSS.
- Injection.
- Backend validation độc lập.
- Rate limiting.
- Brute-force protection.
- Generic errors chống account enumeration.

Rate-limit tối thiểu:
- login,
- register,
- forgot password,
- reset attempts,
- send OTP,
- verify OTP,
- resend OTP,
- resend verification email.

Không khóa tài khoản vĩnh viễn chỉ vì một IP tấn công.

## 17. Auth State toàn website

Khi chưa login:
`Tài khoản`

Khi đã login:
- Avatar.
- Tên/tên viết tắt.
- Dropdown:
  - Hồ sơ cá nhân.
  - Tin đăng của tôi.
  - Yêu thích.
  - Tin nhắn.
  - Cài đặt tài khoản.
  - Đăng xuất.

Không gọi endpoint `/me` lặp lại vô ích ở từng component.

Logout phải:
- invalidate/revoke session nếu cơ chế hỗ trợ,
- clear cookie/token,
- clear dữ liệu riêng tư của user cũ khỏi frontend cache.

## 18. Modal State

Có thể dùng:

```text
LOGIN
REGISTER
PHONE
OTP
FORGOT_PASSWORD
RESET_SENT
VERIFY_EMAIL
SUCCESS
```

Có nút Back ở các flow con.

## 19. Accessibility

Modal:
- `role="dialog"`.
- `aria-modal="true"`.
- Focus trap.
- Escape để đóng.
- Mở modal focus field đầu tiên.
- Đóng modal trả focus về trigger.
- Input có label.
- Error liên kết input.
- Tab order đúng.
- OAuth buttons có accessible name.

## 20. Loading & Error UX

CTA async:
- Disable khi submit.
- Spinner.
- Chống double submit.

Text ví dụ:
- `Đang đăng nhập...`
- `Đang gửi mã...`
- `Đang tạo tài khoản...`

Không hiển thị raw backend error.

## 21. API tham khảo

Chỉ tạo custom endpoint nếu auth framework hiện tại chưa xử lý.

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

POST /api/auth/phone/send-otp
POST /api/auth/phone/verify-otp

POST /api/auth/forgot-password
POST /api/auth/reset-password

POST /api/auth/email/send-verification
POST /api/auth/email/verify

GET /api/auth/me
```

## 22. Environment Variables

Tạo/cập nhật `.env.example`; không commit secret thật.

```env
APP_URL=https://www.tattantat.vn
AUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

MAIL_FROM_NAME="Tất Tần Tật"
MAIL_FROM_ADDRESS="hotro@tattantat.vn"

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SECURE=

SMS_PROVIDER=
SMS_API_KEY=
SMS_SENDER_ID=
```

Dùng naming convention thực tế của project nếu khác.

## 23. OAuth Callback

Sau khi triển khai phải báo chính xác callback URL thực tế để cấu hình tại provider console.

Ví dụ chỉ mang tính tham khảo:

```text
https://www.tattantat.vn/api/auth/callback/google
https://www.tattantat.vn/api/auth/callback/facebook
https://www.tattantat.vn/api/auth/callback/apple
```

Không mặc định dùng các URL này nếu auth library thực tế dùng route khác.

## 24. Email Queue và Race Conditions

Nếu project có queue, gửi welcome/transactional email qua queue với retry có giới hạn.

SMTP lỗi tạm thời không nên làm rollback một tài khoản đã tạo hợp lệ một cách không cần thiết.

Xử lý race conditions:
- Hai registration cùng email.
- OAuth callback lặp.
- OTP submit đồng thời.
- Token verify đồng thời.
- Welcome email duplicate.

Dùng database constraint/idempotency phù hợp làm lớp bảo vệ cuối cùng.

## 25. Analytics/Security Events

Nếu project có analytics, có thể ghi:

```text
auth_modal_open
login_success
login_failed
register_success
oauth_start
oauth_success
phone_otp_requested
phone_login_success
forgot_password_requested
password_reset_success
logout
```

Không gửi/log password, OTP, reset token hoặc OAuth token.

Backend có thể audit:
- login success/failure,
- password reset,
- password changed,
- provider linked,
- phone/email verified,
- logout/revocation.

## 26. Tests bắt buộc

### Registration
- Thành công.
- Email invalid.
- Password invalid.
- Confirmation mismatch.
- Duplicate email.
- Chưa đồng ý điều khoản.
- Welcome email chỉ một lần.

### Login
- Thành công.
- Sai password.
- Suspended/Banned.
- Rate-limit.

### OAuth
- Google/Facebook/Apple success.
- Cancel/error.
- Existing provider.
- Safe account linking.

### Phone
- OTP đúng/sai/hết hạn.
- OTP single-use.
- Resend quá nhanh.
- Brute-force protection.

### Password reset
- Request.
- Unknown email trả generic response.
- Token hợp lệ/hết hạn/đã dùng.
- Token không reuse được.
- Password policy.

### Session
- Login tạo session.
- Logout invalid session.
- Production cookie flags đúng.

### Email
- Welcome.
- Reset.
- Verification.
- HTML responsive + plain text.
- From đúng `Tất Tần Tật <hotro@tattantat.vn>`.
- Automated tests không gửi email production thật.

## 27. Acceptance Criteria

Chỉ coi hoàn thành khi:
1. Login/register hoạt động bằng popup.
2. Email/password hoạt động.
3. Google login hoạt động khi credentials được cấu hình.
4. Facebook login hoạt động khi credentials được cấu hình.
5. Apple login hoạt động khi credentials được cấu hình.
6. Phone OTP hoạt động khi SMS provider được cấu hình.
7. Không tạo duplicate account không cần thiết.
8. Account linking an toàn.
9. Welcome email dùng `hotro@tattantat.vn`.
10. Forgot password chống account enumeration.
11. Reset token expiry + single-use.
12. Password hash an toàn.
13. Session/cookie production an toàn.
14. Endpoint nhạy cảm có rate-limit.
15. Không có secret trong source code.
16. Responsive desktop/mobile.
17. Accessibility/keyboard hoạt động.
18. Không phá chức năng hiện tại.
19. Không có console error nghiêm trọng.
20. Build/lint/typecheck/tests pass.
21. `.env.example` đầy đủ.
22. Có tài liệu cấu hình OAuth, SMTP/DNS và SMS.

## 28. Bàn giao sau khi code

Báo rõ:

**A. Files:** file mới, file sửa, migration.

**B. Database:** schema/migration.

**C. ENV:** tất cả biến cần cấu hình, không hiển thị secret thật.

**D. OAuth:** callback URL chính xác cho Google, Facebook, Apple.

**E. Email:** provider/SMTP, From address, checklist SPF/DKIM/DMARC.

**F. SMS:** provider adapter, ENV và cách test development an toàn.

**G. Testing:** test/lint/typecheck/build đã chạy và kết quả.

**H. Production checklist:** các bước còn phải thực hiện ở provider console, DNS hoặc hosting.

## 29. Yêu cầu cuối cùng cho Coding Agent

Hãy **kiểm tra codebase trước rồi triển khai trực tiếp**, không chỉ tạo giao diện mẫu.

Ưu tiên theo thứ tự:
1. Security.
2. Không duplicate account.
3. UX đơn giản.
4. Maintainability.
5. Khả năng mở rộng.
6. Tương thích kiến trúc hiện tại.

Tuyệt đối không:
- hard-code secret,
- OAuth giả,
- OTP bypass trên production,
- lưu password plaintext,
- gửi password qua email,
- auto-link account thiếu an toàn,
- chỉ validate frontend,
- báo OAuth/email/SMS production đã hoàn tất khi credentials, DNS hoặc provider bên ngoài chưa được cấu hình.

Sau khi triển khai, tự review toàn bộ authentication flow, sửa lỗi tìm thấy, chạy test/build và phân biệt rõ:
- phần đã hoàn thành,
- phần cần credentials,
- phần cần cấu hình provider console,
- phần cần DNS trước khi đưa production.
