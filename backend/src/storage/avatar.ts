/** Thumbnail 96px của ảnh đại diện đã lưu trên Storage; ảnh ngoài (Google/FB/Zalo...) giữ nguyên; data URL không trả trong danh sách. */
export function avatarThumb(url?: string | null): string | null {
  if (!url || url.startsWith('data:')) return null;
  return /\/avatars\/[^?]+\.jpg$/.test(url) && !url.endsWith('_s.jpg') ? url.replace(/\.jpg$/, '_s.jpg') : url;
}
