# Hướng dẫn sửa lỗi 503 Service Unavailable trên Hostinger

Lỗi **503 Service Unavailable** xuất hiện khi LiteSpeed/Nginx trên Hostinger không kết nối được tới tiến trình Node.js (do tiến trình bị ngắt, chưa build, hoặc sai file khởi chạy).

## Các thay đổi đã được cập nhật trong Codebase
1. **Thêm `server.js` ở gốc dự án & `web/server.js`**: Giúp Hostinger Passenger / Node.js Manager nhận diện file khởi chạy chuẩn.
2. **Loại bỏ cổng cứng `--port 3001`**: Giúp Next.js lắng nghe cổng động `process.env.PORT` do Hostinger chỉ định.
3. **Cập nhật `package.json` ở gốc**: Cho phép chạy `npm run build` để build cả `web` và `backend` chỉ với 1 lệnh.

---

## Các bước xử lý trên Hostinger hPanel (Shared / Cloud Hosting)

### Bước 1: Khai báo Cấu hình Node.js trên hPanel
Vào **Hostinger hPanel** -> **Node.js** (hoặc Web Applications):
- **Node.js Version**: Chọn `18.x` hoặc `20.x` (Bắt buộc >= 18.18.0 cho Next.js 16).
- **Application Mode**: `Production`
- **Application Root**: `/` (hoặc `public_html` nếu clone ở thư mục gốc, hoặc `web`)
- **Application Startup File**: `server.js`

### Bước 2: Chạy npm install & npm run build
1. Vào **Hostinger hPanel** -> **SSH / Terminal** (hoặc dùng Git Webhook / Terminal).
2. Di chuyển vào thư mục dự án và chạy:
   ```bash
   npm install
   npm run build
   ```
3. Khởi động lại ứng dụng Node.js trong hPanel (bấm **Restart Application**).

---

## Các bước xử lý trên Hostinger VPS (Ubuntu / Debian + Nginx + PM2)

1. Kết nối SSH vào VPS.
2. Kiểm tra log lỗi:
   ```bash
   pm2 status
   pm2 logs
   ```
3. Cập nhật và build lại ứng dụng:
   ```bash
   cd /var/www/tattantat
   git pull origin main
   npm install
   npm run build
   pm2 restart all
   ```

---

## Kiểm tra File Môi trường `.env`
Đảm bảo đã tạo file cấu hình môi trường:
- `web/.env.local`:
  ```env
  API_INTERNAL_BASE_URL=http://localhost:3000/api/v1
  NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
  ```
- `backend/.env`:
  ```env
  PORT=3000
  DATABASE_URL=postgresql://...
  JWT_SECRET=your_jwt_secret
  ```
