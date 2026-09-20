# Hướng dẫn Khắc phục Lỗi trên Hostinger (503, 404 & Timeout listen 3s)

## 1. Nguyên nhân lỗi `App did not call listen() within 3 seconds`

Máy chủ Hostinger Node.js giám sát tiến trình ngay khi khởi động. Nếu tệp entrypoint không gọi `http.createServer().listen()` trong vòng 3 giây, Hostinger sẽ ngắt container và báo lỗi timeout.

### Nguyên nhân trước đây:
Trước đây, lệnh `listen()` nằm bên trong callback bất đồng bộ `app.prepare().then(...)` của Next.js. Do Next.js cần 5 - 10 giây để nạp các route, lệnh `listen()` bị trì hoãn quá 3 giây.

### Giải pháp đã cập nhật trong `web/server.js`:
- Lệnh `server.listen(port)` hiện được gọi **đồng bộ ngay lập tức** trong dưới 0.1 giây khi file được nạp.
- `app.prepare()` của Next.js tiếp tục chuẩn bị ngầm ở background. Nếu request tới trong lúc chuẩn bị, server sẽ tự động chờ xong rồi xử lý.
- Giúp ứng dụng vượt qua bài kiểm tra sức khỏe (health check) của Hostinger tức thì.

---

## 2. Nguyên nhân lỗi `{"message":"Cannot GET /","error":"Not Found","statusCode":404}`

Đây là phản hồi 404 của NestJS khi Hostinger chạy duy nhất Backend API thay vì Web Frontend.

Tệp `server.js` ở góc dự án hiện tự động:
1. Chạy **NestJS Backend** ở cổng nội bộ `3000`.
2. Chạy **Next.js Web Frontend** ở cổng máy chủ Hostinger cấp (`process.env.PORT`).
3. Next.js tự động chuyển tiếp (proxy) các request `/api/v1/...` sang NestJS Backend.

---

## 3. Các bước triển khai chuẩn trên Hostinger hPanel

### Bước 1: Cấu hình Node.js Application trên hPanel
Vào **Hostinger hPanel** -> **Node.js** (hoặc Web Applications):
- **Node.js Version**: Chọn `18.x` hoặc `20.x` (Yêu cầu >= 18.18.0 cho Next.js 16).
- **Application Mode**: `Production`
- **Application Root**: `/` (thư mục gốc chứa repository) hoặc `web`
- **Application Startup File**: `server.js`

### Bước 2: Kéo Code mới & Chạy Build trên Hostinger Terminal
1. Mở **SSH / Terminal** trong Hostinger hPanel (hoặc bấm **Redeploy** trên giao diện).
2. Chạy lệnh:
   ```bash
   git pull origin main
   npm install
   npm run build
   ```
3. Nhấn **Restart Application** (Khởi động lại ứng dụng).

---

## 4. Cấu hình biến môi trường `.env`

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
