# Hướng dẫn phát hành app Tất Tần Tật (Android + iOS)

App nằm trong thư mục `mobile/` (Expo SDK 57 / React Native, một mã nguồn cho cả hai nền tảng).
Build và đẩy lên cửa hàng bằng Codemagic theo file `codemagic.yaml` ở thư mục gốc.

## 1. Firebase (project `tattantat-f6254` — project trong `google-services.json`)

1. Authentication → Sign-in method → bật **Phone**.
2. Project settings → Your apps:
   - App Android `com.tattantat.app`: thêm **SHA-1 và SHA-256** của *upload key* (Codemagic keystore) và của *App signing key* (Google Play Console → Thiết lập → Tính toàn vẹn ứng dụng). Tải lại `google-services.json`.
   - Thêm app **iOS** `com.tattantat.app`, tải `GoogleService-Info.plist`.
3. Cloud Messaging → Apple app configuration → tải lên **APNs Authentication Key (.p8)** (tạo ở Apple Developer → Keys, bật Apple Push Notifications service). Cần cho thông báo đẩy và OTP trên iOS.
4. Máy chủ (Hostinger) phải có khóa `firebase-service-account.json` của project này (đang dùng cho thông báo đẩy). Backend tự thử cả khóa web và khóa app khi xác thực OTP.

## 2. Google Sign-In (Google Cloud Console → APIs & Services → Credentials, cùng project OAuth với web)

- Web Client ID hiện có (`927392714442-…`) dùng chung để lấy idToken → đặt vào biến `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Tạo **OAuth client Android** (package `com.tattantat.app` + SHA-1 upload key và SHA-1 app signing key).
- Tạo **OAuth client iOS** (bundle `com.tattantat.app`) → lấy *iOS URL scheme* (dạng `com.googleusercontent.apps.…`) → biến `GOOGLE_IOS_URL_SCHEME`.
- Backend: nếu thêm client ID khác, khai báo `GOOGLE_CLIENT_IDS` (phân cách dấu phẩy) trong hPanel.

## 3. Apple Developer / App Store Connect

1. Identifiers → App ID `com.tattantat.app`, bật **Sign In with Apple** và **Push Notifications**.
2. App Store Connect → My Apps → tạo app mới (tên "Tất Tần Tật", bundle `com.tattantat.app`).
3. Users and Access → Integrations → **App Store Connect API** → tạo key (quyền App Manager), tải file .p8.
4. Backend: nếu web cũng đăng nhập Apple bằng Services ID, khai báo `APPLE_CLIENT_IDS=com.tattantat.app,<services-id>` trong hPanel.

## 4. Google Play Console

1. Tạo ứng dụng "Tất Tần Tật", package `com.tattantat.app`.
2. Google Cloud → tạo **service account**, cấp quyền trong Play Console (Users and permissions → mời email service account, quyền Release). Tải khóa JSON.
3. Lần phát hành đầu tiên: tải file `.aab` (artifact của Codemagic) lên tay ở **Kiểm thử nội bộ**; các lần sau Codemagic tự đẩy.

## 5. Codemagic

1. Add application → chọn repo GitHub `ninotekshop/tattantat`, loại *codemagic.yaml*.
2. Team settings → **Global variables and secrets**:
   - Nhóm `tattantat_mobile`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_URL_SCHEME`, `IOS_GOOGLE_SERVICES_PLIST` (base64 của plist, Secure), `ANDROID_GOOGLE_SERVICES_JSON` (base64 của google-services.json, Secure).
   - Nhóm `google_play`: `GCP_SERVICE_ACCOUNT_CREDENTIALS` (nội dung file JSON service account, Secure).
   - Lấy base64 trong **MSYS2 UCRT64**: `base64 -w0 GoogleService-Info.plist` rồi dán kết quả.
3. Code signing identities:
   - **Android keystores** → Generate/Upload keystore, đặt *Reference name* `tattantat_upload`. Giữ bản sao keystore + mật khẩu ở nơi an toàn (mất là không cập nhật app được).
   - **iOS**: Integrations → App Store Connect → thêm API key, đặt tên `tattantat_asc`. Codemagic tự tạo chứng chỉ và provisioning profile.
4. Build: gắn tag `app-v1.0.0` rồi push (hoặc bấm *Start new build* chọn workflow `android-release` / `ios-release`).
   - Đổi phiên bản hiển thị: sửa `APP_VERSION` trong `codemagic.yaml`. Số build tự tăng.

## 6. Hồ sơ cửa hàng (bắt buộc trước khi duyệt)

- Chính sách bảo mật: `https://tattantat.vn/privacy`. Điều khoản: `https://tattantat.vn/terms`.
- **Xóa tài khoản**: có sẵn trong app (Tài khoản → Xóa tài khoản). Google Play còn yêu cầu một đường dẫn web để yêu cầu xóa — có thể dùng trang hướng dẫn hoặc email hotro@tattantat.vn.
- Google Play: điền Data safety (thu thập: tên, email, SĐT, ảnh, vị trí gần đúng, tin nhắn; mã hóa khi truyền; người dùng xóa được), Content rating, đối tượng (18+ khuyến nghị cho sàn mua bán).
- App Store: Privacy Nutrition Labels tương tự; cung cấp **tài khoản demo** (email + mật khẩu) cho đội duyệt Apple; ảnh chụp màn hình 6.7" và 6.5".

## 7. Chạy thử trên máy

App dùng thư viện native (Firebase, Google Sign-In) nên **không chạy bằng Expo Go**. Dùng bản build *Kiểm thử nội bộ* (Google Play) / *TestFlight* (iOS), hoặc build development trên máy có Android Studio/Xcode: `cd mobile && npm install && npx expo run:android`.
