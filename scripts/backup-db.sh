#!/usr/bin/env bash
# Sao lưu cơ sở dữ liệu bằng pg_dump. Dùng: DATABASE_URL=... ./scripts/backup-db.sh [thư_mục_đích]
# Giữ 14 bản gần nhất. Nên chép thư mục đích ra nơi lưu trữ khác (ổ ngoài / S3 / Google Drive).
set -euo pipefail
: "${DATABASE_URL:?Cần đặt DATABASE_URL}"
DEST="${1:-./backups}"; mkdir -p "$DEST"
FILE="$DEST/tattantat-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$FILE"
test -s "$FILE" || { echo "Sao lưu rỗng — kiểm tra kết nối" >&2; rm -f "$FILE"; exit 1; }
ls -1t "$DEST"/tattantat-*.sql.gz | tail -n +15 | xargs -r rm -f
echo "Đã sao lưu: $FILE ($(du -h "$FILE" | cut -f1))"
