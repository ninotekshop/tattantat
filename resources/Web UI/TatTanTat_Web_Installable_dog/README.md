# Tất Tần Tật – Web UI Installable

Bộ này là phiên bản **frontend tĩnh chạy độc lập** của giao diện Tất Tần Tật đã duyệt.

## Chạy nhanh

Không cần Node.js:

1. Giải nén thư mục.
2. Mở `index.html` bằng Chrome/Edge.

## Chạy bằng local server (khuyến nghị)

Nếu có Python:

```bash
python -m http.server 8080
```

Sau đó mở:

`http://localhost:8080`

## Cấu trúc

- `index.html` – giao diện trang chủ.
- `styles.css` – Design System và responsive UI.
- `app.js` – tìm kiếm demo, lọc danh mục, yêu thích, menu mobile, modal đăng tin.
- `assets/` – logo và hình ảnh cục bộ.
- `assets/design-reference.png` – ảnh thiết kế tham chiếu đã duyệt.

## Lưu ý triển khai thật

Đây là frontend demo/production-ready UI, chưa nối API thật.

Các điểm cần nối vào Backend Tất Tần Tật:
- Authentication
- Search API
- Categories API
- Listings API
- Favorites API
- Upload ảnh/video
- Chat/WebSocket
- Notifications
- Dynamic Listing Form Engine
- Advertisement API

Không có dữ liệu marketplace thật được hard-code ở Backend; các card hiện tại chỉ là dữ liệu mẫu để kiểm tra UI.
