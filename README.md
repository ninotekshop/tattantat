# Tất Tần Tật Android

Ứng dụng marketplace C2C Android, khởi tạo ở Phase 1 với Kotlin, Jetpack Compose, Material 3, Hilt, Navigation Compose, Retrofit/OkHttp, Room, DataStore và Coil.

## Mở và build

1. Mở thư mục này bằng Android Studio (JDK 17+ và Android SDK API 35).
2. Đồng bộ Gradle, rồi chạy cấu hình `app` trên emulator API 26+.
3. Dùng `./gradlew.bat assembleDebug`, `./gradlew.bat testDebugUnitTest`, và `./gradlew.bat lintDebug` trên Windows.

## Kiến trúc

- `core`: hạ tầng dùng chung - UI state, API result, Retrofit, Room, DataStore, theme.
- `data`: implementation repository và nguồn dữ liệu; hiện Home dùng dữ liệu mẫu, sẵn sàng thay bằng NestJS API.
- `domain`: model độc lập với Android.
- `presentation`: Compose screen + ViewModel theo từng feature.

URL môi trường development nằm ở `BuildConfig.API_BASE_URL`; không có token hay thông tin bí mật được ghi cứng. Business logic sẽ thuộc NestJS API, client chỉ điều phối hiển thị/trạng thái.

## Phase 1 đã có

Splash entry point (hệ thống), Home prototype, category và product card, trạng thái Loading/Empty/Error, bottom navigation năm mục và skeleton feature. Các tab chưa thuộc Phase 1 hiện có trạng thái “sắp có mặt”.

## Phase 2 đã có

Luồng Splash → Login / Register → OTP → ứng dụng chính, API contract cho `/auth/login`, `/auth/register`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout`, xử lý lỗi mạng và refresh token. API backend chưa được triển khai nên đăng nhập thực chỉ hoạt động khi NestJS cung cấp đúng contract này.

### Tài khoản demo (debug only)

| Vai trò | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Quản trị | `admin@tattantat.vn` | `Demo@123` |
| Người dùng | `user@tattantat.vn` | `Demo@123` |

Hai tài khoản này chỉ được biên dịch vào APK debug để thử giao diện; APK release không chứa chúng.
