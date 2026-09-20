# Tất Tần Tật Web

Frontend Next.js dùng chung REST API NestJS với ứng dụng Android.

## Chạy local

1. Tạo `web/.env.local` từ `web/.env.example`.
2. Chạy backend tại cổng 3000 (`backend: npm run start:dev`).
3. Chạy web (`web: npm run dev`). Web mở ở `http://localhost:3001`.

Backend tự cho phép `localhost:3001` khi chạy development. Khi triển khai, đặt `CORS_ORIGINS` trên backend thành domain web thực tế, ví dụ `https://tattantat.vn`.

## Bước đang có

Trang chủ lấy trực tiếp danh mục, tìm kiếm và danh sách tin đăng từ API. Những bước kế tiếp sẽ thêm trang chi tiết sản phẩm, đăng nhập và khu vực người bán/quản trị.
