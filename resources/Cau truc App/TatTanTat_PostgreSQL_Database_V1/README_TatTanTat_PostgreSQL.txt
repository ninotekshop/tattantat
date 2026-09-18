TẤT TẦN TẬT - PostgreSQL Database V1.0

File chính:
TatTanTat_PostgreSQL_Database_V1.sql

Yêu cầu:
- PostgreSQL 15+
- Quyền tạo extension pgcrypto và citext

Cách chạy:
1. Tạo database, ví dụ: tattantat
2. Mở pgAdmin/psql
3. Chạy toàn bộ file SQL trong một lần.

File tạo:
- 32 bảng chính
- ENUM trạng thái
- PK/FK/UNIQUE/CHECK
- Index cho các truy vấn quan trọng
- Trigger updated_at
- Lịch sử trạng thái sản phẩm/đơn hàng
- Tự cập nhật rating người dùng
- Seed danh mục và thương hiệu mẫu

Kiến trúc đi kèm:
PostgreSQL = dữ liệu giao dịch chính
Redis = cache/OTP/rate limit/queue
OpenSearch/Elasticsearch = tìm kiếm
Object Storage = ảnh/video/tài liệu
WebSocket = chat realtime

Lưu ý:
province_id/district_id/ward_id để BIGINT để có thể nối với bộ dữ liệu địa giới hành chính Việt Nam sau này.
