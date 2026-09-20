# Hướng dẫn Khắc phục Lỗi trên Hostinger (503 & 404 "Cannot GET /")

## 1. Nguyên nhân lỗi `{"message":"Cannot GET /","error":"Not Found","statusCode":404}`

Phản hồi dạng JSON:
```json
{"message":"Cannot GET /","error":"Not Found","statusCode":404}
```
Đây là **phản hồi 404 mặc định của NestJS Backend** khi truy cập vào đường dẫn gốc `/` (vì API NestJS đặt tiền tố là `/api/v1`).

Lỗi này xảy ra khi Hostinger chạy thẳng NestJS Backend (`backend/dist/main.js`) cho tên miền chính `tattantat.vn` thay vì chạy ứng dụng **Next.js Web Frontend** (`web/`).

### Giải pháp trong Codebase mới:
Tệp `server.js` ở thư mục gốc vừa được nâng cấp để **tự động đồng thời khởi chạy cả hai**:
1. Tự động bật **NestJS Backend** ở cổng nội bộ `3000` (phục vụ các API `/api/v1/...`).
2. Tự động bật **Next.js Web Frontend** ở cổng máy chủ Hostinger cấp (`process.env.PORT`) phục vụ giao diện trang web tại `tattantat.vn`.
3. Next.js tự động proxy các request `/api/v1/...` sang NestJS Backend.

---

## 2. Các bước triển khai chuẩn trên Hostinger hPanel

### Bước 1: Cấu hình Node.js Application trên hPanel
Vào **Hostinger hPanel** -> **Node.js** (hoặc Web Applications):
- **Node.js Version**: Chọn `18.x` hoặc `20.x` (Yêu cầu >= 18.18.0 cho Next.js 16).
- **Application Mode**: `Production`
- **Application Root**: `/` (thư mục gốc chứa repository)
- **Application Startup File**: `server.js`

### Bước 2: Kéo Code mới & Chạy Build trên Hostinger Terminal
1. Mở **SSH / Terminal** trong Hostinger hPanel.
2. Chạy lệnh:
   ```bash
   git pull origin main
   npm install
   npm run build
   ```
   *(Lệnh `npm run build` sẽ đóng gói cả `web` và `backend`)*.
3. Nhấn **Restart Application** trong hPanel.

---

## 3. Cấu hình biến môi trường `.env`

Tạo file `web/.env.local` nếu chưa có:
```env
API_INTERNAL_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_API_URL=https://tattantat.vn/api/v1
```

Tạo file `backend/.env` nếu chưa có:
```env
PORT=3000
DATABASE_URL=postgresql://postgres.brabreqaarmuowymfnkl:PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
JWT_SECRET=tat_tan_tat_secret_key_2026
```
