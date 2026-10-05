# Cấu hình đăng nhập mạng xã hội trên app

Facebook và Zalo đăng nhập qua trình duyệt, máy chủ Tất Tần Tật đổi mã lấy phiên. Google và Apple dùng SDK gốc (chỉ chạy trong bản build, không chạy trong Expo Go).

Địa chỉ callback (khai báo trong từng nhà cung cấp):
- Facebook: https://tattantat.vn/api/v1/auth/oauth/facebook/callback
- Zalo:     https://tattantat.vn/api/v1/auth/oauth/zalo/callback

## Facebook (developers.facebook.com)
1. App > Facebook Login > Settings > Valid OAuth Redirect URIs: thêm địa chỉ callback Facebook ở trên.
2. App ở chế độ Live (nếu để Development thì chỉ tài khoản vai trò Admin/Tester đăng nhập được).
3. Hostinger > Environment variables: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET.

## Zalo (developers.zalo.me)
1. Tạo ứng dụng > Đăng nhập với Zalo > Callback URL: thêm địa chỉ callback Zalo ở trên.
2. Hostinger > Environment variables: ZALO_APP_ID, ZALO_APP_SECRET.
3. Zalo không trả email nên tài khoản tạo từ Zalo chưa có email/SĐT; người dùng bổ sung trong Hồ sơ.

## Apple (chỉ iOS)
Dùng Sign in with Apple gốc, bundle id com.tattantat.app (biến APPLE_CLIENT_IDS nếu cần đổi).

## Tùy chọn
PUBLIC_API_URL: đặt khi máy chủ nằm sau proxy làm sai địa chỉ callback (ví dụ https://tattantat.vn/api/v1).
